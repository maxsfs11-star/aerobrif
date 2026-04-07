export function Header({
  origem,
  setOrigem,
  destino,
  setDestino,
  horarioSaida,
  setHorarioSaida,
  onBuscar,
  loading,
}) {
  return (
    <header className="max-w-7xl mx-auto mt-8 mb-8 bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl">
      <div className="flex flex-col md:flex-row items-end gap-6">
        {/* Logo e Título */}
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🦅</span>
            <h1 className="text-2xl font-black text-white tracking-tighter italic">
              AERO<span className="text-cyan-400 font-light">BRIF</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Campo Origem */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">
                Origem (ICAO)
              </label>
              <input
                type="text"
                placeholder="Ex: SBRP"
                value={origem}
                onChange={(e) => setOrigem(e.target.value.toUpperCase())}
                className="bg-slate-900 border border-slate-700 p-3 rounded-lg focus:border-cyan-400 outline-none text-white font-mono"
              />
            </div>

            {/* Campo Destino */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">
                Destino (ICAO)
              </label>
              <input
                type="text"
                placeholder="Ex: SBRJ"
                value={destino}
                onChange={(e) => setDestino(e.target.value.toUpperCase())}
                className="bg-slate-900 border border-slate-700 p-3 rounded-lg focus:border-cyan-400 outline-none text-white font-mono"
              />
            </div>

            {/* Campo Horário de Saída */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">
                Horário de Saída (ETD)
              </label>
              <input
                type="time"
                value={horarioSaida}
                onChange={(e) => setHorarioSaida(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg focus:border-cyan-400 outline-none text-white color-scheme-dark"
              />
            </div>
          </div>
        </div>

        {/* Botão de Ação */}
        <button
          onClick={onBuscar}
          disabled={loading}
          className={`h-[50px] px-8 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg ${
            loading
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-cyan-500/20 active:scale-95"
          }`}
        >
          {loading ? (
            <>
              <span className="animate-spin">🔄</span> PROCESSANDO...
            </>
          ) : (
            <>GERAR VISÃO GERAL ✨</>
          )}
        </button>
      </div>

    </header>
  );
}
