import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

// 🟢 Ícone de Avião (Radar)
const blipIcon = L.divIcon({
  className: "custom-blip",
  html: "<div class='radar-blip'></div>",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// 🟢 Ícone de Origem (Decolagem)
const iconOrigem = L.divIcon({
  className: "marcador-origem",
  html: "🛫",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

// 🔴 Ícone de Destino (Pouso)
const iconDestino = L.divIcon({
  className: "marcador-destino",
  html: "🛬",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

// Banco de Dados da Pista (Expandido)
// Banco de Dados da Pista (Guia Nacional Expandido)
const gpsAeroportos = {
  // --- SUDESTE ---
  SBSP: {
    cidade: "São Paulo",
    nome: "Congonhas",
    coords: [-23.6261, -46.6564],
    fuso: -3,
    pista: 170,
    elevacao: 2631,
    comprimento: 1940,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBGR: {
    cidade: "Guarulhos",
    nome: "Cumbica",
    coords: [-23.4356, -46.4731],
    fuso: -3,
    pista: 90,
    elevacao: 2459,
    comprimento: 3700,
    freqTorre: "118.40",
    freqSolo: "121.70",
  },
  SBKP: {
    cidade: "Campinas",
    nome: "Viracopos",
    coords: [-23.0069, -47.1344],
    fuso: -3,
    pista: 150,
    elevacao: 2165,
    comprimento: 3240,
    freqTorre: "118.50",
    freqSolo: "121.80",
  },
  SBRJ: {
    cidade: "Rio de Janeiro",
    nome: "Santos Dumont",
    coords: [-22.9105, -43.1626],
    fuso: -3,
    pista: 20,
    elevacao: 10,
    comprimento: 1323,
    freqTorre: "118.00",
    freqSolo: "121.00",
  },
  SBGL: {
    cidade: "Rio de Janeiro",
    nome: "Galeão",
    coords: [-22.8089, -43.2436],
    fuso: -3,
    pista: 100,
    elevacao: 28,
    comprimento: 4000,
    freqTorre: "118.00",
    freqSolo: "121.65",
  },
  SBCF: {
    cidade: "Belo Horizonte",
    nome: "Confins",
    coords: [-19.6244, -43.9719],
    fuso: -3,
    pista: 160,
    elevacao: 2715,
    comprimento: 3000,
    freqTorre: "118.15",
    freqSolo: "121.80",
  },
  SBBH: {
    cidade: "Belo Horizonte",
    nome: "Pampulha",
    coords: [-19.8519, -43.9506],
    fuso: -3,
    pista: 130,
    elevacao: 2739,
    comprimento: 2590,
    freqTorre: "118.20",
    freqSolo: "121.70",
  },
  SBVT: {
    cidade: "Vitória",
    nome: "Eurico de Aguiar",
    coords: [-20.2581, -40.2864],
    fuso: -3,
    pista: 60,
    elevacao: 11,
    comprimento: 1750,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBRP: {
    cidade: "Ribeirão Preto",
    nome: "Leite Lopes",
    coords: [-21.1364, -47.7767],
    fuso: -3,
    pista: 180,
    elevacao: 1797,
    comprimento: 2100,
    freqTorre: "118.45",
    freqSolo: "121.70",
  },
  SBAE: {
    cidade: "Bauru",
    nome: "Moussa Tobias",
    coords: [-22.3439, -49.0539],
    fuso: -3,
    pista: 140,
    elevacao: 1948,
    comprimento: 2100,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBME: {
    cidade: "Macaé",
    nome: "Macaé",
    coords: [-22.3433, -41.7636],
    fuso: -3,
    pista: 60,
    elevacao: 9,
    comprimento: 1200,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBSR: {
    cidade: "São José do Rio Preto",
    nome: "Eribelto Manoel",
    coords: [-20.8161, -49.4053],
    fuso: -3,
    pista: 70,
    elevacao: 1781,
    comprimento: 1640,
    freqTorre: "118.70",
    freqSolo: "121.90",
  },

  // --- SUL ---
  SBPA: {
    cidade: "Porto Alegre",
    nome: "Salgado Filho",
    coords: [-29.9939, -51.1711],
    fuso: -3,
    pista: 110,
    elevacao: 11,
    comprimento: 2280,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBFL: {
    cidade: "Florianópolis",
    nome: "Hercílio Luz",
    coords: [-27.6703, -48.5525],
    fuso: -3,
    pista: 140,
    elevacao: 16,
    comprimento: 2400,
    freqTorre: "118.70",
    freqSolo: "121.80",
  },
  SBCT: {
    cidade: "Curitiba",
    nome: "Afonso Pena",
    coords: [-25.5317, -49.1761],
    fuso: -3,
    pista: 150,
    elevacao: 2988,
    comprimento: 2215,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBFI: {
    cidade: "Foz do Iguaçu",
    nome: "Cataratas",
    coords: [-25.5975, -53.9819],
    fuso: -3,
    pista: 150,
    elevacao: 784,
    comprimento: 2195,
    freqTorre: "118.00",
    freqSolo: "121.50",
  },
  SBNF: {
    cidade: "Navegantes",
    nome: "Victor Konder",
    coords: [-26.8786, -48.6514],
    fuso: -3,
    pista: 70,
    elevacao: 18,
    comprimento: 1701,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBJV: {
    cidade: "Joinville",
    nome: "Lauro Carneiro",
    coords: [-26.2231, -48.7978],
    fuso: -3,
    pista: 150,
    elevacao: 15,
    comprimento: 1640,
    freqTorre: "118.30",
    freqSolo: "121.70",
  },
  SBPK: {
    cidade: "Pelotas",
    nome: "João Simões",
    coords: [-31.7183, -52.3314],
    fuso: -3,
    pista: 60,
    elevacao: 59,
    comprimento: 1980,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },

  // --- CENTRO-OESTE ---
  SBBR: {
    cidade: "Brasília",
    nome: "Juscelino Kubitschek",
    coords: [-15.8692, -47.9208],
    fuso: -3,
    pista: 110,
    elevacao: 3497,
    comprimento: 3300,
    freqTorre: "118.10",
    freqSolo: "121.70",
  },
  SBGO: {
    cidade: "Goiânia",
    nome: "Santa Genoveva",
    coords: [-16.6322, -49.2208],
    fuso: -3,
    pista: 140,
    elevacao: 2450,
    comprimento: 2500,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBCG: {
    cidade: "Campo Grande",
    nome: "Campo Grande",
    coords: [-20.4686, -54.6725],
    fuso: -4,
    pista: 60,
    elevacao: 1833,
    comprimento: 2600,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBCY: {
    cidade: "Cuiabá",
    nome: "Marechal Rondon",
    coords: [-15.6529, -56.1167],
    fuso: -4,
    pista: 170,
    elevacao: 617,
    comprimento: 2300,
    freqTorre: "118.30",
    freqSolo: "121.90",
  },
  SBSI: {
    cidade: "Sinop",
    nome: "Presidente Figueiredo",
    coords: [-11.9011, -55.5861],
    fuso: -4,
    pista: 70,
    elevacao: 1256,
    comprimento: 1600,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },

  // --- NORDESTE ---
  SBSV: {
    cidade: "Salvador",
    nome: "Deputado Luís Eduardo",
    coords: [-12.9086, -38.3225],
    fuso: -3,
    pista: 100,
    elevacao: 64,
    comprimento: 3003,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBRF: {
    cidade: "Recife",
    nome: "Guararapes",
    coords: [-8.1264, -34.9228],
    fuso: -3,
    pista: 180,
    elevacao: 33,
    comprimento: 3007,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBFZ: {
    cidade: "Fortaleza",
    nome: "Pinto Martins",
    coords: [-3.7763, -38.5326],
    fuso: -3,
    pista: 130,
    elevacao: 82,
    comprimento: 2545,
    freqTorre: "120.10",
    freqSolo: "121.70",
  },
  SBSG: {
    cidade: "Natal",
    nome: "São Gonçalo",
    coords: [-5.7689, -35.3664],
    fuso: -3,
    pista: 120,
    elevacao: 169,
    comprimento: 3000,
    freqTorre: "118.30",
    freqSolo: "121.90",
  },
  SBAR: {
    cidade: "Aracaju",
    nome: "Santa Maria",
    coords: [-10.9847, -37.0703],
    fuso: -3,
    pista: 110,
    elevacao: 23,
    comprimento: 2200,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBMO: {
    cidade: "Maceió",
    nome: "Zumbi dos Palmares",
    coords: [-9.5108, -35.7917],
    fuso: -3,
    pista: 120,
    elevacao: 387,
    comprimento: 2601,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBJP: {
    cidade: "João Pessoa",
    nome: "Castro Pinto",
    coords: [-7.1483, -34.9503],
    fuso: -3,
    pista: 160,
    elevacao: 217,
    comprimento: 2515,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBPL: {
    cidade: "Petrolina",
    nome: "Sen. Nilo Coelho",
    coords: [-9.3622, -40.5681],
    fuso: -3,
    pista: 130,
    elevacao: 1230,
    comprimento: 3250,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBTE: {
    cidade: "Teresina",
    nome: "Sen. Petrônio Portella",
    coords: [-5.0606, -42.8242],
    fuso: -3,
    pista: 20,
    elevacao: 220,
    comprimento: 2200,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBPS: {
    cidade: "Porto Seguro",
    nome: "Porto Seguro",
    coords: [-16.4378, -39.0778],
    fuso: -3,
    pista: 100,
    elevacao: 167,
    comprimento: 2000,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },

  // --- NORTE ---
  SBEG: {
    cidade: "Manaus",
    nome: "Eduardo Gomes",
    coords: [-3.0358, -60.0463],
    fuso: -4,
    pista: 110,
    elevacao: 264,
    comprimento: 2700,
    freqTorre: "118.30",
    freqSolo: "121.90",
  },
  SBBE: {
    cidade: "Belém",
    nome: "Val-de-Cans",
    coords: [-1.3792, -48.4761],
    fuso: -3,
    pista: 60,
    elevacao: 54,
    comprimento: 2800,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBPV: {
    cidade: "Porto Velho",
    nome: "Gov. Jorge Teixeira",
    coords: [-8.7136, -63.9028],
    fuso: -4,
    pista: 10,
    elevacao: 288,
    comprimento: 2400,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBRB: {
    cidade: "Rio Branco",
    nome: "Plácido de Castro",
    coords: [-9.8683, -67.898],
    fuso: -5,
    pista: 60,
    elevacao: 633,
    comprimento: 2158,
    freqTorre: "118.70",
    freqSolo: "121.90",
  },
  SBMQ: {
    cidade: "Macapá",
    nome: "Alberto Alcolumbre",
    coords: [0.0508, -51.0722],
    fuso: -3,
    pista: 80,
    elevacao: 56,
    comprimento: 2100,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBMA: {
    cidade: "Marabá",
    nome: "João Correa",
    coords: [-5.3686, -49.1378],
    fuso: -3,
    pista: 70,
    elevacao: 358,
    comprimento: 2000,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
};

// Funções Matemáticas
const calcularDistanciaNM = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 0.539957;
};

const calcularTempoVoo = (distanciaNM) => {
  const tempoHoras = distanciaNM / 450;
  const horas = Math.floor(tempoHoras);
  const minutos = Math.round((tempoHoras - horas) * 60);
  return `${horas}h ${minutos < 10 ? "0" : ""}${minutos}m`;
};

function App() {
  const [origemInput, setOrigemInput] = useState("");
  const [destinoInput, setDestinoInput] = useState("");
  const [origemAtiva, setOrigemAtiva] = useState("");
  const [destinoAtivo, setDestinoAtivo] = useState("");
  const [radar, setRadar] = useState([]);
  const [cidadesSobrevoo, setCidadesSobrevoo] = useState({});
  const [radarTime, setRadarTime] = useState(null);
  const [isServerOnline, setIsServerOnline] = useState(false);

  // Estados do Clima e Avisos
  const [metarOrigem, setMetarOrigem] = useState("Aguardando NOAA...");
  const [metarDestino, setMetarDestino] = useState("Aguardando NOAA...");
  const [tafOrigem, setTafOrigem] = useState("Aguardando NOAA...");
  const [tafDestino, setTafDestino] = useState("Aguardando NOAA...");
  const [notamOrigem, setNotamOrigem] = useState(["Aguardando NOTAM..."]);
  const [notamDestino, setNotamDestino] = useState(["Aguardando NOTAM..."]);

  const getHoraLocal = (icao) => {
    const aero = gpsAeroportos[icao];
    if (!aero) return "--:--";
    const agora = new Date();
    const utc = agora.getTime() + agora.getTimezoneOffset() * 60000;
    return new Date(utc + 3600000 * aero.fuso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const buscarIcao = (texto) => {
    if (!texto) return "";
    const busca = texto.toUpperCase().trim();

    // 1. Verifica se digitou o ICAO direto
    if (gpsAeroportos[busca]) return busca;

    // 2. Normaliza o texto (remove acentos) para busca por nome
    const buscaLimpa = busca.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    for (const icao in gpsAeroportos) {
      const cidadeLimpa = gpsAeroportos[icao].cidade
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const nomeLimpo = gpsAeroportos[icao].nome
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (cidadeLimpa.includes(buscaLimpa) || nomeLimpo.includes(buscaLimpa)) {
        return icao;
      }
    }
    return "";
  };

  const handleCarregarRota = () => {
    const icaoO = buscarIcao(origemInput); // 👈 Corrigido: Definindo icaoO
    const icaoD = buscarIcao(destinoInput); // 👈 Corrigido: Definindo icaoD

    if (!icaoO || !icaoD) {
      alert(
        "⚠️ Erro: Aeroporto não localizado! Tente a cidade ou a sigla ICAO.",
      );
      return;
    }

    setMetarOrigem("Buscando...");
    setMetarDestino("Buscando...");
    setTafOrigem("Buscando...");
    setTafDestino("Buscando...");
    setNotamOrigem(["Buscando..."]);
    setNotamDestino(["Buscando..."]);

    setOrigemAtiva(icaoO);
    setDestinoAtivo(icaoD);
  };

  // 1️⃣ CLIMA OFICIAL E NOTAM (Passando pela nossa Torre)
  // Lembrete: Assim que o sistema REDEMET voltar, devemos atualizar as rotas METAR/TAF para a API nacional.
  useEffect(() => {
    if (!origemAtiva || !destinoAtivo) return;

    // ---- BUSCANDO ORIGEM ----
    fetch(`https://aerobrif.onrender.com/api/metar/${origemAtiva}`)
      .then((res) => res.json())
      .then((data) =>
        setMetarOrigem(data.length > 0 ? data[0].rawOb : "METAR Indisponível"),
      )
      .catch(() => setMetarOrigem("Erro na Torre"));

    fetch(`https://aerobrif.onrender.com/api/taf/${origemAtiva}`)
      .then((res) => res.json())
      .then((data) =>
        setTafOrigem(data.length > 0 ? data[0].rawTAF : "TAF Indisponível"),
      )
      .catch(() => setTafOrigem("Erro na Torre"));

    fetch(`https://aerobrif.onrender.com/api/notam/${origemAtiva}`)
      .then((res) => res.json())
      .then((data) =>
        setNotamOrigem(data.length > 0 ? data : ["✅ Nenhum NOTAM crítico."]),
      )
      .catch(() => setNotamOrigem(["❌ Falha ao carregar NOTAMs."]));

    // ---- BUSCANDO DESTINO ----
    fetch(`https://aerobrif.onrender.com/api/metar/${destinoAtivo}`)
      .then((res) => res.json())
      .then((data) =>
        setMetarDestino(data.length > 0 ? data[0].rawOb : "METAR Indisponível"),
      )
      .catch(() => setMetarDestino("Erro na Torre"));

    fetch(`https://aerobrif.onrender.com/api/taf/${destinoAtivo}`)
      .then((res) => res.json())
      .then((data) =>
        setTafDestino(data.length > 0 ? data[0].rawTAF : "TAF Indisponível"),
      )
      .catch(() => setTafDestino("Erro na Torre"));

    fetch(`https://aerobrif.onrender.com/api/notam/${destinoAtivo}`)
      .then((res) => res.json())
      .then((data) =>
        setNotamDestino(data.length > 0 ? data : ["✅ Nenhum NOTAM crítico."]),
      )
      .catch(() => setNotamDestino(["❌ Falha ao carregar NOTAMs."]));
  }, [origemAtiva, destinoAtivo]);

  // ☁️ BUSCA HORÁRIO DAS NUVENS (VERSÃO ANTI-ERRO)
  useEffect(() => {
    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then((res) => res.json())
      .then((data) => {
        // 🛰️ Tenta pegar satélite infravermelho primeiro
        const satelliteList = data?.satellite?.infrared;
        // ⛈️ Se não tiver satélite, tenta a lista do radar
        const radarList = data?.radar?.past;

        if (satelliteList && satelliteList.length > 0) {
          setRadarTime(satelliteList[satelliteList.length - 1].time);
        } else if (radarList && radarList.length > 0) {
          setRadarTime(radarList[radarList.length - 1].time);
        }
      })
      .catch((err) => console.log("❌ Erro na API do RainViewer:", err));
  }, []);

  // ✈️ Radar Online com Check de Conexão
  useEffect(() => {
    const bRadar = () => {
      fetch("https://aerobrif.onrender.com/api/radar")
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          setRadar(data);
          setIsServerOnline(true); // ✅ Resposta chegou, estamos online!
        })
        .catch(() => {
          setIsServerOnline(false); // ❌ Falha na comunicação, servidor offline!
        });
    };

    bRadar();
    // Diminuí para 30 segundos para o status ser mais rápido se a torre cair
    const timer = setInterval(bRadar, 30000);
    return () => clearInterval(timer);
  }, []);

  // 🔎 Função Mágica: Busca a cidade pelo satélite
  const descobrirCidade = async (lat, lng, vooId) => {
    setCidadesSobrevoo((prev) => ({
      ...prev,
      [vooId]: "Buscando satélite...",
    }));
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      const local =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.state ||
        "Área Oceânica/Remota";
      setCidadesSobrevoo((prev) => ({ ...prev, [vooId]: local }));
    } catch (err) {
      console.error("Erro ao buscar cidade:", err);
      setCidadesSobrevoo((prev) => ({ ...prev, [vooId]: "Desconhecido" }));
    }
  };

  // Cálculos de Rota e Vento
  let traves = 0,
    corAlerta = "#444";
  let dist = 0,
    tempo = "--h --m";

  if (gpsAeroportos[origemAtiva] && gpsAeroportos[destinoAtivo]) {
    dist = Math.round(
      calcularDistanciaNM(
        gpsAeroportos[origemAtiva].coords[0],
        gpsAeroportos[origemAtiva].coords[1],
        gpsAeroportos[destinoAtivo].coords[0],
        gpsAeroportos[destinoAtivo].coords[1],
      ),
    );
    tempo = calcularTempoVoo(dist);

    const diff = Math.abs(140 - gpsAeroportos[destinoAtivo].pista);
    traves = Math.round(20 * Math.sin((diff * Math.PI) / 180));
    if (traves > 15) corAlerta = "#ff4d4d";
    else if (traves > 10) corAlerta = "#FFD700";
  }

  return (
    <div className="app-container">
      <div className="mapa-fundo">
        <MapContainer
          center={[-23.5505, -46.6333]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

          {/* Nuvens sobrepostas */}
          {radarTime && (
            <TileLayer
              key={radarTime}
              // Note que usamos 'satellite' aqui para bater com o INMET
              url={`https://tilecache.rainviewer.com/v2/satellite/${radarTime}/256/{z}/{x}/{y}/2/1_1.png`}
              opacity={0.6}
              zIndex={100}
            />
          )}

          {gpsAeroportos[origemAtiva] && gpsAeroportos[destinoAtivo] && (
            <>
              <Polyline
                positions={[
                  gpsAeroportos[origemAtiva].coords,
                  gpsAeroportos[destinoAtivo].coords,
                ]}
                color="#00d2ff"
                weight={4}
                className="rota-animada"
              />
              <Marker
                position={gpsAeroportos[origemAtiva].coords}
                icon={iconOrigem}
              >
                <Popup>
                  <b>🛫 Origem:</b> {origemAtiva}
                </Popup>
              </Marker>
              <Marker
                position={gpsAeroportos[destinoAtivo].coords}
                icon={iconDestino}
              >
                <Popup>
                  <b>🛬 Destino:</b> {destinoAtivo}
                </Popup>
              </Marker>
            </>
          )}

          {radar.map((aviao, idx) => (
            <Marker
              key={idx}
              position={[aviao.lat, aviao.lng]}
              icon={blipIcon}
              eventHandlers={{
                click: () => descobrirCidade(aviao.lat, aviao.lng, aviao.id),
              }}
            >
              <Popup>
                <div style={{ textAlign: "center", marginBottom: "5px" }}>
                  <b>✈️ Voo: {aviao.id}</b>
                </div>
                <hr style={{ margin: "5px 0", borderColor: "#ccc" }} />
                <div>
                  🏔️ <b>Altitude:</b> {aviao.altitude} ft
                </div>
                <div>
                  💨 <b>Velocidade:</b> {aviao.velocidade} kt
                </div>
                <div style={{ marginTop: "5px", color: "#0056b3" }}>
                  📍 <b>Local:</b>{" "}
                  {cidadesSobrevoo[aviao.id] || "Clique para rastrear..."}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="header-clarity">
        <div className="logo">AEROBRIF</div>
        <input
          value={origemInput}
          onChange={(e) => setOrigemInput(e.target.value)}
        />
        <span style={{ color: "#fff" }}>✈️</span>
        <input
          value={destinoInput}
          onChange={(e) => setDestinoInput(e.target.value)}
        />
        <button onClick={handleCarregarRota}>CARREGAR ROTA</button>
      </div>

      {/* 🛫 PAINEL ESQUERDO (ORIGEM) */}
      <div className="panel-side panel-left">
        <div className="panel-title">
          <span>🛫 ORIGEM: {origemAtiva}</span>
          <span>🕒 LOCAL: {getHoraLocal(origemAtiva)}</span>
        </div>

        <div className="card-clarity">
          <h4 style={{ marginBottom: "10px" }}>
            🌦️ METAR & TAF OFICIAL (NOAA)
          </h4>
          <p
            style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: "2px" }}
          >
            METAR (Condição Atual):
          </p>
          <p
            style={{
              fontFamily: "monospace",
              color: "var(--cyan-neon)",
              marginBottom: "10px",
              lineHeight: "1.2",
            }}
          >
            {metarOrigem}
          </p>
          <p
            style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: "2px" }}
          >
            TAF (Previsão):
          </p>
          <p
            style={{
              fontFamily: "monospace",
              color: "var(--neon-green)",
              lineHeight: "1.2",
            }}
          >
            {tafOrigem}
          </p>
        </div>

        <div className="card-clarity">
          <h4>CONDIÇÕES LOCAIS</h4>
          <p>
            🌬️ <b>Vento:</b> 120° / 15kt
          </p>
          <p>
            🌡️ <b>Clima:</b> Parcialmente Nublado (28°C)
          </p>
          <p>
            ⚖️ <b>Pressão:</b> 1012 hPa
          </p>
          <p>
            ☀️ <b>Sol:</b> Nascer 06:12 / Pôr 18:45
          </p>
        </div>

        <div
          className="card-clarity"
          style={{ borderTopColor: "var(--cyan-neon)" }}
        >
          <h4>Raio-X da Infraestrutura</h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p>
                🏔️ <b>Altitude:</b>
              </p>
              <span style={{ color: "var(--cyan-neon)", fontWeight: "bold" }}>
                {gpsAeroportos[origemAtiva]?.elevacao} ft
              </span>
            </div>
            <div style={{ marginTop: "5px" }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#aaa",
                  marginBottom: "5px",
                }}
              >
                COMPRIMENTO DA PISTA:
              </p>
              <div
                style={{
                  width: "100%",
                  height: "10px",
                  background: "#222",
                  borderRadius: "5px",
                  position: "relative",
                  overflow: "hidden",
                  border: "1px solid #444",
                }}
              >
                <div
                  style={{
                    width: `${(gpsAeroportos[origemAtiva]?.comprimento / 4000) * 100}%`,
                    height: "100%",
                    background:
                      gpsAeroportos[origemAtiva]?.comprimento < 1500
                        ? "var(--alert-red)"
                        : "var(--cyan-neon)",
                    boxShadow: "0 0 10px var(--cyan-neon)",
                  }}
                ></div>
              </div>
              <p
                style={{
                  textAlign: "right",
                  fontSize: "0.8rem",
                  marginTop: "5px",
                }}
              >
                <b>{gpsAeroportos[origemAtiva]?.comprimento} metros</b>
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginTop: "5px",
                borderTop: "1px solid #333",
                paddingTop: "10px",
              }}
            >
              <p>
                🎙️ <b>TWR:</b> {gpsAeroportos[origemAtiva]?.freqTorre}
              </p>
              <p>
                🚜 <b>GND:</b> {gpsAeroportos[origemAtiva]?.freqSolo}
              </p>
            </div>
          </div>
        </div>

        <div className="card-clarity" style={{ borderTopColor: "#FFD700" }}>
          <h4 style={{ color: "#FFD700" }}>AVISOS (NOTAM)</h4>
          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              fontSize: "0.8rem",
              color: "#ccc",
            }}
          >
            {notamOrigem.map((aviso, idx) => (
              <p
                key={idx}
                style={{
                  marginBottom: "8px",
                  borderBottom: "1px solid #333",
                  paddingBottom: "5px",
                }}
              >
                {aviso}
              </p>
            ))}
          </div>
        </div>

        <a
          href={`https://aisweb.decea.mil.br/?i=aerodromos&codigo=${origemAtiva}`}
          target="_blank"
          rel="noreferrer"
          className="link-aisweb"
        >
          📚 BAIXAR CARTAS (AISWEB) ↗
        </a>
      </div>

      {/* 🛬 PAINEL DIREITO (DESTINO) */}
      <div className="panel-side panel-right">
        <div className="panel-title">
          <span>🛬 DESTINO: {destinoAtivo}</span>
          <span>🕒 LOCAL: {getHoraLocal(destinoAtivo)}</span>
        </div>

        <div className="card-clarity">
          <h4 style={{ marginBottom: "10px" }}>
            🌦️ METAR & TAF OFICIAL (NOAA)
          </h4>
          <p
            style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: "2px" }}
          >
            METAR (Condição Atual):
          </p>
          <p
            style={{
              fontFamily: "monospace",
              color: "var(--cyan-neon)",
              marginBottom: "10px",
              lineHeight: "1.2",
            }}
          >
            {metarDestino}
          </p>
          <p
            style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: "2px" }}
          >
            TAF (Previsão):
          </p>
          <p
            style={{
              fontFamily: "monospace",
              color: "var(--neon-green)",
              lineHeight: "1.2",
            }}
          >
            {tafDestino}
          </p>
        </div>

        <div className="card-clarity" style={{ borderTopColor: corAlerta }}>
          <h4 style={{ color: corAlerta === "#444" ? "#00d2ff" : corAlerta }}>
            VENTO E TRAVÉS DA PISTA
          </h4>
          <p>
            🌬️ <b>Direção/Força:</b> 140° a 20kt
          </p>
          <p>
            ⚠️ <b>Posição do Través:</b>{" "}
            <span
              style={{ color: corAlerta, fontWeight: "bold", fontSize: "1rem" }}
            >
              {traves} kt
            </span>
          </p>
        </div>

        <div
          className="card-clarity"
          style={{ borderTopColor: "var(--cyan-neon)" }}
        >
          <h4>Raio-X da Infraestrutura</h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p>
                🏔️ <b>Altitude:</b>
              </p>
              <span style={{ color: "var(--cyan-neon)", fontWeight: "bold" }}>
                {gpsAeroportos[destinoAtivo]?.elevacao} ft
              </span>
            </div>
            <div style={{ marginTop: "5px" }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#aaa",
                  marginBottom: "5px",
                }}
              >
                COMPRIMENTO DA PISTA:
              </p>
              <div
                style={{
                  width: "100%",
                  height: "10px",
                  background: "#222",
                  borderRadius: "5px",
                  position: "relative",
                  overflow: "hidden",
                  border: "1px solid #444",
                }}
              >
                <div
                  style={{
                    width: `${(gpsAeroportos[destinoAtivo]?.comprimento / 4000) * 100}%`,
                    height: "100%",
                    background:
                      gpsAeroportos[destinoAtivo]?.comprimento < 1500
                        ? "var(--alert-red)"
                        : "var(--cyan-neon)",
                    boxShadow: "0 0 10px var(--cyan-neon)",
                  }}
                ></div>
              </div>
              <p
                style={{
                  textAlign: "right",
                  fontSize: "0.8rem",
                  marginTop: "5px",
                }}
              >
                <b>{gpsAeroportos[destinoAtivo]?.comprimento} metros</b>
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginTop: "5px",
                borderTop: "1px solid #333",
                paddingTop: "10px",
              }}
            >
              <p>
                🎙️ <b>TWR:</b> {gpsAeroportos[destinoAtivo]?.freqTorre}
              </p>
              <p>
                🚜 <b>GND:</b> {gpsAeroportos[destinoAtivo]?.freqSolo}
              </p>
            </div>
          </div>
        </div>

        <div className="card-clarity" style={{ borderTopColor: "#FFD700" }}>
          <h4 style={{ color: "#FFD700" }}>AVISOS (NOTAM)</h4>
          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              fontSize: "0.8rem",
              color: "#ccc",
            }}
          >
            {notamDestino.map((aviso, idx) => (
              <p
                key={idx}
                style={{
                  marginBottom: "8px",
                  borderBottom: "1px solid #333",
                  paddingBottom: "5px",
                }}
              >
                {aviso}
              </p>
            ))}
          </div>
        </div>

        <a
          href={`https://aisweb.decea.mil.br/?i=aerodromos&codigo=${destinoAtivo}`}
          target="_blank"
          rel="noreferrer"
          className="link-aisweb"
        >
          📚 BAIXAR CARTAS (AISWEB) ↗
        </a>
      </div>

      {/* ⏰ FOOTER CENTRAL */}
      <div className="footer-clarity">
        <span>
          UTC:{" "}
          <b style={{ color: "#00d2ff" }}>
            {new Date().toISOString().substring(11, 16)}Z
          </b>
        </span>
        <span style={{ color: "#555" }}>|</span>
        <span>
          📏 ROTA:{" "}
          <b style={{ color: "#00d2ff", fontSize: "1.1rem" }}>
            {dist ? `${dist} NM` : "---"}
          </b>
        </span>
        <span style={{ color: "#555" }}>|</span>
        <span>
          ⏱️ ETE:{" "}
          <b style={{ color: "#00d2ff", fontSize: "1.1rem" }}>
            {dist ? tempo : "---"}
          </b>
        </span>
        <span>
          <span
            style={{
              color: isServerOnline ? "#00ff00" : "#ff4d4d",
              marginRight: "8px",
            }}
          >
            ●
          </span>
          <b style={{ color: isServerOnline ? "#00ff00" : "#ff4d4d" }}>
            RADAR {isServerOnline ? "ONLINE" : "OFFLINE"}
          </b>
        </span>
      </div>
    </div>
  );
}

export default App;
