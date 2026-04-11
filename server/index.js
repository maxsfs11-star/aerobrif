const express = require("express");
const cors = require("cors");
const axios = require("axios");
const xml2js = require("xml2js"); // Precisamos disso para ler o formato da NOAA

const app = express();
app.use(cors());

// --- ROTA DO RADAR (MANTIDA IGUAL) ---
// --- ROTA DO RADAR (BLINDADA) ---
app.get("/api/radar", async (req, res) => {
  try {
    const url =
      "https://opensky-network.org/api/states/all?lamin=-34.0&lamax=5.0&lomin=-74.0&lomax=-34.0";

    // Adicionamos um limite de tempo (timeout de 5s) para a torre não ficar travada esperando
    const response = await axios.get(url, { timeout: 5000 });

    if (!response.data || !response.data.states) {
      return res.json([]); // Retorna céu vazio sem dar erro
    }

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
    // A Torre avisa no terminal dela, mas entrega um céu vazio pro React em vez de um Erro 500!
    console.error("📡 Soluço na OpenSky (ignorando):", error.message);
    res.json([]);
  }
});

// --- NOVA ROTA DE CLIMA (NOAA) ---
app.get("/api/clima/:icao", async (req, res) => {
  const icao = req.params.icao.toUpperCase();
  try {
    // Busca o METAR mais recente
    const urlMetar = `https://aviationweather.gov/api/data/dataserver?requestType=retrieve&dataSource=metars&stationString=${icao}&hoursBeforeNow=2&format=xml&mostRecent=true`;

    const response = await axios.get(urlMetar);

    // A NOAA devolve em XML, precisamos converter para JSON
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);

    // Verifica se achou os dados
    if (
      !result.response ||
      !result.response.data ||
      !result.response.data.METAR
    ) {
      return res
        .status(404)
        .json({ error: "Clima indisponível para este aeródromo" });
    }

    const metarData = result.response.data.METAR;

    // Monta um objeto limpo com os dados oficiais
    const climaLimpo = {
      metarCru: metarData.raw_text || "Aguardando...",
      temperatura: metarData.temp_c || "--",
      ventoDir: metarData.wind_dir_degrees || "--",
      ventoVel: metarData.wind_speed_kt || "--",
      pressao: metarData.altim_in_hg
        ? (parseFloat(metarData.altim_in_hg) * 33.8639).toFixed(0)
        : "--", // Converte inHg para hPa
      condicao: metarData.flight_category || "VFR",
    };

    res.json(climaLimpo);
  } catch (error) {
    console.error(`☁️ Erro NOAA para ${icao}:`, error.message);
    res.status(500).json({ error: "Falha ao buscar clima oficial" });
  }
});

app.listen(3001, () => {
  console.log(`✅ Torre de Controle AEROBRIF online na porta 3001!`);
});
