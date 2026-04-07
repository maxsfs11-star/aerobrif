export function LocationCard({ type, icao, data, loading }) {
  // Define se é origem ou destino para mudar a cor do detalhe (Ciano ou Amarelo/Laranja)
  const isOrigin = type === "Origem";
  const borderColor = isOrigin ? "border-cyan-500" : "border-blue-500";
  const textColor = isOrigin ? "text-cyan-400" : "text-blue-400";
  const bgColor = isOrigin ? "bg-cyan-500/10" : "bg-blue-500/10";

  return (
    <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col h-full">
      {/* Cabeçalho do Card */}
      <div className="flex items-center gap-2 mb-1">
        <span>{isOrigin ? "🛫" : "🛬"}</span>
        <h3 className="text-white font-bold text-lg">
          {type}: <span className={textColor}>{icao}</span>
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-6 min-h-[16px]">
        {data?.airportName || (loading ? "Buscando aeroporto..." : "")}
      </p>

      {/* Bloco de Clima (Regra, Temp e Vento) */}
      <div className="bg-slate-900/60 p-4 rounded-xl flex justify-between items-center mb-6 border border-slate-700/50">
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {data?.rule === "IFR" ? "🌧️" : data?.rule === "VFR" ? "☀️" : "🌤️"}
          </span>
          <div>
            <p className="text-white font-bold">
              {data?.rule || "Aguardando..."}
            </p>
            <p className="text-xs text-slate-400">{data?.temp || "--ºC"}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-mono">
          Vento: {data?.wind || "-- / --"}
        </p>
      </div>

      {/* Dados da Pista - VERSÃO COMPLETA (Performance + Iluminação) */}
      <div className="mb-6">
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">
          Dados da Pista
        </p>

        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50 space-y-3">
          {/* Identificação e Comprimento Físico */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-200 flex items-center gap-2 font-bold">
              <span>🗺️</span> {data?.runwayDetails?.ident || "Buscando..."}
            </p>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
              {data?.runwayDetails?.length || "-- x --"}
            </span>
          </div>

          {/* LDA e Declividade/Ventos */}
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded">
            <p
              className="flex items-center gap-1"
              title="Landing Distance Available"
            >
              <span className="text-yellow-500">📏</span>
              <strong className="text-slate-300">LDA:</strong>{" "}
              {data?.runwayDetails?.lda
                ? data.runwayDetails.lda.replace("LDA", "").trim()
                : "--"}
            </p>
            <p
              className="flex items-center gap-1 truncate"
              title="Declividade e Ventos"
            >
              <span className="text-cyan-500">📐</span>
              {data?.runwayDetails?.slope || "--"}
            </p>
          </div>

          {/* Sistema de Pouso (ILS) e LUZES */}
          <div className="flex flex-col gap-2 border-t border-slate-700/50 pt-2 text-[11px] text-slate-300">
            <p className="flex items-center gap-2">
              <span>📡</span>
              <span
                className={
                  data?.runwayDetails?.ils?.includes("ILS")
                    ? "text-green-400 font-bold"
                    : "text-slate-400"
                }
              >
                {data?.runwayDetails?.ils || "Auxílios não informados"}
              </span>
            </p>
            {/* A linha das luzes voltou! */}
            <p className="flex items-center gap-2">
              <span>💡</span>
              <span className="text-yellow-400">
                {data?.runwayDetails?.lights || "Sem dados de iluminação..."}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Briefing Específico do Aeroporto */}
      <div
        className={`mt-auto ${bgColor} p-4 rounded-xl border-l-4 ${borderColor}`}
      >
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className={`${textColor} mr-1`}>Briefing:</strong>
          {data?.briefing ||
            (loading
              ? "Analisando meteorologia local..."
              : "Aguardando geração da visão geral...")}
        </p>
      </div>
    </div>
  );
}
