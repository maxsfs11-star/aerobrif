import React from "react";

const InfoCard = ({ titulo, dados }) => {
  // Extrai o código ICAO do título (ex: "🛫 ORIGEM: SBSP" vira "SBSP")
  // como uma última garantia caso o dados.icao falhe
  const icaoFallback = titulo.split(": ")[1] || "";

  // Define a cor da borda baseado na categoria (VFR/IFR) vinda do servidor
  const estiloCard = {
    borderColor: dados.cor || "rgba(255, 255, 255, 0.1)",
    boxShadow: dados.categoria === "LIFR" ? `0 0 15px ${dados.cor}` : "none",
  };

  return (
    <section className="card" style={estiloCard}>
      <div className="card-header">
        <div className="header-main">
          <h3>{titulo}</h3>
          {dados.categoria && (
            <span className="badge" style={{ backgroundColor: dados.cor }}>
              {dados.categoria}
            </span>
          )}
        </div>
      </div>

      <div className="info-group">
        <p className="metar-text">
          <strong>METAR:</strong> {dados.metar || "Aguardando busca..."}
        </p>
        <p>
          <strong>PISTA:</strong> {dados.pista || "---"}
        </p>
        <p>
          <strong>SOL:</strong> {dados.sol || "---"}
        </p>
        {dados.passaros && <p className="alerta">{dados.passaros}</p>}
      </div>

      <div className="cartas-container">
        <h4>📦 CARTAS OFICIAIS (AISWEB)</h4>
        <div className="btn-group">
          {dados.cartas && dados.cartas.length > 0 ? (
            dados.cartas.map((carta, index) => {
              // LÓGICA DE LINK SEGURO:
              // Se 'carta' for objeto (Backend), usa carta.link.
              // Se 'carta' for string (Modo Teste), monta o link na hora.
              const isObject = typeof carta === "object";
              const tipoCarta = isObject ? carta.tipo : carta;
              const codigoAero = dados.icao || icaoFallback;

              const urlFinal = `https://www.aisweb.decea.mil.br/?i=cartas&adv=1&a=${codigoAero.toUpperCase()}`;

              return (
                <a
                  key={index}
                  href={urlFinal}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-download"
                >
                  {tipoCarta}
                </a>
              );
            })
          ) : (
            <small style={{ color: "#666" }}>Nenhuma carta disponível</small>
          )}
        </div>
      </div>
    </section>
  );
};

export default InfoCard;
