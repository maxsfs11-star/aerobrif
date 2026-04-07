import { useState } from "react";
// 1. Importamos o pacote do Google que acabamos de instalar
import { GoogleGenerativeAI } from "@google/generative-ai";

import { Header } from "./components/Header";
import { AerodromeCard } from "./components/AerodromeCard";
import { RouteCard } from "./components/RouteCard";
import { NotamBoard } from "./components/NotamBoard";
import { mockFlightData } from "./data/mockFlightData";
import { QuickStats } from "./components/QuickStats";

function App() {
  const [origem, setOrigem] = useState("SBRP");
  const [destino, setDestino] = useState("SBRJ");
  const [horarioSaida, setHorarioSaida] = useState("14:00"); // Começa com 14:00 por padrão
  const [briefingData, setBriefingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Para sabermos quando a IA está pensando

  // 2. Transformamos nossa função em "async" (assíncrona) porque a resposta da nuvem leva alguns segundos
  const handleGerarVisaoGeral = async () => {
    try {
      setIsLoading(true);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Prompt mais rígido para não vir lixo no texto
      const prompt = `
        Analise a rota de ${origem} para ${destino}. 
        O piloto pretende DECOLAR às ${horarioSaida}.
        
        Retorne um JSON com esta estrutura:
        {
          "originBriefing": "...",
          "destBriefing": "...",
          "enRouteWeather": "...",
          "flightInfo": {
            "time": "1h 20min",
            "distance": "185 NM",
            "eta": "HORA ESTIMADA DE POUSO AQUI"
          },
          "sun": {
            "origin": { "sunrise": "06:00", "sunset": "18:30" },
            "destination": { "sunrise": "06:05", "sunset": "18:20" }
          },
          "safetyAlert": "Diga se o pouso será antes ou depois do Sunset de ${destino}",
          "coords": { "origin": [lat, long], "destination": [lat, long] },
          "notams": { "origin": "...", "destination": "..." }
        }
      `;

      const result = await model.generateContent(prompt);
      let textoResposta = result.response.text();

      console.log("Texto bruto da IA:", textoResposta); // Isso vai nos mostrar o que chegou!

      // Limpeza extra: remove qualquer coisa que não seja o JSON
      const jsonPuro = textoResposta.substring(
        textoResposta.indexOf("{"),
        textoResposta.lastIndexOf("}") + 1,
      );

      const dadosIA = JSON.parse(jsonPuro);

      setBriefingData(dadosIA);
      setIsLoading(false);
    } catch (error) {
      // Agora o console vai nos dizer EXATAMENTE o que quebrou
      console.error("ERRO DETALHADO:", error);
      alert(
        "🚨 Erro ao processar o briefing. Verifique o log no console (F12) agora.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      {/* 4. Passamos a memória e as funções como "Props" para o Header usar */}

      <Header
        origem={origem}
        setOrigem={setOrigem}
        destino={destino}
        setDestino={setDestino}
        horarioSaida={horarioSaida}
        setHorarioSaida={setHorarioSaida}
        onBuscar={handleGerarVisaoGeral}
        loading={isLoading}
      />

      <QuickStats data={briefingData} loading={isLoading} />

      <main className="max-w-7xl mx-auto mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card de Origem */}
          <AerodromeCard
            title="Origem"
            icon="🛫"
            icaoCode={origem}
            // Se tivermos briefing da IA, usamos ele. Senão, usamos o mock.
            data={{
              ...mockFlightData.origin,
              briefing: briefingData?.originBriefing,
              sun: briefingData?.sun, // Passando os horários do sol
            }}
          />

          {/* Card de Rota (passando o tempo de voo e clima da IA) */}
          <RouteCard
            time={briefingData?.flightTime}
            weather={briefingData?.enRouteWeather}
            loading={isLoading}
            coords={briefingData?.coords?.origin} // Começamos focando na origem
            coordsOrigin={briefingData?.coords?.origin}
            coordsDest={briefingData?.coords?.destination}
          />

          {/* Card de Destino */}
          <AerodromeCard
            title="Destino"
            icon="🛬"
            icaoCode={destino}
            data={{
              ...mockFlightData.destination,
              briefing: briefingData
                ? briefingData.destBriefing
                : mockFlightData.destination.briefing,
            }}
          />
        </div>
        {/* O painel de NOTAMs agora recebe os dados reais da IA! */}
        <NotamBoard
          data={briefingData}
          loading={isLoading}
          origem={origem}
          destino={destino}
        />
      </main>
    </div>
  );
}

export default App;
