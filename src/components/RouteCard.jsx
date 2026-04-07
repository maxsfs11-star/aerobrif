import { FlightMap } from "./FlightMap"; // Importe o mapa aqui

export function RouteCard({ time, weather, loading, coords }) {
  return (
    <section className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col gap-4 shadow-lg shadow-black/20 min-h-[96]">
      <div className="border-b border-slate-700 pb-3">
        <h2 className="text-xl font-bold text-slate-300 flex items-center gap-2">
          <span className="text-2xl">✈️</span> Rota & Mapa
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Tempo estimado:{" "}
          <span className="text-white font-bold">{time || "--h --m"}</span>
        </p>
      </div>

      {/* ÁREA DO MAPA REAL */}
      <div className="flex-1 bg-slate-900 rounded-xl relative min-h-[48]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
            <span className="text-cyan-400 animate-spin text-3xl">🔄</span>
          </div>
        ) : null}
        <FlightMap coords={coords} />
      </div>

      <div className="bg-slate-700/30 p-3 rounded-lg border-l-4 border-indigo-500 text-sm text-slate-300">
        <strong>Clima na Rota:</strong> {weather || "Aguardando cálculo..."}
      </div>
    </section>
  );
}
