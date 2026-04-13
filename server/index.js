const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
// 🔓 LIBERAÇÃO TOTAL: Sem isso, nem Web nem Mobile vão funcionar.
app.use(cors());

app.get("/", (req, res) => res.send("Torre AEROBRIF: Online 100%"));

// ROTA RADAR COM "ESCAPE" CORRIGIDO
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

    // 👈 O TRADUTOR QUE EU TINHA ESQUECIDO (Transforma lista crua em Objeto)
    const voos = response.data.states.slice(0, 20).map((voo) => ({
      id: voo[1] ? voo[1].trim() : "VFR",
      lng: voo[5],
      lat: voo[6],
      altitude: voo[7] ? Math.round(voo[7] * 3.28084) : 0,
      velocidade: voo[9] ? Math.round(voo[9] * 1.94384) : 0,
    }));

    res.json(voos);
  } catch (e) {
    // 👈 SIMULADOS EM FORMATO DE OBJETO TAMBÉM
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

// ROTA NOTAM "BLINDADA"
app.get("/api/notam/:icao", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.checkwx.com/bot/notam/${req.params.icao}`,
      {
        headers: { "X-API-Key": process.env.CHECKWX_KEY },
        timeout: 5000,
      },
    );
    res.json(response.data.notams || ["Nenhum NOTAM ativo agora."]);
  } catch (e) {
    res.json(["⚠️ Torre em modo de espera. Verifique a chave da API."]);
  }
});

app.listen(10000, () => console.log("Hangar aberto na porta 10000"));
