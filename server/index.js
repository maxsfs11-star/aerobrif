const express = require("express");
const cors = require("cors");
const axios = require("axios"); // Necessário para buscar nas APIs reais

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// --- ROTA 1: RADAR AO VIVO (OpenSky Network) ---
app.get("/api/radar", async (req, res) => {
  try {
    console.log("📡 Buscando tráfego aéreo REAL na OpenSky Network...");

    // Coordenadas formando um "quadrado" entre São Paulo e Rio de Janeiro
    const lamin = -24.5;
    const lamax = -22.0;
    const lomin = -47.5;
    const lomax = -42.0;

    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    const response = await axios.get(url);

    if (!response.data || !response.data.states) {
      return res.json([]); // Céu limpo
    }

    const avioesReais = response.data.states
      .map((state) => {
        const altitudeMetros = state[7] || state[13];
        const altitudePes = altitudeMetros
          ? Math.round(altitudeMetros * 3.28084)
          : 0;
        const velocidadeMs = state[9];
        const velocidadeNos = velocidadeMs
          ? Math.round(velocidadeMs * 1.94384)
          : 0;

        return {
          id: state[1] ? state[1].trim() : "DESCONHECIDO",
          origem: state[2],
          lat: state[6],
          lng: state[5],
          altitude: `${altitudePes} ft`,
          velocidade: `${velocidadeNos} kt`,
          angulo: state[10] || 0,
          status:
            altitudePes < 5000 && velocidadeNos < 150
              ? "Aproximação/Decolagem"
              : "Cruzeiro",
        };
      })
      .filter((aviao) => aviao.lat && aviao.lng); // Proteção: Só envia se tiver GPS

    res.json(avioesReais);
  } catch (error) {
    console.error("❌ Erro ao buscar radar real:", error.message);
    res.status(500).json({ erro: "Radar offline no momento." });
  }
});

// --- ROTA 2: DADOS DA PISTA E CLIMA (REDEMET / DECEA) ---
app.get("/api/aerodromo/:icao", async (req, res) => {
  const icao = req.params.icao.toUpperCase();

  // ⚠️ ATENÇÃO: Substitua pela sua chave real da REDEMET quando criar a conta
  const REDEMET_API_KEY = "COLOQUE_SUA_CHAVE_AQUI";

  try {
    console.log(`🌦️ Solicitando dados oficiais para ${icao}...`);

    // Resposta simulada super completa caso ainda não tenha a chave da REDEMET
    if (REDEMET_API_KEY === "COLOQUE_SUA_CHAVE_AQUI") {
      return res.json({
        icao: icao,
        metar: `${icao} 101200Z 12015KT 9999 BKN030 25/18 Q1015 (SIMULADO - INSIRA A CHAVE)`,
        taf: `TAF ${icao} 101100Z 1012/1112 13010KT 9999 SCT030 (SIMULADO)`,
        pista: "Asfalto Ranhurado - 1940m",
        pressao: "1015 hPa",
        vento: "120 graus a 15 Nós",
        clima: "Parcialmente Nublado",
        sol: "Nascer: 06:15 | Ocaso: 18:05",
        notam: "Verifique a API do DECEA para NOTAMs reais.",
        passaros: "⚠️ Simulação: Risco de aves na final da pista.",
        cartas: ["ADC", "SID", "STAR"],
      });
    }

    // CÓDIGO REAL (Só funciona com a API KEY válida)
    const metarRes = await axios.get(
      `https://api-redemet.decea.mil.br/mensagens/metar/${icao}?api_key=${REDEMET_API_KEY}`,
    );
    const metarReal = metarRes.data.data.data[0]
      ? metarRes.data.data.data[0].mens
      : "METAR não reportado";

    const tafRes = await axios.get(
      `https://api-redemet.decea.mil.br/mensagens/taf/${icao}?api_key=${REDEMET_API_KEY}`,
    );
    const tafReal = tafRes.data.data.data[0]
      ? tafRes.data.data.data[0].mens
      : "TAF não reportado";

    res.json({
      icao: icao,
      metar: metarReal,
      taf: tafReal,
      pista: "Dados requerem API AISWEB",
      vento: "Aguardando decodificação...",
      clima: "Aguardando decodificação...",
      pressao: "Aguardando decodificação...",
      sol: "Calculando efemérides...",
      notam: "Sem avisos urgentes.",
      passaros: "Nenhum reporte crítico.",
      cartas: ["ADC", "SID", "STAR"],
    });
  } catch (error) {
    console.error(`❌ Erro ao buscar ${icao} na REDEMET:`, error.message);
    res.status(500).json({ erro: "Falha na comunicação com o DECEA." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Torre de Controle (Servidor) rodando na porta ${PORT}`);
});
