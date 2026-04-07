import { FlightMap } from "./FlightMap";

export function RouteCard({ time, coordsOrigin, coordsDest, loading, data }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span>✈️</span> Rota & Mapa
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          Tempo estimado:{" "}
          <span className="text-cyan-400 font-bold">{time || "--h --m"}</span>
        </span>
      </div>

      {/* Container do Mapa */}
      <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-slate-700 mb-4 bg-slate-900">
        {!loading && coordsOrigin && coordsDest ? (
          <FlightMap origin={coordsOrigin} destination={coordsDest} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-600 text-xs italic">
            {loading ? "Calculando rota..." : "Aguardando coordenadas..."}
          </div>
        )}
      </div>

      {/* NOVAS INFORMAÇÕES TÉCNICAS (O que o piloto pediu) */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar text-[11px]">
        {/* SIGWX e GAMET */}
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
          <p className="text-cyan-500 font-black uppercase mb-1 tracking-wider">
            Meteo Geral (SIGWX/GAMET)
          </p>
          <p className="text-slate-300 leading-relaxed">
            {data?.enRouteWeather || "Aguardando análise da área..."}
          </p>
        </div>

        {/* SIGMET (Perigos) */}
        <div
          className={`p-3 rounded-xl border ${data?.sigmet?.toLowerCase().includes("aviso") ? "bg-slate-900/50 border-slate-700/50" : "bg-red-500/10 border-red-500/30"}`}
        >
          <p className="text-red-400 font-black uppercase mb-1 tracking-wider">
            Avisos de Perigo (SIGMET)
          </p>
          <p className="text-slate-300 leading-relaxed italic">
            {data?.sigmet || "Verificando perigos severos..."}
          </p>
        </div>

        {/* Ventos em Altitude */}
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
          <p className="text-slate-500 font-black uppercase mb-1 tracking-wider">
            Ventos em Altitude
          </p>
          <p className="text-slate-300 leading-relaxed">
            {data?.windsAltitude || "Calculando deriva e intensidade..."}
          </p>
        </div>
      </div>
    </div>
  );
}
