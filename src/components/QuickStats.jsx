export function QuickStats({ data, loading }) {
  if (loading)
    return (
      <div className="max-w-7xl mx-auto mb-6 h-20 bg-slate-800/20 animate-pulse rounded-2xl border border-slate-700/50"></div>
    );

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-0">
      {/* CARD ÚNICO DE APOIO SOLAR */}
      <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700 p-4 rounded-2xl flex flex-col items-center justify-center shadow-lg">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
          Apoio Solar
        </span>
        <div className="flex w-full justify-around items-center">
          <div className="text-center">
            <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">
              Nascer (Origem)
            </p>
            <p className="text-lg text-yellow-500 font-bold">
              🌅 {data.sun?.origin?.sunrise}
            </p>
          </div>
          <div className="h-8 w-[1px] bg-slate-700"></div>
          <div className="text-center">
            <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">
              Ocaso (Destino)
            </p>
            <p className="text-lg text-orange-500 font-bold">
              🌇 {data.sun?.destination?.sunset}
            </p>
          </div>
        </div>
      </div>

      {/* CARD DE TEMPO E SEGURANÇA */}
      <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-2xl flex flex-col items-center justify-center shadow-lg">
        <div className="flex w-full justify-around items-center">
          <div className="text-center">
            <p className="text-[10px] font-black text-cyan-500/70 uppercase mb-1">
              Pouso Estimado
            </p>
            <p className="text-2xl font-black text-white leading-none">
              {data.flightInfo?.eta || "--:--"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-cyan-500/70 uppercase mb-1">
              Distância
            </p>
            <p className="text-xl font-bold text-slate-300">
              {data.flightInfo?.distance || "-- NM"}
            </p>
          </div>
        </div>

        {/* Alerta de Segurança embaixo */}
        <div
          className={`w-full mt-3 py-1 rounded-lg text-center text-[10px] font-black uppercase tracking-wider ${data.safetyAlert?.toLowerCase().includes("depois") ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"}`}
        >
          {data.safetyAlert || "Análise de segurança indisponível"}
        </div>
      </div>
    </div>
  );
}
