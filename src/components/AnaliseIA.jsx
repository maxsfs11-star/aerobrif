import React from "react";

const AnaliseIA = ({ texto, loading }) => {
  if (!texto && !loading) return null;

  return (
    <section className="card ia-analise">
      <div className="ia-header">
        <span className="ia-icon">🤖</span>
        <h3>ANÁLISE DO ESPECIALISTA (GEMINI)</h3>
      </div>
      <div className="ia-content">
        {loading ? (
          <div className="typing-loader">Analisando condições de voo...</div>
        ) : (
          <p>{texto}</p>
        )}
      </div>
    </section>
  );
};

export default AnaliseIA;
