export function NotamBoard({ data, loading, origem, destino }) {
  // Se estiver carregando, mostramos um aviso de "Processando"
  if (loading) {
    return (
      <div className="mt-6 p-10 border-2 border-dashed border-slate-700 rounded-2xl text-center text-slate-500 animate-pulse">
        Analisando NOTAMs e alertas de segurança...
      </div>
    );
  }

  // Se não houver dados da IA ainda, usamos um texto padrão amigável
  const alertOrigin =
    data?.notams?.origin || "Aguardando análise de aeródromo...";
  const alertDest =
    data?.notams?.destination || "Aguardando análise de aeródromo...";

  return (
    <section className="mt-6 bg-slate-800 rounded-2xl border border-slate-700 p-5 shadow-lg shadow-black/20">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-yellow-500 text-2xl">⚠️</span>
        Alertas & NOTAMs
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 p-4 rounded-lg border-l-4 border-cyan-500">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">
            {origem || "Origem"}
          </p>
          <p className="text-sm text-slate-200">{alertOrigin}</p>
        </div>

        <div className="bg-slate-900 p-4 rounded-lg border-l-4 border-yellow-500">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">
            {destino || "Destino"}
          </p>
          <p className="text-sm text-slate-200">{alertDest}</p>
        </div>
      </div>
    </section>
  );
}
