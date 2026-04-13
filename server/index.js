require("dotenv").config();

console.log(
  "CHAVE CHECKWX:",
  process.env.CHECKWX_KEY ? "Configurada ✅" : "Vazia ❌",
);
console.log(
  "USUÁRIO OPENSKY:",
  process.env.OPENSKY_USER ? "Configurado ✅" : "Vazio ❌",
);

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(
  cors({
    origin: "*", // Permite que qualquer origem (Vercel) acesse
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  }),
);

// ✈️ ROTA DO RADAR COM TIMEOUT (Para evitar o erro 502)
app.get("/api/radar", async (req, res) => {
  try {
    const response = await axios.get(
      "https://opensky-network.org/api/states/all?lamin=-34.0&lamax=5.0&lomin=-74.0&lomax=-34.0",
      {
        auth: {
          username: process.env.OPENSKY_USER,
          password: process.env.OPENSKY_PASS,
        },
        timeout: 8000, // Se a OpenSky não responder em 8s, ele desiste e usa o simulador
      },
    );

    if (!response.data || !response.data.states) {
      return res.json([]);
    }

    const voos = response.data.states.map((voo) => ({
      id: voo[1] ? voo[1].trim() : "VFR",
      lng: voo[5],
      lat: voo[6],
      altitude: voo[7] ? Math.round(voo[7] * 3.28084) : 0,
      velocidade: voo[9] ? Math.round(voo[9] * 1.94384) : 0,
    }));

    res.json(voos);
  } catch (error) {
    console.log("📡 OpenSky demorou ou falhou. Ativando Modo de Emergência.");
    // Retorna dados simulados para o site não ficar vazio e não dar erro 502
    res.json([
      {
        id: "GOL-SIM",
        lat: -23.5,
        lng: -46.6,
        altitude: 32000,
        velocidade: 450,
      },
      {
        id: "TAM-SIM",
        lat: -22.9,
        lng: -43.2,
        altitude: 28000,
        velocidade: 420,
      },
    ]);
  }
});

app.use(cors());

// 🧪 ROTA DE TESTE (Para saber se a torre está viva)
app.get("/", (req, res) => {
  res.send("<h1>✅ Torre de Controle AEROBRIF: Online e Operacional!</h1>");
});

// 1️⃣ ROTA DOS AVIÕES (Radar)
app.get("/api/radar", async (req, res) => {
  try {
    const url =
      "https://opensky-network.org/api/states/all?lamin=-34.0&lamax=5.0&lomin=-74.0&lomax=-34.0";
    const response = await axios.get(url, {
      auth: {
        username: process.env.OPENSKY_USER,
        password: process.env.OPENSKY_PASS,
      },
      timeout: 10000,
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
    console.log("📡 Ativando Radar de Simulação (OpenSky Offline/Timedout)");
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

// 2️⃣ ROTA METAR, 3️⃣ TAF e 4️⃣ NOTAM (Coloque todas ANTES do listen)
app.get("/api/metar/:icao", async (req, res) => {
  try {
    const response = await axios.get(
      `https://aviationweather.gov/api/data/metar?ids=${req.params.icao}&format=json`,
    );
    res.json(response.data);
  } catch (e) {
    res.status(500).json([]);
  }
});

app.get("/api/taf/:icao", async (req, res) => {
  try {
    const response = await axios.get(
      `https://aviationweather.gov/api/data/taf?ids=${req.params.icao}&format=json`,
    );
    res.json(response.data);
  } catch (e) {
    res.status(500).json([]);
  }
});

app.get("/api/notam/:icao", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.checkwx.com/notam/${req.params.icao}`,
      {
        headers: { "X-API-Key": process.env.CHECKWX_KEY },
        timeout: 5000,
      },
    );
    res.json(response.data.data || []);
  } catch (e) {
    res.json(["⚠️ Erro ao buscar NOTAMs reais."]);
  }
});

// 🚀 LIGA O MOTOR (A ÚLTIMA LINHA DO ARQUIVO)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Torre de Controle online na porta ${PORT}`);
});
