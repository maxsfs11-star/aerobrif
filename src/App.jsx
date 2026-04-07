import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Header } from "./components/Header";
import { QuickStats } from "./components/QuickStats";
import { RouteCard } from "./components/RouteCard";
import { NotamSection } from "./components/NotamSection";
import { LocationCard } from "./components/LocationCard"; // <-- Novo componente aqui!

function App() {
  const [origem, setOrigem] = useState("SBRP");
  const [destino, setDestino] = useState("SBRJ");
  const [horarioSaida, setHorarioSaida] = useState("14:00");
  const [briefingData, setBriefingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGerarVisaoGeral = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Super Prompt atualizado com estrutura rígida
      const prompt = `Atue como um despachante operacional de voo. Analise a rota exata de ${origem} para ${destino} saindo às ${horarioSaida}.
      NÃO invente outros aeroportos. Use estritamente os códigos ICAO fornecidos.
      Retorne APENAS um JSON puro (sem markdown) com esta estrutura exata:
      {
        "originData": {
          "airportName": "Nome Real do Aeroporto de ${origem}",
          "rule": "VFR ou IFR",
          "temp": "Ex: 28ºC",
          "wind": "Ex: 120º / 10KT",
          "runwayDetails": {
             "ident": "Ex: 18/36 - Asfalto",
             "length": "Ex: 2100x45m",
             "lda": "Ex: LDA 2000m",
             "slope": "Ex: Declividade 0.5% / Ventos alinhados",
             "ils": "Ex: ILS CAT I (ou 'Apenas VFR/RNAV')"
             "lights": "Ex: L14, L21, L26 (Noturno Ativo)"
          },
          "briefing": "Briefing meteorológico detalhado de decolagem em ${origem}."
        },
        "destData": {
          "airportName": "Nome Real do Aeroporto de ${destino}",
          "rule": "VFR ou IFR",
          "temp": "Ex: 22ºC",
          "wind": "Ex: 190º / 15KT",
          "runwayDetails": {
             "ident": "Ex: 02R/20L - Asfalto",
             "length": "Ex: 1323x42m",
             "lda": "Ex: LDA 1323m",
             "slope": "Ex: Declividade plana",
             "ils": "Ex: ILS CAT I e II"
             "lights": "Ex: L14, L21, L26 (Noturno Ativo)"
          },
          "briefing": "Briefing meteorológico de pouso em ${destino}."
        },
        "enRouteWeather": "Resumo de SIGWX e GAMET na rota.",
        "sigmet": "Avisos de perigo severo ou 'Nenhum aviso ativo'.",
        "windsAltitude": "Direção e velocidade dos ventos em altitude.",
        "flightInfo": { "time": "Ex: 1h 20m", "distance": "Ex: 185 NM", "eta": "Horário de pouso estimado" },
        "sun": {
          "origin": { "sunrise": "hh:mm", "sunset": "hh:mm" },
          "destination": { "sunrise": "hh:mm", "sunset": "hh:mm" }
        },
        "safetyAlert": "Alerta sobre pouso antes/depois do pôr do sol.",
        "coords": { "origin": [lat, lng], "destination": [lat, lng] },
        "notams": { "origin": "Principais NOTAMs de ${origem}", "destination": "Principais NOTAMs de ${destino}" }
      }`;

      const result = await model.generateContent(prompt);
      const texto = result.response
        .text()
        .replace(/```json|```/g, "")
        .trim();
      setBriefingData(JSON.parse(texto));
    } catch (error) {
      console.error("Erro na decolagem:", error);
      if (error.message.includes("429")) {
        alert("⚠️ Torre (Google) ocupada. Tente novamente em 1 minuto.");
      } else {
        alert("🚨 Ocorreu um erro ao processar os dados da rota.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 font-sans text-slate-200">
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

      <main className="max-w-7xl mx-auto">
        {/* Grade Principal com 3 Colunas: Origem -> Rota -> Destino */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Coluna 1: Origem */}
          <LocationCard
            type="Origem"
            icao={origem}
            data={briefingData?.originData}
            loading={isLoading}
          />

          {/* Coluna 2: Rota Central */}
          <RouteCard
            time={briefingData?.flightInfo?.time}
            coordsOrigin={briefingData?.coords?.origin}
            coordsDest={briefingData?.coords?.destination}
            loading={isLoading}
            data={briefingData}
          />

          {/* Coluna 3: Destino */}
          <LocationCard
            type="Destino"
            icao={destino}
            data={briefingData?.destData}
            loading={isLoading}
          />
        </div>

        {/* Seção Inferior de NOTAMs */}
        <NotamSection
          data={briefingData?.notams}
          loading={isLoading}
          origem={origem}
          destino={destino}
        />
      </main>
    </div>
  );
}

export default App;
