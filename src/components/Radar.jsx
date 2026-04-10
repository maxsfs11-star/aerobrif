import React from "react";

// components/Radar.jsx
const Radar = ({ avioes }) => {
  return (
    <section className="card radar-card">
      <div className="radar-display">
        <div className="radar-sweep"></div>
        {/* Aqui desenharíamos os pontos verdes dos aviões */}
        <div className="radar-grid"></div>
      </div>
      <div className="radar-list-overlay">
        {avioes.map((a) => (
          <div key={a.id} className="mini-aviao">
            <span className="pulse">●</span> {a.id} - {a.altitude}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Radar; // ESSA LINHA É A MAIS IMPORTANTE
