// Veja como agora ele recebe a propriedade "data" que contém todas as informações!
export function AerodromeCard({ title, icon, data }) {
  return (
    <section className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col gap-4 shadow-lg shadow-black/20">
      {/* Cabeçalho */}
      <div className="border-b border-slate-700 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          {title}: <span className="text-cyan-400">{data.icao}</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">{data.name}</p>
      </div>

      {/* Adicione isso dentro do retorno do seu AerodromeCard */}
      {data.sun && (
        <div className="flex justify-between mt-4 p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold">
              Sunrise
            </p>
            <p className="text-sm text-yellow-500">🌅 {data.sun.sunrise}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold">
              Sunset
            </p>
            <p className="text-sm text-orange-500">🌇 {data.sun.sunset}</p>
          </div>
        </div>
      )}

      {/* Clima Rápido */}
      <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{data.weather.icon}</span>
          <div>
            <p className="text-white font-bold">{data.weather.condition}</p>
            <p className="text-xs text-slate-400">{data.weather.temp}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-300">Vento: {data.weather.wind}</p>
        </div>
      </div>

      {/* Dados da Pista (ROTAER) */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Dados da Pista
        </h3>
        <p className="text-sm text-slate-200">🛣️ {data.runways}</p>
        <p className="text-sm text-slate-400">💡 {data.lights}</p>
      </div>

      {/* Resumo Gemini */}
      <div
        className={`p-3 rounded-lg border-l-4 text-sm leading-relaxed text-slate-300 bg-slate-700/30 ${title === "Origem" ? "border-cyan-500" : "border-yellow-500"}`}
      >
        <strong>Briefing:</strong> {data.briefing}
      </div>
    </section>
  );
}
