const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
// 🔓 LIBERAÇÃO TOTAL: Sem isso, nem Web nem Mobile vão funcionar.
app.use(cors());

app.get("/", (req, res) => res.send("Torre AEROBRIF: Online 100%"));

// ROTA RADAR COM "ESCAPE"
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
    res.json(response.data.states.slice(0, 20)); // Manda só 20 aviões pra ser rápido
  } catch (e) {
    // SE DER ERRO, MANDA SIMULADO (Pra não dar tela branca nunca mais!)
    res.json([["", "SIM-GOL", "Brazil", 0, -23.5, -46.6, 10000, false, 250]]);
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
