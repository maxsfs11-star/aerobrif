require("dotenv").config();
const cheerio = require("cheerio");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

// 🔓 CORS 100% Livre
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Torre AEROBRIF: Nova API Online!"));

// ✈️ NOVA API DE RADAR: ADSB.lol (Open-source, não precisa de senha!)
app.get("/api/radar", async (req, res) => {
  try {
    // Busca aviões num raio de 1000 milhas do centro do Brasil
    const response = await axios.get(
      "https://api.adsb.lol/v2/lat/-15.0/lon/-50.0/dist/1000",
      { timeout: 8000 },
    );

    if (!response.data || !response.data.ac) {
      return res.json([]);
    }

    // Pega até 50 aviões para não pesar o mapa e converte pro nosso formato
    const voos = response.data.ac.slice(0, 50).map((voo) => ({
      id: voo.flight ? voo.flight.trim() : voo.hex,
      lat: voo.lat,
      lng: voo.lon,
      altitude: voo.alt_baro === "ground" ? 0 : voo.alt_baro || 0,
      velocidade: voo.gs || 0,
    }));

    res.json(voos);
  } catch (error) {
    console.log("Erro no Radar ADSB:", error.message);
    res.json([]);
  }
});

// 🌤️ CLIMA: NOAA (Oficial, não precisa de senha)
app.get("/api/metar/:icao", async (req, res) => {
  try {
    const response = await axios.get(
      `https://aviationweather.gov/api/data/metar?ids=${req.params.icao}&format=json`,
    );
    res.json(response.data);
  } catch (e) {
    res.json([{ rawOb: "METAR Indisponível." }]);
  }
});

app.get("/api/taf/:icao", async (req, res) => {
  try {
    const response = await axios.get(
      `https://aviationweather.gov/api/data/taf?ids=${req.params.icao}&format=json`,
    );
    res.json(response.data);
  } catch (e) {
    res.json([{ rawTAF: "TAF Indisponível." }]);
  }
});

app.get("/api/notam/:icao", async (req, res) => {
  try {
    const icao = req.params.icao.toUpperCase();
    const response = await axios.get(
      `https://aisweb.decea.mil.br/?i=notam&loc=${icao}`,
    );
    const $ = cheerio.load(response.data);
    const notams = [];

    // O AISWEB geralmente usa tags de cabeçalho (h5, h4) para a etiqueta e <p> para o texto
    $("h5").each((i, el) => {
      if (notams.length >= 3) return;

      const titulo = $(el).text().trim(); // Pega: "F1743/26 N 13/04/2026 19:39"

      const corpoElement = $(el).next("p");
      const corpo = corpoElement.text().trim(); // Pega o texto que começa com Q)

      // O DECEA costuma colocar a validade (calendário) no elemento logo abaixo do texto
      const validade = corpoElement.next().text().trim();

      if (titulo && corpo && corpo.includes("Q)")) {
        notams.push({
          titulo: titulo,
          corpo: corpo,
          validade: validade, // 👈 Nova informação enviada para o painel!
        });
      }
    });

    // Plano B: Se o site do DECEA mudar o HTML, tentamos ler os parágrafos diretos
    if (notams.length === 0) {
      $("p").each((i, el) => {
        if (notams.length >= 3) return;
        const texto = $(el).text().trim();
        if (texto.includes("Q)")) {
          // Extrai a etiqueta (Ex: F1234/26) usando Regex se estiver tudo junto
          const match = texto.match(/([A-Z]\d{4}\/\d{2})/);
          const titulo = match ? match[0] : "NOTAM DECEA";
          notams.push({ titulo: titulo, corpo: texto });
        }
      });
    }

    // Retorna a lista estruturada ou um aviso de pista livre
    res.json(
      notams.length > 0
        ? notams
        : [{ titulo: "✅ STATUS", corpo: "Nenhum NOTAM crítico para hoje." }],
    );
  } catch (e) {
    console.error("Erro no Radar DECEA:", e.message);
    res.json([
      {
        titulo: "❌ ERRO DE SINAL",
        corpo: "Servidor do DECEA indisponível no momento.",
      },
    ]);
  }
});

// ⚠️ ROTAER: DECEA (AISWEB)
app.get("/api/rotaer/:icao", async (req, res) => {
  try {
    const icao = req.params.icao.toUpperCase();
    const response = await axios.get(
      `https://aisweb.decea.mil.br/?i=aerodromos&codigo=${icao}`,
    );
    const $ = cheerio.load(response.data);
    const rotaerInfo = [];

    // O AISWEB usa a tag <p> e <h4/h5> para os textos do ROTAER.
    // Vamos raspar o miolo da página e extrair as linhas que contém os dados críticos.
    $("p, li, h5").each((i, el) => {
      const texto = $(el).text().replace(/\s\s+/g, " ").trim();

      // Filtra apenas as linhas relevantes do manual
      if (
        texto.startsWith("COM -") ||
        texto.startsWith("RMK -") ||
        texto.startsWith("CMB -") ||
        texto.startsWith("MET -") ||
        texto.startsWith("a.") || // Pega os sub-itens do RMK
        texto.startsWith("b.") ||
        texto.startsWith("c.")
      ) {
        if (!rotaerInfo.includes(texto) && texto.length > 5) {
          rotaerInfo.push(texto);
        }
      }
    });

    res.json(
      rotaerInfo.length > 0
        ? rotaerInfo
        : [
            "⚠️ Informações detalhadas disponíveis apenas no documento original.",
          ],
    );
  } catch (e) {
    console.error("Erro no Radar ROTAER:", e.message);
    res.json(["❌ Servidor do DECEA indisponível para ROTAER."]);
  }
});

// LIGANDO O SERVIDOR
app.listen(process.env.PORT || 10000, () =>
  console.log(`✅ Hangar aberto com Nova API!`),
);

// ✈️ RADAR GLOBAL ONLINE (Ponte Espiã para a OpenSky com Disfarce)
app.get("/api/radar-global", async (req, res) => {
  try {
    // Colocamos um User-Agent falso para a OpenSky achar que somos um aplicativo legítimo
    const response = await axios.get(
      "https://opensky-network.org/api/states/all?lamin=-35&lomin=-75&lamax=10&lomax=-30",
      {
        headers: {
          "User-Agent": "AeroBrif-App/1.0 (Contato: admin@aerobrif.com)",
        },
      },
    );

    res.json(response.data);
  } catch (e) {
    // Se a OpenSky bloquear, a gente avisa no console do Render qual foi o código do erro
    console.error(
      "🚨 Erro OpenSky:",
      e.response ? e.response.status : e.message,
    );

    // Devolvemos uma lista vazia, assim o React não dá erro de CORS, apenas fica sem aviões
    res.json({ states: [] });
  }
});
