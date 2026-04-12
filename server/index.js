require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

// 1️⃣ ROTA DOS AVIÕES (Com Login da OpenSky)
// 1️⃣ ROTA DOS AVIÕES (Com Login e Radar de Emergência/Simulação)
app.get("/api/radar", async (req, res) => {
  try {
    const url =
      "https://opensky-network.org/api/states/all?lamin=-34.0&lamax=5.0&lomin=-74.0&lomax=-34.0";

    const response = await axios.get(url, {
      auth: {
        username: process.env.OPENSKY_USER,
        password: process.env.OPENSKY_PASS,
      },
    });

    if (!response.data || !response.data.states) return res.json([]);

    const voosTratados = response.data.states
      .filter((voo) => voo[5] && voo[6])
      .map((voo) => ({
        id: voo[1] ? voo[1].trim() : "VFR",
        lng: voo[5],
        lat: voo[6],
        altitude: voo[7] ? Math.round(voo[7] * 3.28084) : 0,
        velocidade: voo[9] ? Math.round(voo[9] * 1.94384) : 0,
      }));

    res.json(voosTratados);
  } catch (error) {
    // 🚨 SE A OPENSKY BLOQUEAR (ERRO 429), ATIVAR RADAR DE SIMULAÇÃO:
    if (error.response && error.response.status === 429) {
      console.log(
        "📡 OpenSky bloqueou o IP (429). Ativando Radar de Simulação...",
      );

      // Retorna aviões "falsos" para você continuar testando o visual do App
      return res.json([
        {
          id: "GOL1920",
          lat: -23.5,
          lng: -46.5,
          altitude: 15000,
          velocidade: 250,
        },
        {
          id: "TAM3411",
          lat: -22.9,
          lng: -43.3,
          altitude: 12000,
          velocidade: 220,
        },
        {
          id: "AZU8755",
          lat: -23.1,
          lng: -45.0,
          altitude: 20000,
          velocidade: 300,
        },
      ]);
    }

    // Se for outro erro grave:
    console.error("📡 Erro OpenSky:", error.message);
    res.status(500).json({ error: "Falha na comunicação" });
  }
});

// 2️⃣ ROTA METAR (Buscando na NOAA)
app.get("/api/metar/:icao", async (req, res) => {
  try {
    const response = await axios.get(
      `https://aviationweather.gov/api/data/metar?ids=${req.params.icao}&format=json`,
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Falha ao buscar METAR" });
  }
});

// 3️⃣ ROTA TAF (Buscando na NOAA)
app.get("/api/taf/:icao", async (req, res) => {
  try {
    const response = await axios.get(
      `https://aviationweather.gov/api/data/taf?ids=${req.params.icao}&format=json`,
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Falha ao buscar TAF" });
  }
});

// A porta será definida pelo Render (process.env.PORT) ou será 3001 no seu PC
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Torre de Controle AEROBRIF online na porta ${PORT}`);
});

// 4️⃣ ROTA DOS NOTAMs (Buscando na CheckWX API com Blindagem Anti-Queda)
app.get("/api/notam/:icao", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.checkwx.com/notam/${req.params.icao}`,
      {
        headers: {
          "X-API-Key": process.env.CHECKWX_KEY,
        },
        timeout: 5000, // Se demorar mais de 5 segundos, ele aborta e usa o simulador
      },
    );

    res.json(response.data.data || []);
  } catch (error) {
    console.log(
      `🚨 Conexão com CheckWX falhou (Timeout). Injetando NOTAM de emergência para ${req.params.icao}...`,
    );
    // Se a internet falhar, ele manda este aviso para a tela não quebrar:
    res.json([
      `⚠️ MODO OFFLINE: Falha de conexão com os servidores de NOTAM para ${req.params.icao}.`,
      `⚠️ Operando com dados simulados temporários.`,
    ]);
  }
});
