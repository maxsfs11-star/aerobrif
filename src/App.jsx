import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { gpsAeroportos } from "./aeroportos";
import PainelVoo from "./components/PainelVoo";

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
  if (!distanciaNM || distanciaNM <= 0) return "--h --m";
  const tempoHoras = distanciaNM / 450;
  const horas = Math.floor(tempoHoras);
  const minutos = Math.round((tempoHoras - horas) * 60);
  return `${horas}h ${minutos < 10 ? "0" : ""}${minutos}m`;
};

// 🧠 MÁQUINA DE DECODIFICAÇÃO DE METAR
const decodificarMetar = (metar) => {
  if (!metar || metar.includes("Indisponível") || metar === "Buscando...") {
    return {
      vento: "---",
      clima: "Aguardando...",
      pressao: "---",
      temperatura: "---",
    };
  }

  // 1. Extrair Vento (Ex: 18007KT, VRB05KT, 12015G25KT)
  let ventoStr = "---";
  const ventoMatch = metar.match(/(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?KT/);
  if (ventoMatch) {
    const dir = ventoMatch[1] === "VRB" ? "Variável" : `${ventoMatch[1]}°`;
    const vel = parseInt(ventoMatch[2], 10);
    const rajada = ventoMatch[3]
      ? ` (Rajadas ${parseInt(ventoMatch[3], 10)}kt)`
      : "";
    ventoStr = `${dir} / ${vel}kt${rajada}`;
  }

  // 2. Extrair Temperatura (Ex: 20/18, M05/M08)
  let tempStr = "---";
  const tempMatch = metar.match(/(M?\d{2})\/(M?\d{2})/);
  if (tempMatch) {
    const temp = tempMatch[1].replace("M", "-"); // Troca M por sinal de negativo
    tempStr = `${parseInt(temp, 10)}°C`;
  }

  // 3. Extrair Pressão/QNH (Ex: Q1016, A2992)
  let pressaoStr = "---";
  const qnhMatch = metar.match(/Q(\d{4})/);
  if (qnhMatch) {
    pressaoStr = `${parseInt(qnhMatch[1], 10)} hPa`;
  }

  // 4. Condição Geral / Teto
  let climaStr = "Visibilidade Normal";
  if (metar.includes("CAVOK")) climaStr = "Céu Claro (CAVOK)";
  else if (metar.includes("TSRA") || metar.includes("TS "))
    climaStr = "Tempestade ⛈️";
  else if (metar.includes("+RA")) climaStr = "Chuva Forte 🌧️";
  else if (metar.includes("-RA")) climaStr = "Chuva Leve 🌦️";
  else if (metar.includes("RA")) climaStr = "Chuva Moderada 🌧️";
  else if (metar.includes("FG") || metar.includes("BR"))
    climaStr = "Nevoeiro/Neblina 🌫️";
  else if (metar.includes("OVC")) climaStr = "Céu Encoberto ☁️";
  else if (metar.includes("BKN")) climaStr = "Parcialmente Nublado ⛅";
  else if (metar.includes("SCT") || metar.includes("FEW"))
    climaStr = "Algumas Nuvens 🌤️";

  return {
    vento: ventoStr,
    temperatura: tempStr,
    pressao: pressaoStr,
    clima: climaStr,
  };
};

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const paginaCartas = urlParams.get("cartas");
  const paginaRotaer = urlParams.get("rotaer");
  const [loadingCartas, setLoadingCartas] = useState(!!paginaCartas);
  const [loadingRotaer, setLoadingRotaer] = useState(!!paginaRotaer); // 👈 NOVO
  const [dadosRotaer, setDadosRotaer] = useState([]); // 👈 NOVO
  const [origemInput, setOrigemInput] = useState("");
  const [destinoInput, setDestinoInput] = useState("");
  const [origemAtiva, setOrigemAtiva] = useState("");
  const [destinoAtivo, setDestinoAtivo] = useState("");
  const [radar, setRadar] = useState([]);
  const [cidadesSobrevoo, setCidadesSobrevoo] = useState({});
  const [isServerOnline, setIsServerOnline] = useState(false);

  // Estados do Clima e Avisos
  const [metarOrigem, setMetarOrigem] = useState("Aguardando NOAA...");
  const [metarDestino, setMetarDestino] = useState("Aguardando NOAA...");
  const [tafOrigem, setTafOrigem] = useState("Aguardando NOAA...");
  const [tafDestino, setTafDestino] = useState("Aguardando NOAA...");
  const [notamOrigem, setNotamOrigem] = useState(["Aguardando NOTAM..."]);
  const [notamDestino, setNotamDestino] = useState(["Aguardando NOTAM..."]);

  const [origemClima, setOrigemClima] = useState("");
  const [destinoClima, setDestinoClima] = useState("");

  // ☀️ Estados do Sol
  const [solOrigem, setSolOrigem] = useState({ nascer: "--:--", por: "--:--" });
  const [solDestino, setSolDestino] = useState({
    nascer: "--:--",
    por: "--:--",
  });

  // 🧠 RADAR MATEMÁTICO: Fórmula de Haversine (Distância em KM)
  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raio da Terra em KM
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 🕵️‍♂️ BUSCADOR AUTOMÁTICO DE ESTAÇÃO METEOROLÓGICA
  const encontrarMetarMaisProximo = (latAlvo, lonAlvo) => {
    let aeroMaisProximo = null;
    let menorDistancia = Infinity;

    // O sistema olha todos os aeroportos do seu banco
    Object.keys(gpsAeroportos).forEach((icao) => {
      const aero = gpsAeroportos[icao];

      // Se o aeroporto for grande (temMetar: true), ele mede a distância
      if (aero.temMetar === true && aero.coords) {
        const distancia = calcularDistancia(
          latAlvo,
          lonAlvo,
          aero.coords[0], // Puxa a latitude de dentro dos colchetes []
          aero.coords[1], // Puxa a longitude de dentro dos colchetes []
        );

        if (distancia < menorDistancia) {
          menorDistancia = distancia;
          aeroMaisProximo = icao;
        }
      }
    });

    return aeroMaisProximo; // Retorna a sigla do maior aeroporto mais perto!
  };

  // ☀️ CALCULADORA ASTRONÔMICA (Blindada)
  const buscarHorarioSol = async (lat, lon, setSolState) => {
    if (!lat || !lon) {
      setSolState({ nascer: "--:--", por: "--:--" });
      return;
    }

    try {
      setSolState({ nascer: "Buscando...", por: "Buscando..." });

      const resposta = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`,
      );
      const dados = await resposta.json();

      if (dados.status === "OK") {
        const formatarHora = (dataString) => {
          if (!dataString) return "--:--";
          const data = new Date(dataString);
          if (isNaN(data)) return "--:--";
          return data.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          });
        };

        setSolState({
          nascer: formatarHora(dados.results.sunrise),
          por: formatarHora(dados.results.sunset),
        });
      }
    } catch (erro) {
      console.log("Erro no radar solar:", erro);
      setSolState({ nascer: "--:--", por: "--:--" });
    }
  };

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

  {
    /* const handleCarregarRota = () => {
    const infoOrigem = gpsAeroportos[origemInput];

    // 💡 A MÁGICA ACONTECE AQUI:
    // Se a Origem tem METAR próprio, usa ela.
    // Se não tiver, o código descobre sozinho o mais perto!
    let icaoBuscaOrigem = origemInput;
    if (infoOrigem && !infoOrigem.temMetar) {
      icaoBuscaOrigem = encontrarMetarMaisProximo(
        infoOrigem.lat,
        infoOrigem.lon,
      );
      console.log(`Pista pequena! Buscando METAR de: ${icaoBuscaOrigem}`);
    }

    // Agora você usa a variável icaoBuscaOrigem para puxar os dados da NOAA!

    const icaoO = buscarIcao(origemInput);
    const icaoD = buscarIcao(destinoInput);
    if (!icaoO || !icaoD) return alert("⚠️ Erro: Aeroporto não localizado!");
    setMetarOrigem("Buscando...");
    setMetarDestino("Buscando...");
    setTafOrigem("Buscando...");
    setTafDestino("Buscando...");
    setNotamOrigem(["Buscando..."]);
    setNotamDestino(["Buscando..."]);
    setOrigemAtiva(icaoO);
    setDestinoAtivo(icaoD);
  }; */
  }

  const handleCarregarRota = () => {
    // 1. Traduz o que o piloto digitou (Nome para Sigla)
    const icaoO = buscarIcao(origemInput);
    const icaoD = buscarIcao(destinoInput);
    if (!icaoO || !icaoD) return alert("⚠️ Erro: Aeroporto não localizado!");

    const infoOrigem = gpsAeroportos[icaoO];
    const infoDestino = gpsAeroportos[icaoD];

    // 2. INTELIGÊNCIA DA ORIGEM
    let icaoMetarOrigem = icaoO;
    if (infoOrigem && !infoOrigem.temMetar) {
      if (infoOrigem.coords) {
        icaoMetarOrigem = encontrarMetarMaisProximo(
          infoOrigem.coords[0],
          infoOrigem.coords[1],
        );
        console.log(
          `[ORIGEM] Calculou pista pequena. METAR mais perto é: ${icaoMetarOrigem}`,
        );
      } else {
        console.log(`[ALERTA] ${icaoO} não tem 'coords' no banco de dados!`);
      }
    }

    // 3. INTELIGÊNCIA DO DESTINO
    let icaoMetarDestino = icaoD;
    if (infoDestino && !infoDestino.temMetar) {
      if (infoDestino.coords) {
        icaoMetarDestino = encontrarMetarMaisProximo(
          infoDestino.coords[0],
          infoDestino.coords[1],
        );
        console.log(
          `[DESTINO] Calculou pista pequena. METAR mais perto é: ${icaoMetarDestino}`,
        );
      } else {
        console.log(`[ALERTA] ${icaoD} não tem 'coords' no banco de dados!`);
      }
    }

    // 4. Resetar painel e ligar os rádios
    setMetarOrigem("Buscando...");
    setMetarDestino("Buscando...");
    setTafOrigem("Buscando...");
    setTafDestino("Buscando...");
    setNotamOrigem(["Buscando..."]);
    setNotamDestino(["Buscando..."]);

    setOrigemAtiva(icaoO); // 📍 Vai para o Mapa e NOTAM
    setDestinoAtivo(icaoD); // 📍 Vai para o Mapa e NOTAM
    setOrigemClima(icaoMetarOrigem); // ☁️ Vai para a NOAA (METAR/TAF)
    setDestinoClima(icaoMetarDestino); // ☁️ Vai para a NOAA (METAR/TAF)

    if (infoOrigem && infoOrigem.coords) {
      buscarHorarioSol(
        infoOrigem.coords[0],
        infoOrigem.coords[1],
        setSolOrigem,
      );
    } else {
      setSolOrigem({ nascer: "--:--", por: "--:--" });
    }

    if (infoDestino && infoDestino.coords) {
      buscarHorarioSol(
        infoDestino.coords[0],
        infoDestino.coords[1],
        setSolDestino,
      );
    } else {
      setSolDestino({ nascer: "--:--", por: "--:--" });
    }
  };

  useEffect(() => {
    if (paginaCartas) {
      const timer = setTimeout(() => {
        setLoadingCartas(false);
      }, 1500); // 1500 milissegundos = 1.5 segundos
      return () => clearTimeout(timer);
    }
  }, [paginaCartas]);

  // 🚀 CARREGADOR DO ROTAER
  useEffect(() => {
    if (paginaRotaer) {
      fetch(`https://aerobrif.onrender.com/api/rotaer/${paginaRotaer}`)
        .then((res) => res.json())
        .then((data) => {
          setDadosRotaer(data);
          setLoadingRotaer(false);
        })
        .catch(() => {
          setDadosRotaer(["❌ Erro ao buscar ROTAER."]);
          setLoadingRotaer(false);
        });
    }
  }, [paginaRotaer]);

  useEffect(() => {
    if (!origemAtiva || !destinoAtivo || !origemClima || !destinoClima) return;

    // ---- BUSCANDO ORIGEM ----
    // ☁️ METAR e TAF usam o aeroporto GRANDE mais próximo (origemClima)
    fetch(`https://aerobrif.onrender.com/api/metar/${origemClima}`)
      .then((res) => res.json())
      .then((data) =>
        setMetarOrigem(data.length > 0 ? data[0].rawOb : "METAR Indisponível"),
      )
      .catch(() => setMetarOrigem("Erro na Torre"));

    fetch(`https://aerobrif.onrender.com/api/taf/${origemClima}`)
      .then((res) => res.json())
      .then((data) =>
        setTafOrigem(data.length > 0 ? data[0].rawTAF : "TAF Indisponível"),
      )
      .catch(() => setTafOrigem("Erro na Torre"));

    // 📍 NOTAM da ORIGEM (Limpo e direto)
    fetch(`https://aerobrif.onrender.com/api/notam/${origemAtiva}`)
      .then((res) => res.json())
      .then((data) => {
        // Agora nós aceitamos a lista de objetos do jeito que o servidor mandar!
        setNotamOrigem(
          Array.isArray(data) && data.length > 0
            ? data
            : [{ titulo: "✅ STATUS", corpo: "Nenhum NOTAM crítico." }],
        );
      })
      .catch(() =>
        setNotamOrigem([
          { titulo: "❌ ERRO", corpo: "Falha ao carregar NOTAMs." },
        ]),
      );

    // ---- BUSCANDO DESTINO ----
    // ☁️ METAR e TAF do Destino
    fetch(`https://aerobrif.onrender.com/api/metar/${destinoClima}`)
      .then((res) => res.json())
      .then((data) =>
        setMetarDestino(data.length > 0 ? data[0].rawOb : "METAR Indisponível"),
      )
      .catch(() => setMetarDestino("Erro na Torre"));

    // 📍 NOTAM do DESTINO (Limpo e direto)
    fetch(`https://aerobrif.onrender.com/api/notam/${destinoAtivo}`)
      .then((res) => res.json())
      .then((data) => {
        setNotamDestino(
          Array.isArray(data) && data.length > 0
            ? data
            : [{ titulo: "✅ STATUS", corpo: "Nenhum NOTAM crítico." }],
        );
      })
      .catch(() =>
        setNotamDestino([
          { titulo: "❌ ERRO", corpo: "Falha ao carregar NOTAMs." },
        ]),
      );
  }, [origemAtiva, destinoAtivo, origemClima, destinoClima]);

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

  // Temporizador das Cartas
  useEffect(() => {
    if (paginaCartas) {
      const timer = setTimeout(() => {
        setLoadingCartas(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paginaCartas]);

  // 👇 ADICIONE O TEMPORIZADOR DO ROTAER AQUI 👇
  useEffect(() => {
    if (paginaRotaer) {
      const timer = setTimeout(() => {
        setLoadingRotaer(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paginaRotaer]);

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

  // Processa o clima em tempo real para os cards resumos
  const condOrigem = decodificarMetar(metarOrigem);
  const condDestino = decodificarMetar(metarDestino);

  // 🚀 INTERCEPTADOR DE URL (SALA DE CARTAS E LOADING)
  // 🚀 INTERCEPTADOR DE URL (SALA DE CARTAS E LOADING)
  if (paginaCartas) {
    // 1. TELA DE LOADING (O Avião)
    // 1. TELA DE LOADING (Radar Customizado - 100% Grátis)
    if (loadingCartas) {
      return (
        <div className="loading-cartas-container">
          {/* 👇 O NOSSO RADAR CSS 👇 */}
          <div className="radar-box">
            <div className="radar-sweep"></div>
          </div>

          <h2 className="loading-texto">CARREGANDO ...</h2>
          <div className="loading-barra">
            <div className="loading-progresso"></div>
          </div>
        </div>
      );
    }

    // 2. TELA DA SALA DE CARTAS (A página completa)
    const aero = gpsAeroportos[paginaCartas];

    return (
      <div className="sala-cartas-container">
        <div className="sala-cartas-content">
          <h1 className="sala-cartas-titulo fade-in">
            AEROBRIF <span>| SALA DE DESPACHO</span>
          </h1>
          <hr className="sala-cartas-linha" />

          <div className="sala-cartas-header">
            <h2 className="sala-cartas-icao">{paginaCartas}</h2>
            <p className="sala-cartas-cidade fade-in">
              {aero ? `${aero.nome} - ${aero.cidade}` : "Aeródromo Localizado"}
            </p>
          </div>

          <div className="sala-cartas-box">
            <h3 className="fade-in">⚠️ Repositório Oficial DECEA</h3>
            <p className="fade-in">
              Por diretrizes de segurança aeronáutica, as cartas de procedimento
              (ADC, SID, STAR, IAC) devem ser consultadas diretamente na fonte
              oficial. Utilize o botão abaixo para abrir o pacote atualizado no
              AISWEB.
            </p>

            <a
              href={`https://aisweb.decea.mil.br/?i=aerodromos&codigo=${paginaCartas}`}
              target="_blank"
              rel="noreferrer"
              className="btn-cartas btn-cartas-destaque fade-in"
            >
              📚 BAIXAR PACOTE DE CARTAS ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (paginaCartas) {
    const aero = gpsAeroportos[paginaCartas];
    return (
      <div className="sala-cartas-container">
        <div className="sala-cartas-content">
          <h1 className="sala-cartas-titulo fade-in">
            AEROBRIF <span>| SALA DE DESPACHO</span>
          </h1>
          <hr className="sala-cartas-linha" />

          <div className="sala-cartas-header">
            <h2 className="sala-cartas-icao">{paginaCartas}</h2>
            <p className="sala-cartas-cidade">
              {aero ? `${aero.nome} - ${aero.cidade}` : "Aeródromo Localizado"}
            </p>
          </div>

          <div className="sala-cartas-box">
            <h3 className="fade-in">⚠️ Repositório Oficial DECEA</h3>
            <p className="fade-in">
              Por diretrizes de segurança aeronáutica, as cartas de procedimento
              (ADC, SID, STAR, IAC) devem ser consultadas diretamente na fonte
              oficial. Utilize o botão abaixo para abrir o pacote atualizado no
              AISWEB.
            </p>

            <a
              href={`https://aisweb.decea.mil.br/?i=aerodromos&codigo=${paginaCartas}`}
              target="_blank"
              rel="noreferrer"
              className="btn-cartas btn-cartas-destaque fade-in"
            >
              📚 BAIXAR PACOTE DE CARTAS ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 🚀 INTERCEPTADOR ROTAER (SALA DE ROTAER)
  if (paginaRotaer) {
    if (loadingRotaer) {
      return (
        <div className="loading-cartas-container">
          <div className="radar-box">
            <div className="radar-sweep"></div>
          </div>
          <h2 className="loading-texto">BUSCANDO ROTAER ...</h2>
          <div className="loading-barra">
            <div className="loading-progresso"></div>
          </div>
        </div>
      );
    }

    const aero = gpsAeroportos[paginaRotaer];

    return (
      <div className="sala-cartas-container">
        <div className="sala-cartas-content">
          <h1 className="sala-cartas-titulo fade-in">
            AEROBRIF <span>| ROTAER & SUPLEMENTOS</span>
          </h1>
          <hr className="sala-cartas-linha" />

          <div className="sala-cartas-header">
            <h2 className="sala-cartas-icao">{paginaRotaer}</h2>
            <p className="sala-cartas-cidade fade-in">
              {aero ? `${aero.nome} - ${aero.cidade}` : "Aeródromo Localizado"}
            </p>
          </div>

          <div className="sala-cartas-box">
            <h3 className="fade-in" style={{ color: "#FFD700" }}>
              ⚠️ Acesso ao ROTAER
            </h3>
            <p className="fade-in">
              As informações de ROTAER (frequências, PCN de pista, restrições e
              combustíveis) devem ser consultadas no documento oficial
              atualizado. Clique abaixo para abrir.
            </p>

            <a
              href={`https://aisweb.decea.mil.br/?i=aerodromos&codigo=${paginaRotaer}`}
              target="_blank"
              rel="noreferrer"
              className="btn-cartas btn-cartas-destaque fade-in"
            >
              📖 ABRIR ROTAER NO AISWEB ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="mapa-fundo">
        <MapContainer
          center={[-23.5505, -46.6333]}
          zoom={6}
          maxZoom={22} // Libera o zoom máximo sem quebrar
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          {/* Mapa base escuro - Agora com o limite de fotos reais ajustado (maxNativeZoom) */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={22}
            maxNativeZoom={19}
          />

          {/* ⛈️ CAMADA DE CHUVA (OpenWeatherMap - Direta e Limpa) */}
          <TileLayer
            url="https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=e6fd4ff8d4378e1a25f023b7a22f2f97"
            opacity={0.3}
            zIndex={1}
          />

          {/* Resto dos marcadores (Linha, Origem, Destino) */}
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

          {/* Aviões do Radar */}
          {radar.map((aviao) => (
            <Marker
              key={aviao.id}
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
                  📍 <b>Local:</b> {cidadesSobrevoo[aviao.id] || "Buscando..."}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="header-clarity">
        <div className="logo">AEROBRIF</div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginLeft: "20px",
            marginRight: "auto",
          }}
        ></div>

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

      {/* 🛫 PAINEL DA ORIGEM COMPONENTIZADO */}
      <PainelVoo
        tipo="origem"
        icao={origemAtiva}
        horaLocal={getHoraLocal(origemAtiva)}
        metar={metarOrigem}
        taf={tafOrigem}
        condicoes={condOrigem}
        sol={solOrigem}
        info={gpsAeroportos[origemAtiva]}
        notamLista={notamOrigem}
      />

      {/* 🛬 PAINEL DO DESTINO COMPONENTIZADO */}
      <PainelVoo
        tipo="destino"
        icao={destinoAtivo}
        horaLocal={getHoraLocal(destinoAtivo)}
        metar={metarDestino}
        taf={tafDestino}
        condicoes={condDestino}
        sol={solDestino}
        info={gpsAeroportos[destinoAtivo]}
        notamLista={notamDestino}
      />

      {/* ⏰ FOOTER CENTRAL (Mantém o footer que já estava aí) */}

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
