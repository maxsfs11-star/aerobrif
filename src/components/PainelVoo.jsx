import React from "react";

export default function PainelVoo({
  tipo, // "origem" ou "destino"
  icao,
  horaLocal,
  metar,
  taf,
  condicoes,
  sol,
  info, // Dados do aeroporto (gpsAeroportos)
  notamLista,
}) {
  const listaSegura = notamLista || ["Aguardando NOTAM..."];

  const isOrigem = tipo === "origem";
  const icone = isOrigem ? "🛫 ORIGEM" : "🛬 DESTINO";

  return (
    <div className={`panel-side ${isOrigem ? "panel-left" : "panel-right"}`}>
      <div className="panel-title">
        <span>
          {icone}: {icao || "---"}
        </span>
        <span>🕒 LOCAL: {horaLocal}</span>
      </div>

      {/* 🌦️ METAR & TAF */}
      <div className="card-clarity">
        <h4 style={{ marginBottom: "10px" }}>🌦️ METAR & TAF OFICIAL (NOAA)</h4>
        <p style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: "2px" }}>
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
          {metar}
        </p>
        <p style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: "2px" }}>
          TAF (Previsão):
        </p>
        <p
          style={{
            fontFamily: "monospace",
            color: "var(--neon-green)",
            lineHeight: "1.2",
          }}
        >
          {taf}
        </p>
      </div>

      {/* 🌡️ CONDIÇÕES LOCAIS */}
      <div className="card-clarity">
        <h4>CONDIÇÕES LOCAIS {isOrigem ? "ORIGEM" : "DESTINO"}</h4>
        <p>
          🌬️ <b>Vento:</b> {condicoes.vento}
        </p>
        <p>
          🌡️ <b>Clima:</b> {condicoes.clima} ({condicoes.temperatura})
        </p>
        <p>
          ⚖️ <b>Pressão:</b> {condicoes.pressao}
        </p>
        <p>
          ☀️ <b>Sol:</b> 🌅 {sol.nascer} / 🌇 {sol.por}
        </p>
      </div>

      {/* 🏔️ RAIO-X DA INFRAESTRUTURA */}
      <div
        className="card-clarity"
        style={{ borderTopColor: "var(--cyan-neon)" }}
      >
        <h4>Raio-X da Infraestrutura</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
              {info?.elevacao || "---"} ft
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
                  width: `${((info?.comprimento || 0) / 4000) * 100}%`,
                  height: "100%",
                  background:
                    (info?.comprimento || 0) < 1500
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
              <b>{info?.comprimento || "---"} metros</b>
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
              📡 <b>TWR:</b> {info?.freqTorre || "---"}
            </p>
            <p>
              📻 <b>GND:</b> {info?.freqSolo || "---"}
            </p>
          </div>
        </div>
      </div>

      {/* ⚠️ NOTAM (VISUAL OFICIAL DECEA CONSERTADO) */}
      <div className="card-clarity" style={{ borderTopColor: "#FFD700" }}>
        <h4 style={{ color: "#FFD700", marginBottom: "15px" }}>
          AVISOS (NOTAM)
        </h4>
        <div
          style={{
            maxHeight: "220px",
            overflowY: "auto",
            fontSize: "0.75rem",
            color: "#ccc",
          }}
        >
          <div
            style={{
              maxHeight: "250px",
              overflowY: "auto",
              fontSize: "0.75rem",
              color: "#ccc",
            }}
          >
            {listaSegura.map((notam, idx) => {
              // Proteções caso a API falhe
              const tituloCompleto = notam.titulo || "AVISO";
              const corpo = notam.corpo || notam;
              const validade = notam.validade || "";

              // 🔪 FATIADOR DE TÍTULO: Separa "F1743/26 N 13/04/2026 19:39" em pedaços
              const partesTitulo = tituloCompleto.split(" ");
              const idNotam = partesTitulo[0] || "NOTAM"; // Pega o F1743/26
              const tipoNotam = partesTitulo[1] || ""; // Pega o N, R ou C
              const dataEmissao = partesTitulo.slice(2).join(" "); // Pega o resto (a data)

              return (
                <div
                  key={idx}
                  style={{
                    marginBottom: "15px",
                    borderBottom: "1px solid #333",
                    paddingBottom: "10px",
                  }}
                >
                  {/* 1. CABEÇALHO (Etiquetas Verdes e Data) */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    {/* Etiqueta 1 (Ex: F1743/26) */}
                    <span
                      style={{
                        background: "#28a745",
                        color: "#fff",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                      }}
                    >
                      {idNotam}
                    </span>

                    {/* Etiqueta 2 (Ex: N) - Só aparece se existir */}
                    {tipoNotam && (
                      <span
                        style={{
                          background: "#28a745",
                          color: "#fff",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                        }}
                      >
                        {tipoNotam}
                      </span>
                    )}

                    {/* Data de Emissão */}
                    <span
                      style={{
                        color: "#aaa",
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                      }}
                    >
                      {dataEmissao}
                    </span>
                  </div>

                  {/* 2. CORPO DO TEXTO (Mantendo a formatação real) */}
                  <p
                    style={{
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.4",
                      fontFamily: "monospace",
                      color: "#ccc",
                    }}
                  >
                    {corpo}
                  </p>

                  {/* 3. RODAPÉ DE VALIDADE (O Calendário) */}
                  {validade && (
                    <div
                      style={{
                        marginTop: "10px",
                        color: "#888",
                        fontSize: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontFamily: "monospace",
                      }}
                    >
                      🗓️ {validade}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <a
          href={`https://aisweb.decea.mil.br/?i=notam&loc=${icao}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "block",
            textAlign: "center",
            background: "rgba(255, 215, 0, 0.1)",
            color: "#FFD700",
            textDecoration: "none",
            padding: "5px",
            borderRadius: "4px",
            fontSize: "0.8rem",
            border: "1px solid rgba(255, 215, 0, 0.3)",
            marginTop: "10px",
          }}
        >
          ⚠️ VER ORIGINAL NO AISWEB ↗
        </a>
      </div>

      {/* 📚 BOTÕES DE DESPACHO OFICIAL (ROTAER E CARTAS) */}
      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
        {/* NOVO: Botão ROTAER (Abre a nova sala que criamos no App.jsx) */}
        <a
          href={`/?rotaer=${icao}`}
          target="_blank"
          rel="noreferrer"
          className="btn-cartas"
          style={{
            flex: 1,
            background: "#1a1a1a",
            border: "1px solid #444",
            color: "var(--cyan-neon)",
            fontSize: "0.75rem",
          }}
        >
          📖 ROTAER ↗
        </a>

        {/* Botão CARTAS (O que já existia) */}
        <a
          href={`/?cartas=${icao}`}
          target="_blank"
          rel="noreferrer"
          className="btn-cartas"
          style={{ flex: 1, fontSize: "0.75rem" }}
        >
          🗺️ CARTAS ↗
        </a>
      </div>
    </div>
  );
}
