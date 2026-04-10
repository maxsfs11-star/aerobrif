import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "./App.css";

// Cria o ícone do radar (o CSS .blip foi atualizado para fundo claro)
const blipIcon = new L.DivIcon({
  html: '<div class="blip"></div>',
  className: "radar-blip-container",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// 📍 Coordenadas de GPS dos principais aeroportos para traçar a rota
const gpsAeroportos = {
  SBSP: { coords: [-23.6261, -46.6564], fuso: -3 }, // Congonhas (SP)
  SBGR: { coords: [-23.4356, -46.4731], fuso: -3 }, // Guarulhos (SP)
  SBGL: { coords: [-22.8089, -43.2436], fuso: -3 }, // Galeão (RJ)
  SBBR: { coords: [-15.8692, -47.9208], fuso: -3 }, // Brasília (DF)
  SBCY: { coords: [-15.6529, -56.1167], fuso: -4 }, // Cuiabá (MT) - Fuso Diferente
  SBEG: { coords: [-3.0358, -60.0463], fuso: -4 }, // Manaus (AM) - Fuso Diferente
  SBRB: { coords: [-9.8683, -67.898], fuso: -5 }, // Rio Branco (AC) - Fuso Diferente
};

function App() {
  const [origem, setOrigem] = useState("SBSP");
  const [destino, setDestino] = useState("SBGL");
  const [radar, setRadar] = useState([]);
  const [loadingRota, setLoadingRota] = useState(false);

  const [dadosOrigem, setDadosOrigem] = useState(null);
  const [dadosDestino, setDadosDestino] = useState(null);

  // RADAR AO VIVO COM BIPE
  useEffect(() => {
    const tocarBipe = () => {
      try {
        const audioCtx = new (
          window.AudioContext || window.webkitAudioContext
        )();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime); // Volume sutil
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } catch {
        /* Ignora se o usuário não interagiu ainda */
      }
    };

    const buscarRadar = () => {
      fetch("http://localhost:3001/api/radar")
        .then((res) => res.json())
        .then((data) => {
          // 🛡️ TRAVA DE SEGURANÇA: Só atualiza se o que vier for uma lista (Array)
          if (Array.isArray(data)) {
            setRadar(data);
            tocarBipe();
          } else {
            setRadar([]); // Se vier erro do servidor, limpa o radar mas não quebra o site
          }
        })
        .catch(() => {
          console.log("Radar offline");
          setRadar([]);
        });
    };

    buscarRadar();
    const interval = setInterval(buscarRadar, 10000); // Atualiza a cada 10s
    return () => clearInterval(interval);
  }, []);

  // FUNÇÃO DE CARREGAR ROTA DO SERVIDOR
  const carregarDadosDaRota = async () => {
    if (!origem || !destino) return;
    setLoadingRota(true);

    try {
      const resOrigem = await fetch(
        `http://localhost:3001/api/aerodromo/${origem}`,
      );
      const dataOrigem = await resOrigem.json();
      setDadosOrigem(dataOrigem);

      const resDestino = await fetch(
        `http://localhost:3001/api/aerodromo/${destino}`,
      );
      const dataDestino = await resDestino.json();
      setDadosDestino(dataDestino);
    } catch (error) {
      console.error("Erro ao carregar rota:", error);
    } finally {
      setLoadingRota(false);
    }
  };

  // Função para pegar a hora local baseada no fuso do aeroporto
  const getHoraLocal = (icao) => {
    const aeroporto = gpsAeroportos[icao];
    if (!aeroporto) return "--:--";

    // Pega a hora UTC atual
    const agoraUTC = new Date();
    const utc = agoraUTC.getTime() + agoraUTC.getTimezoneOffset() * 60000;

    // Aplica o fuso do aeroporto
    const horaLocal = new Date(utc + 3600000 * aeroporto.fuso);

    return horaLocal.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="dashboard-container">
      {/* 🗺️ O MAPA DE FUNDO INTERATIVO (TEMA CLARO) */}
      {/* 🗺️ O MAPA DE FUNDO INTERATIVO (TEMA CLARO + CLIMA) */}
      <div className="mapa-fundo">
        <MapContainer
          center={[-23.5505, -46.6333]}
          zoom={7}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          {/* 1. O Mapa Base Claro (CartoDB Positron) */}
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

          {/* 2. 🌩️ CAMADA DE CHUVA AO VIVO (OpenWeatherMap) */}
          {/* ⚠️ Lembre-se de trocar 'SUA_CHAVE_AQUI' pela sua API Key de verdade depois */}
          <TileLayer
            url="https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=e6fd4ff8d4378e1a25f023b7a22f2f97"
            opacity={1.3}
          />

          {gpsAeroportos[origem] && gpsAeroportos[destino] && (
            <Polyline
              positions={[
                gpsAeroportos[origem].coords,
                gpsAeroportos[destino].coords,
              ]}
              color="var(--neon-blue)"
              weight={4}
              dashArray="10, 10"
              opacity={0.8}
            />
          )}

          {/* VARREDURA DO RADAR REAL */}
          {radar.map((aviao, index) => {
            if (!aviao.lat || !aviao.lng) return null;

            return (
              <Marker
                key={index}
                position={[aviao.lat, aviao.lng]}
                icon={blipIcon}
              >
                <Popup>
                  <strong
                    style={{ color: "var(--neon-green)", fontSize: "1.1rem" }}
                  >
                    Voo: {aviao.id}
                  </strong>
                  <br />
                  🌍 <b>Registro:</b> {aviao.origem}
                  <br />
                  📏 <b>Altitude:</b> {aviao.altitude}
                  <br />
                  💨 <b>Velocidade:</b> {aviao.velocidade}
                  <br />
                  🧭 <b>Proa:</b> {aviao.angulo}°<br />
                  🚦 <b>Status:</b> {aviao.status}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* 📊 LEGENDA DE INTENSIDADE DA CHUVA ADICIONADA AQUI */}
        <div className="legenda-clima">
          <div className="legenda-titulo">🌩️ INTENSIDADE (mm/h)</div>
          <div className="legenda-item">
            <div className="cor-box" style={{ background: "#87CEFA" }}></div>{" "}
            Chuva Leve (0.1 - 2)
          </div>
          <div className="legenda-item">
            <div className="cor-box" style={{ background: "#32CD32" }}></div>{" "}
            Moderada (2 - 10)
          </div>
          <div className="legenda-item">
            <div className="cor-box" style={{ background: "#FFD700" }}></div>{" "}
            Chuva Forte (10 - 50)
          </div>
          <div className="legenda-item">
            <div className="cor-box" style={{ background: "#FF4500" }}></div>{" "}
            Toró / Severa (&gt; 50)
          </div>
          <div className="legenda-item">
            <div className="cor-box" style={{ background: "#9400D3" }}></div>{" "}
            Granizo Extremo
          </div>
        </div>
      </div>

      {/* 🎛️ CONTROLES SUPERIORES (TEMA CLARO) */}
      <header className="header-hud">
        <h1>
          AERO<span>BRIF</span>
        </h1>
        <input
          value={origem}
          onChange={(e) => setOrigem(e.target.value.toUpperCase())}
          placeholder="ORIGEM"
        />
        <span style={{ color: "var(--primary-blue)" }}>✈️</span>
        <input
          value={destino}
          onChange={(e) => setDestino(e.target.value.toUpperCase())}
          placeholder="DESTINO"
        />
        <button onClick={carregarDadosDaRota}>
          {loadingRota ? "CARREGANDO..." : "CARREGAR ROTA"}
        </button>
      </header>

      {/* 🛫 PAINEL ESQUERDO: ORIGEM COMPLETA */}
      <aside className="painel-lateral esquerda">
        <h2
          style={{
            color: "var(--neon-blue)",
            borderBottom: "1px solid var(--glass-border)",
            paddingBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>🛫 ORIGEM: {origem || "---"}</span>
          <span style={{ fontSize: "0.9rem", color: "#fff" }}>
            🕒 LOCAL: {getHoraLocal(origem)}
          </span>
        </h2>

        <div className="sessao-dados">
          <h4>METAR & TAF (Meteorologia Oficial)</h4>
          <p>
            <span className="dado-destaque">METAR:</span>{" "}
            {dadosOrigem ? dadosOrigem.metar : "Aguardando rota..."}
          </p>
          <p style={{ marginTop: "5px" }}>
            <span className="dado-destaque">TAF:</span>{" "}
            {dadosOrigem ? dadosOrigem.taf : "Aguardando rota..."}
          </p>
        </div>

        <div className="sessao-dados">
          <h4>CONDIÇÕES LOCAIS</h4>
          <p>
            🌬️ <strong>Vento:</strong> {dadosOrigem ? dadosOrigem.vento : "---"}
          </p>
          <p>
            🌡️ <strong>Clima:</strong> {dadosOrigem ? dadosOrigem.clima : "---"}
          </p>
          <p>
            ⚖️ <strong>Pressão:</strong>{" "}
            {dadosOrigem ? dadosOrigem.pressao : "---"}
          </p>

          {/* CORREÇÃO DO SOL (Tratando objeto) */}
          <p>
            ☀️ <strong>Sol:</strong>{" "}
            {dadosOrigem
              ? dadosOrigem.sol.nascer
                ? `Nascer: ${dadosOrigem.sol.nascer} | Ocaso: ${dadosOrigem.sol.ocaso}`
                : dadosOrigem.sol
              : "---"}
          </p>
        </div>

        <div className="sessao-dados">
          <h4>DADOS DA PISTA</h4>
          <p>🛣️ {dadosOrigem ? dadosOrigem.pista : "Aguardando rota..."}</p>
        </div>

        <div className="sessao-dados">
          <h4>AVISOS (NOTAM)</h4>
          <p>{dadosOrigem ? dadosOrigem.notam : "Aguardando rota..."}</p>
          {dadosOrigem && dadosOrigem.passaros && (
            <div className="alerta-fauna">{dadosOrigem.passaros}</div>
          )}
        </div>

        <div
          className="sessao-dados"
          style={{ background: "transparent", border: "none", padding: 0 }}
        >
          <h4>📦 CARTAS PARA DOWNLOAD (AISWEB)</h4>
          <div className="cartas-grid">
            {dadosOrigem?.cartas?.map((c) => (
              <a href="#" className="btn-carta" key={c}>
                {c}
              </a>
            ))}
          </div>
        </div>
      </aside>

      {/* 🛬 PAINEL DIREITO: DESTINO COMPLETO */}
      <aside className="painel-lateral direita">
        <h2
          style={{
            color: "var(--neon-green)",
            borderBottom: "1px solid var(--glass-border)",
            paddingBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>🛬 DESTINO: {destino || "---"}</span>
          <span style={{ fontSize: "0.9rem", color: "#fff" }}>
            🕒 LOCAL: {getHoraLocal(destino)}
          </span>
        </h2>

        <div
          className="sessao-dados"
          style={{ borderLeftColor: "var(--primary-green)" }}
        >
          <h4 style={{ color: "var(--primary-green)" }}>METAR & TAF</h4>
          <p>
            <span className="dado-destaque">METAR:</span>{" "}
            {dadosDestino ? dadosDestino.metar : "Aguardando rota..."}
          </p>
          <p style={{ marginTop: "5px" }}>
            <span className="dado-destaque">TAF:</span>{" "}
            {dadosDestino ? dadosDestino.taf : "Aguardando rota..."}
          </p>
        </div>

        <div
          className="sessao-dados"
          style={{ borderLeftColor: "var(--primary-green)" }}
        >
          <h4 style={{ color: "var(--primary-green)" }}>CONDIÇÕES LOCAIS</h4>
          <p>
            🌬️ <strong>Vento:</strong>{" "}
            {dadosDestino ? dadosDestino.vento : "---"}
          </p>
          <p>
            🌡️ <strong>Clima:</strong>{" "}
            {dadosDestino ? dadosDestino.clima : "---"}
          </p>
          <p>
            ⚖️ <strong>Pressão:</strong>{" "}
            {dadosDestino ? dadosDestino.pressao : "---"}
          </p>

          {/* CORREÇÃO DO SOL (Tratando objeto) */}
          <p>
            ☀️ <strong>Sol:</strong>{" "}
            {dadosDestino
              ? dadosDestino.sol.nascer
                ? `Nascer: ${dadosDestino.sol.nascer} | Ocaso: ${dadosDestino.sol.ocaso}`
                : dadosDestino.sol
              : "---"}
          </p>
        </div>

        <div
          className="sessao-dados"
          style={{ borderLeftColor: "var(--primary-green)" }}
        >
          <h4 style={{ color: "var(--primary-green)" }}>DADOS DA PISTA</h4>
          <p>🛣️ {dadosDestino ? dadosDestino.pista : "Aguardando rota..."}</p>
        </div>

        <div
          className="sessao-dados"
          style={{ borderLeftColor: "var(--primary-green)" }}
        >
          <h4 style={{ color: "var(--primary-green)" }}>AVISOS (NOTAM)</h4>
          <p>{dadosDestino ? dadosDestino.notam : "Aguardando rota..."}</p>
          {dadosDestino && dadosDestino.passaros && (
            <div className="alerta-fauna">{dadosDestino.passaros}</div>
          )}
        </div>

        <div
          className="sessao-dados"
          style={{ background: "transparent", border: "none", padding: 0 }}
        >
          <h4 style={{ color: "var(--primary-green)" }}>
            📦 DOWNLOAD DE CARTAS
          </h4>
          <div className="cartas-grid">
            {dadosDestino?.cartas?.map((c) => (
              <a
                href="#"
                className="btn-carta"
                style={{
                  borderColor: "var(--primary-green)",
                  color: "var(--primary-green)",
                }}
                key={c}
              >
                {c}
              </a>
            ))}
          </div>
        </div>
      </aside>

      {/* ⏰ BARRA INFERIOR DE SISTEMA */}
      <footer className="barra-inferior">
        <span>UTC: {new Date().toISOString().substring(11, 16)}Z</span>
        <span>|</span>
        <span>AEROBRIF CLARITY V2.0</span>
        <span>|</span>
        <span>RADAR REALTIME: ONLINE</span>
      </footer>
    </div>
  );
}

export default App;
