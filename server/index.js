const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

// 🔓 CORS 100% Livre
app.use(cors());

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

// 📑 NOTAM: Desativado temporariamente com aviso seguro para não dar tela branca
app.get("/api/notam/:icao", (req, res) => {
  res.json(["✅ Torre de NOTAMs em manutenção. Focando no Radar e Clima."]);
});

// LIGANDO O SERVIDOR
app.listen(process.env.PORT || 10000, () =>
  console.log(`✅ Hangar aberto com Nova API!`),
);
