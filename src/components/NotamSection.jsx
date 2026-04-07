export function NotamSection({ data, loading, origem, destino }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-3xl border border-slate-700 shadow-xl mt-8">
      <h3 className="text-white font-bold mb-6 flex items-center gap-2">
        <span className="text-yellow-500">⚠️</span> Alertas & NOTAMs
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bloco Origem */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border-l-4 border-cyan-500 shadow-inner">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{origem}</span>
            <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">DECOLAGEM</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed min-h-[40px]">
            {loading ? "Sincronizando NOTAMs..." : (data?.origin || "Nenhum alerta operacional crítico para a decolagem.")}
          </p>
        </div>

        {/* Bloco Destino */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border-l-4 border-yellow-500 shadow-inner">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{destino}</span>
            <span className="text-[9px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/20">POUSO</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed min-h-[40px]">
            {loading ? "Sincronizando NOTAMs..." : (data?.destination || "Nenhum alerta operacional crítico para o destino.")}
          </p>
        </div>
      </div>
    </div>
  );
}