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
  const [origemInput, setOrigemInput] = useState("");
  const [destinoInput, setDestinoInput] = useState("");
  const [origemAtiva, setOrigemAtiva] = useState("");
  const [destinoAtivo, setDestinoAtivo] = useState("");
  const [radar, setRadar] = useState([]);

  const [isServerOnline, setIsServerOnline] = useState(false);
  const [, setDadosRotaer] = useState(null);

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

  // ✈️ RADAR GLOBAL 100% REAL (Via Vercel Edge Proxy)
  useEffect(() => {
    const bRadar = async () => {
      try {
        // 👇 A URL agora começa com o nosso túnel! O navegador não vai bloquear por CORS.
        const res = await fetch(
          "/proxy-opensky/api/states/all?lamin=-35&lomin=-75&lamax=10&lomax=-30",
        );

        if (!res.ok) throw new Error("Falha no túnel de comunicação.");

        const data = await res.json();

        if (data && data.states && data.states.length > 0) {
          const frotaGlobal = data.states
            .filter((voo) => voo[5] && voo[6])
            .slice(0, 400)
            .map((voo) => ({
              keyReact: String(voo[0]),
              id: voo[1] && voo[1].trim() !== "" ? voo[1].trim() : voo[0],
              lng: voo[5],
              lat: voo[6],
              altitude: voo[7] ? Math.round(voo[7] * 3.28084) : 0,
              velocidade: voo[9] ? Math.round(voo[9] * 1.94384) : 0,
              proa: voo[10] || 0,
            }));

          setRadar(frotaGlobal);
          setIsServerOnline(true);
        } else {
          console.log("Radar Real: Sem aeronaves na área no momento.");
        }
      } catch (err) {
        console.log("Radar em espera:", err.message);
      }
    };

    bRadar();
    // Atualiza a cada 1 minuto (60000) para respeitar os limites reais da antena.
    const timer = setInterval(bRadar, 60000);
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

  useEffect(() => {
    if (paginaRotaer) {
      const timer = setTimeout(() => {
        setLoadingRotaer(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paginaRotaer]);

  const condOrigem = decodificarMetar(metarOrigem);
  const condDestino = decodificarMetar(metarDestino);

  if (paginaCartas) {
    if (loadingCartas) {
      return (
        <div className="loading-cartas-container">
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

    const aero = gpsAeroportos[paginaCartas];

    return (
      <div className="sala-cartas-container fade-in">
        <div className="cartao-rotaer-claro">
          {/* Cabeçalho Correto: SALA DE DESPACHO */}
          <div className="cabecalho-rotaer">
            <strong>AEROBRIF</strong> | SALA DE DESPACHO
          </div>

          {/* ICAO Dinâmico Gigante (Atenção: Aqui usa paginaCartas!) */}
          <h1
            className="titulo-icao-claro"
            style={{
              color: "#0284c7",
              fontSize: "6rem",
              fontWeight: "900",
              margin: "10px 0",
              textTransform: "uppercase",
            }}
          >
            {paginaCartas}
          </h1>

          {/* Nome da Cidade */}
          <p style={{ color: "#475569", fontSize: "16px", marginTop: "5px" }}>
            {aero ? `${aero.nome} - ${aero.cidade}` : "Aeródromo Localizado"}
          </p>

          {/* Caixa de Aviso do DECEA (Cartas) */}
          <div className="caixa-aviso-clara">
            <strong
              style={{
                color: "#b45309",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              ⚠️ Repositório Oficial DECEA
            </strong>
            <p
              style={{ fontSize: "14px", lineHeight: "1.6", margin: "15px 0" }}
            >
              Por diretrizes de segurança aeronáutica, as cartas de procedimento
              (ADC, SID, STAR, IAC) devem ser consultadas diretamente na fonte
              oficial. Utilize o botão abaixo para abrir o pacote atualizado no
              AISWEB.
            </p>

            {/* Botão de Cartas */}
            <button className="botao-aisweb-claro">
              📚 BAIXAR PACOTE DE CARTAS ↗
            </button>
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
          <h2 className="loading-texto">CARREGANDO ...</h2>
          <div className="loading-barra">
            <div className="loading-progresso"></div>
          </div>
        </div>
      );
    }

    const aero = gpsAeroportos[paginaRotaer];

    return (
      <div className="sala-cartas-container fade-in">
        <div className="cartao-rotaer-claro">
          <div className="cabecalho-rotaer">
            <strong>AEROBRIF</strong> | ROTAER & SUPLEMENTOS
          </div>

          {/* ICAO Dinâmico Gigante */}
          {/* Substitua 'paginaRotaer' pela variável de estado que você usa nessa página */}
          <h1 className="titulo-icao-claro">{paginaRotaer}</h1>

          {/* Nome da Cidade */}
          <p style={{ color: "#475569", fontSize: "16px", marginTop: "5px" }}>
            {aero ? `${aero.nome} - ${aero.cidade}` : "Aeródromo Localizado"}
          </p>

          {/* Caixa de Aviso Clara (Amarelada) */}
          <div className="caixa-aviso-clara">
            <strong
              style={{
                color: "#b45309",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              ⚠️ Acesso ao ROTAER
            </strong>
            <p
              style={{ fontSize: "14px", lineHeight: "1.6", margin: "15px 0" }}
            >
              As informações de ROTAER (frequências, PCN de pista, restrições e
              combustíveis) devem ser consultadas no documento oficial
              atualizado. Clique abaixo para abrir.
            </p>

            {/* Botão Escuro de Alto Contraste */}
            <button className="botao-aisweb-claro">
              📖 ABRIR ROTAER NO AISWEB ↗
            </button>
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
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            maxZoom={22}
            maxNativeZoom={19}
          />

          {/* ⛈️ CAMADA DE CHUVA (OpenWeatherMap - Direta e Limpa) */}
          <TileLayer
            url="https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=e6fd4ff8d4378e1a25f023b7a22f2f97"
            opacity={1}
            zIndex={1}
            className="radar-clima"
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
          {radar.map((voo) => {
            // ✈️ O Motor de Renderização do Ícone
            const iconeAviao = L.divIcon({
              className: "custom-plane-icon", // Classe limpa, sem o fundo branco padrão do Leaflet
              iconSize: [24, 24], // Tamanho do avião
              iconAnchor: [12, 12], // O eixo de rotação fica exatamente no meio (12px)

              // Desenhamos o SVG do avião direto no HTML e injetamos a PROA na rotação!
              html: `
      <div style="transform: rotate(${voo.proa}deg); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
        <svg viewBox="0 0 24 24" fill="#FFFFFF" stroke="#000000" stroke-width="1" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.5));">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
      </div>
    `,
            });

            return (
              <Marker
                key={voo.keyReact}
                position={[voo.lat, voo.lng]}
                icon={iconeAviao}
              >
                <Popup>
                  <div style={{ textAlign: "center", minWidth: "130px" }}>
                    {/* O Callsign (Nome do Voo) em destaque com a cor ciano */}
                    <strong
                      style={{
                        fontSize: "18px",
                        color: "#0ea5e9",
                        letterSpacing: "1px",
                      }}
                    >
                      ✈️ {voo.id}
                    </strong>

                    <hr
                      style={{
                        borderColor: "rgba(255,255,255,0.15)",
                        margin: "8px 0",
                      }}
                    />

                    {/* Os dados com a nossa fonte de computador de voo */}
                    <div style={{ textAlign: "left" }}>
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                        ALT:
                      </span>{" "}
                      <span className="fonte-dados">{voo.altitude} ft</span>
                      <br />
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                        VEL:
                      </span>{" "}
                      <span className="fonte-dados">{voo.velocidade} kt</span>
                      <br />
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                        PROA:
                      </span>{" "}
                      <span className="fonte-dados">{voo.proa}°</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* 🧭 BARRA SUPERIOR (COCKPIT) */}
      <div
        className="header-clarity"
        style={{ alignItems: "center", padding: "10px 25px" }}
      >
        {/* 1. LOGO ESTILIZADA */}
        <div className="logo-container">
          <span className="logo-aero">AERO</span>
          <span className="logo-brif">BRIEF</span>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          {/* 2. INPUT DE ORIGEM */}
          <input
            className="input-voo"
            placeholder="SBSP"
            maxLength={4}
            value={origemInput}
            onChange={(e) => setOrigemInput(e.target.value)}
          />

          {/* 3. VETOR SVG DO AVIÃO (Adeus Emoji!) */}
          <svg
            className="icone-aviao"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.5l-1.8 1.8c-.3.3-.2.8.1 1l6.4 2.8-2.6 2.6-2.5-.5c-.4-.1-.8.2-1 .5L1 16.3c-.3.3-.2.8.2 1l3.8 1.4 1.4 3.8c.2.4.7.5 1 .2l1.4-1.4c.3-.3.6-.6.5-1l-.5-2.5 2.6-2.6 2.8 6.4c.2.3.7.4 1 .1l1.8-1.8c.3-.2.6-.6.5-1.1z" />
          </svg>

          {/* 4. INPUT DE DESTINO */}
          <input
            className="input-voo"
            placeholder="SBGL"
            maxLength={4}
            value={destinoInput}
            onChange={(e) => setDestinoInput(e.target.value)}
          />

          {/* 5. BOTÃO COM DEGRADÊ NEON */}
          <button className="btn-carregar" onClick={handleCarregarRota}>
            CARREGAR ROTA
          </button>
        </div>
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

      {/* ⏰ FOOTER CENTRAL */}
      {/* HUD DA BARRA SUPERIOR */}
      <div
        className="painel-vidro status-bar"
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          whiteSpace: "nowrap",
        }}
      >
        {/* Bloco UTC */}
        <div>
          <span className="status-label">UTC:</span>
          {/* A cor azul ciano para destacar a hora oficial */}
          <span className="fonte-dados" style={{ color: "#0ea5e9" }}>
            05:18Z
          </span>
        </div>

        <span className="status-separador">|</span>

        {/* Bloco ROTA */}
        <div>
          <span className="status-label">📏 ROTA:</span>
          <span className="fonte-dados">---</span>
        </div>

        <span className="status-separador">|</span>

        {/* Bloco ETE */}
        <div>
          <span className="status-label">⏱️ ETE:</span>
          <span className="fonte-dados">---</span>
        </div>

        <span className="status-separador">|</span>

        {/* Bloco RADAR (Dinâmico) */}
        <div>
          {isServerOnline ? (
            <>
              <span className="luz-online">●</span>
              <span className="fonte-dados" style={{ color: "#4ade80" }}>
                RADAR ONLINE
              </span>
            </>
          ) : (
            <>
              <span className="luz-offline">●</span>
              <span className="fonte-dados" style={{ color: "#f87171" }}>
                RADAR OFFLINE
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
