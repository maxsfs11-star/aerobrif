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

// 🟢 ÍCONE DE RADAR PISCANDO
const blipIcon = L.divIcon({
  className: "custom-blip",
  html: "<div class='radar-blip'></div>",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// 📍 BANCO DE DADOS COMPLETO DE AEROPORTOS
const gpsAeroportos = {
  SBSP: {
    coords: [-23.6261, -46.6564],
    fuso: -3,
    pista: 170,
    elevacao: 2631,
    comprimento: 1940,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBGR: {
    coords: [-23.4356, -46.4731],
    fuso: -3,
    pista: 90,
    elevacao: 2459,
    comprimento: 3700,
    freqTorre: "118.40",
    freqSolo: "121.70",
  },
  SBGL: {
    coords: [-22.8089, -43.2436],
    fuso: -3,
    pista: 100,
    elevacao: 28,
    comprimento: 4000,
    freqTorre: "118.00",
    freqSolo: "121.65",
  },
  SBRJ: {
    coords: [-22.9105, -43.1626],
    fuso: -3,
    pista: 20,
    elevacao: 10,
    comprimento: 1323,
    freqTorre: "118.00",
    freqSolo: "121.00",
  },
  SBBR: {
    coords: [-15.8692, -47.9208],
    fuso: -3,
    pista: 110,
    elevacao: 3497,
    comprimento: 3300,
    freqTorre: "118.10",
    freqSolo: "121.70",
  },
  SBCY: {
    coords: [-15.6529, -56.1167],
    fuso: -4,
    pista: 170,
    elevacao: 617,
    comprimento: 2300,
    freqTorre: "118.30",
    freqSolo: "121.90",
  },
  SBEG: {
    coords: [-3.0358, -60.0463],
    fuso: -4,
    pista: 110,
    elevacao: 264,
    comprimento: 2700,
    freqTorre: "118.30",
    freqSolo: "121.90",
  },
  SBRB: {
    coords: [-9.8683, -67.898],
    fuso: -5,
    pista: 60,
    elevacao: 633,
    comprimento: 2158,
    freqTorre: "118.70",
    freqSolo: "121.90",
  },
  SBPA: {
    coords: [-29.9939, -51.1711],
    fuso: -3,
    pista: 110,
    elevacao: 11,
    comprimento: 2280,
    freqTorre: "118.10",
    freqSolo: "121.90",
  },
  SBFZ: {
    coords: [-3.7763, -38.5326],
    fuso: -3,
    pista: 130,
    elevacao: 82,
    comprimento: 2545,
    freqTorre: "120.10",
    freqSolo: "121.70",
  },
  SBCF: {
    coords: [-19.6244, -43.9719],
    fuso: -3,
    pista: 160,
    elevacao: 2715,
    comprimento: 3000,
    freqTorre: "118.15",
    freqSolo: "121.80",
  },
};

// 🧮 FUNÇÕES MATEMÁTICAS DA ROTA
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

// ==========================================
// 🚀 INÍCIO DO APLICATIVO PRINCIPAL
// ==========================================
function App() {
  const [origemInput, setOrigemInput] = useState("SBSP");
  const [destinoInput, setDestinoInput] = useState("SBRJ");
  const [origemAtiva, setOrigemAtiva] = useState("SBSP");
  const [destinoAtivo, setDestinoAtivo] = useState("SBRJ");

  const [radar, setRadar] = useState([]);
  const [climaOrigem, setClimaOrigem] = useState(null);
  const [climaDestino, setClimaDestino] = useState(null);
  const [camadaChuva, setCamadaChuva] = useState(null);

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

  const handleCarregarRota = () => {
    setOrigemAtiva(origemInput.toUpperCase());
    setDestinoAtivo(destinoInput.toUpperCase());
  };

  // ==========================================
  // MOTOR 1: 📡 RASTREIO DE AVIÕES (OPENSKY)
  // ==========================================
  useEffect(() => {
    const buscarRadar = () => {
      fetch("http://localhost:3001/api/radar")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setRadar(data);
        })
        .catch((err) => console.log("Aguardando Torre...", err));
    };
    buscarRadar();
    const timer = setInterval(buscarRadar, 15000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================
  // MOTOR 2: ☁️ RASTREIO DE CLIMA (NOAA)
  // ==========================================
  useEffect(() => {
    const buscarClima = async (icao, setClima) => {
      try {
        const res = await fetch(`http://localhost:3001/api/clima/${icao}`);
        const data = await res.json();
        if (!data.error) setClima(data);
      } catch (err) {
        console.error(`Erro NOAA para ${icao}`, err);
      }
    };

    if (gpsAeroportos[origemAtiva]) buscarClima(origemAtiva, setClimaOrigem);
    if (gpsAeroportos[destinoAtivo]) buscarClima(destinoAtivo, setClimaDestino);
  }, [origemAtiva, destinoAtivo]);

  // ==========================================
  // MOTOR 3: 🌧️ RASTREIO DE CHUVA (RAINVIEWER)
  // ==========================================
  useEffect(() => {
    const buscarRadarChuva = async () => {
      try {
        const res = await fetch(
          "https://api.rainviewer.com/public/weather-maps.json",
        );
        const data = await res.json();
        const ultimoRadar = data.radar.past[data.radar.past.length - 1];
        const urlRealTime = `${data.host}${ultimoRadar.path}/256/{z}/{x}/{y}/2/1_1.png`;
        setCamadaChuva(urlRealTime);
      } catch (err) {
        console.error("Falha ao buscar radar de chuva", err);
      }
    };

    buscarRadarChuva();
    const timerChuva = setInterval(buscarRadarChuva, 600000); // Atualiza a cada 10 min
    return () => clearInterval(timerChuva);
  }, []);

  // ==========================================
  // 🧮 CÁLCULOS DE ROTA E VENTO DE TRAVÉS
  // ==========================================
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

    const ventoReal =
      climaDestino?.ventoDir !== "--" ? parseInt(climaDestino?.ventoDir) : 140;
    const forcaReal =
      climaDestino?.ventoVel !== "--" ? parseInt(climaDestino?.ventoVel) : 20;

    const diff = Math.abs(ventoReal - gpsAeroportos[destinoAtivo].pista);
    traves = Math.round(forcaReal * Math.sin((diff * Math.PI) / 180));

    if (traves > 15)
      corAlerta = "#ff4d4d"; // Vermelho
    else if (traves > 10) corAlerta = "#FFD700"; // Amarelo
  }

  // ==========================================
  // 🖥️ RENDERIZAÇÃO DA TELA (VISUAL)
  // ==========================================
  return (
    <div className="app-container">
      {/* 🗺️ MAPA DE FUNDO */}
      <div className="mapa-fundo">
        <MapContainer
          center={[-23.5505, -46.6333]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          {/* MAPA BASE CLARO */}
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

          {/* 🌧️ CAMADA DE CHUVA REAL (RAINVIEWER) */}
          {camadaChuva && (
            <TileLayer url={camadaChuva} opacity={0.6} zIndex={10} />
          )}

          {/* 📍 LINHA DA ROTA */}
          {gpsAeroportos[origemAtiva] && gpsAeroportos[destinoAtivo] && (
            <Polyline
              positions={[
                gpsAeroportos[origemAtiva].coords,
                gpsAeroportos[destinoAtivo].coords,
              ]}
              color="#00d2ff"
              weight={3}
              dashArray="10, 10"
            />
          )}

          {/* ✈️ AVIÕES PISCANDO */}
          {radar.map((aviao, idx) => (
            <Marker key={idx} position={[aviao.lat, aviao.lng]} icon={blipIcon}>
              <Popup>
                <b>Voo: {aviao.id}</b>
                <br />
                Alt: {aviao.altitude} ft
                <br />
                Vel: {aviao.velocidade} kt
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* 🧭 HEADER (BARRA SUPERIOR) */}
      <div className="header-clarity">
        <div className="logo">AEROBRIF</div>
        <input
          value={origemInput}
          onChange={(e) => setOrigemInput(e.target.value.toUpperCase())}
        />
        <span style={{ color: "#fff" }}>✈️</span>
        <input
          value={destinoInput}
          onChange={(e) => setDestinoInput(e.target.value.toUpperCase())}
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
          <h4>METAR OFICIAL (NOAA)</h4>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "0.8rem",
              color: "#fff",
            }}
          >
            {climaOrigem?.metarCru || "Buscando dados na NOAA..."}
          </p>
        </div>

        <div className="card-clarity">
          <h4>CONDIÇÕES LOCAIS</h4>
          <p>
            🌬️ <b>Vento:</b> {climaOrigem?.ventoDir}° / {climaOrigem?.ventoVel}{" "}
            kt
          </p>
          <p>
            🌡️ <b>Temperatura:</b> {climaOrigem?.temperatura}°C
          </p>
          <p>
            ⚖️ <b>Pressão (QNH):</b> {climaOrigem?.pressao} hPa
          </p>
          <p>
            👀 <b>Regra de Voo:</b>{" "}
            <span
              style={{
                color:
                  climaOrigem?.condicao === "VFR"
                    ? "var(--neon-green)"
                    : "#ff4d4d",
              }}
            >
              {climaOrigem?.condicao || "--"}
            </span>
          </p>
        </div>

        {/* 🩻 RAIO-X ORIGEM */}
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
                        ? "#ff4d4d"
                        : "#00d2ff",
                    boxShadow: "0 0 10px #00d2ff",
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
          <h4>METAR OFICIAL (NOAA)</h4>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "0.8rem",
              color: "#fff",
            }}
          >
            {climaDestino?.metarCru || "Buscando dados na NOAA..."}
          </p>
        </div>

        {/* ⚠️ ALERTA DE VENTO */}
        <div className="card-clarity" style={{ borderTopColor: corAlerta }}>
          <h4 style={{ color: corAlerta === "#444" ? "#00d2ff" : corAlerta }}>
            CONDIÇÕES LOCAIS & VENTO
          </h4>
          <p>
            🌬️ <b>Vento Atual:</b> {climaDestino?.ventoDir}° /{" "}
            {climaDestino?.ventoVel} kt
          </p>
          <p>
            ⚠️{" "}
            <b>
              Través na Pista {gpsAeroportos[destinoAtivo]?.pista / 10 || 0}:
            </b>{" "}
            <span style={{ color: corAlerta, fontWeight: "bold" }}>
              {traves} kt
            </span>
          </p>
          <p>
            🌡️ <b>Temperatura:</b> {climaDestino?.temperatura}°C
          </p>
          <p>
            ⚖️ <b>Pressão:</b> {climaDestino?.pressao} hPa
          </p>
        </div>

        {/* 🩻 RAIO-X DESTINO */}
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
                        ? "#ff4d4d"
                        : "#00d2ff",
                    boxShadow: "0 0 10px #00d2ff",
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
          <p>
            ⚠️ <b>PERIGO:</b> Intensa atividade de pássaros (Urubus) na
            aproximação final.
          </p>
          <p>
            ⚠️ <b>ATENÇÃO:</b> Luzes de eixo de pista inoperantes no primeiro
            terço.
          </p>
          <p>⚠️ Pista escorregadia quando molhada.</p>
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

      {/* 🌧️ LEGENDA DO RADAR */}
      <div className="legend-clarity">
        <h4 style={{ color: "#00d2ff", marginBottom: "5px" }}>
          ☂️ INTENSIDADE DA CHUVA
        </h4>
        <p>🟦 Chuva Leve</p>
        <p>🟩 Chuva Moderada</p>
        <p>🟨 Chuva Forte</p>
        <p>🟧 Toró / Severa</p>
        <p>🟪 Granizo Extremo</p>
      </div>

      {/* ⏰ FOOTER CENTRAL COM DISTÂNCIA */}
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
        <span style={{ color: "#555" }}>|</span>
        <span>SISTEMA ONLINE</span>
      </div>
    </div>
  );
}

export default App;
