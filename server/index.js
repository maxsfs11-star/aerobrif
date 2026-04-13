require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

// 🔓 1. CORS TOTALMENTE ABERTO (Evita qualquer bloqueio do Vercel ou Localhost)
app.use(cors());

console.log(
  "CHAVE CHECKWX:",
  process.env.CHECKWX_KEY ? "Configurada ✅" : "Vazia ❌",
);
console.log(
  "USUÁRIO OPENSKY:",
  process.env.OPENSKY_USER ? "Configurado ✅" : "Vazio ❌",
);

app.get("/", (req, res) => {
  res.send("Torre de Controle AEROBRIF: Online e Operacional!");
});

// ✈️ ROTA DO RADAR
app.get("/api/radar", async (req, res) => {
  try {
    const response = await axios.get(
      "https://opensky-network.org/api/states/all?lamin=-34.0&lamax=5.0&lomin=-74.0&lomax=-34.0",
      {
        auth: {
          username: process.env.OPENSKY_USER,
          password: process.env.OPENSKY_PASS,
        },
        timeout: 5000,
      },
    );

    // 🛑 A TRAVA DE SEGURANÇA: Se a API negar, a gente pula pro simulado antes do servidor cair!
    if (!response.data || !response.data.states) {
      throw new Error("OpenSky bloqueou ou enviou vazio");
    }

    const voos = response.data.states.slice(0, 20).map((voo) => ({
      id: voo[1] ? voo[1].trim() : "VFR",
      lng: voo[5],
      lat: voo[6],
      altitude: voo[7] ? Math.round(voo[7] * 3.28084) : 0,
      velocidade: voo[9] ? Math.round(voo[9] * 1.94384) : 0,
    }));

    res.json(voos);
  } catch (error) {
    // Modo de Emergência Ativado: Mantém o site bonito e rodando.
    res.json([
      {
        id: "SIM-GOL1",
        lat: -23.5,
        lng: -46.5,
        altitude: 15000,
        velocidade: 250,
      },
      {
        id: "SIM-TAM2",
        lat: -22.9,
        lng: -43.3,
        altitude: 12000,
        velocidade: 220,
      },
    ]);
  }
});

// 📑 ROTA NOTAM (URL Atualizada)
app.get("/api/notam/:icao", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.checkwx.com/notam/${req.params.icao}`, // Correção da rota
      {
        headers: { "X-API-Key": process.env.CHECKWX_KEY },
        timeout: 5000,
      },
    );
    // A CheckWX moderna envia os avisos dentro da variável "data"
    res.json(response.data.data || ["Nenhum NOTAM ativo agora."]);
  } catch (error) {
    res.json(["⚠️ Torre em modo de espera. Verifique a chave da API."]);
  }
});

// 🌤️ ROTA METAR
app.get("/api/metar/:icao", async (req, res) => {
  try {
    const response = await axios.get(
      `https://aviationweather.gov/api/data/metar?ids=${req.params.icao}&format=json`,
    );
    res.json(response.data);
  } catch (error) {
    res.json([{ rawOb: "⚠️ Erro na torre meteorológica." }]);
  }
});

// 🌤️ ROTA TAF
app.get("/api/taf/:icao", async (req, res) => {
  try {
    const response = await axios.get(
      `https://aviationweather.gov/api/data/taf?ids=${req.params.icao}&format=json`,
    );
    res.json(response.data);
  } catch (error) {
    res.json([{ rawTAF: "⚠️ Erro na previsão do tempo." }]);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Hangar aberto na porta ${PORT}`);
});
