import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithRetry(model, prompt, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      lastError = error;
      const message = error?.message || "";

      const isRetryable =
        message.includes("503") ||
        message.includes("Service Unavailable") ||
        message.includes("high demand") ||
        message.includes("overloaded") ||
        message.includes("UNAVAILABLE");

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(2000 * Math.pow(2, attempt), 8000);
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function gerarBriefing(origem, destino) {
  if (!API_KEY) {
    throw new Error("API key do Gemini não encontrada.");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const prompt = `
Atue como um despachante operacional de voo experiente.
Analise a rota entre ${origem} e ${destino}.

Retorne APENAS um JSON puro, sem markdown, sem explicações extras, com esta estrutura exata:

{
  "originData": {
    "airportName": "Nome do aeroporto de origem",
    "rule": "VFR ou IFR",
    "temp": "Ex: 28ºC",
    "wind": "Ex: 120° / 10KT",
    "runway": "Ex: 18/36 - 2100m asfalto",
    "sunrise": "Ex: 06:12",
    "sunset": "Ex: 18:01",
    "briefing": "Resumo operacional da decolagem"
  },
  "destData": {
    "airportName": "Nome do aeroporto de destino",
    "rule": "VFR ou IFR",
    "temp": "Ex: 22ºC",
    "wind": "Ex: 190° / 15KT",
    "runway": "Ex: 17L/35R - 3000m asfalto",
    "sunrise": "Ex: 06:09",
    "sunset": "Ex: 17:58",
    "briefing": "Resumo operacional do pouso"
  },
  "flightInfo": {
    "time": "Ex: 1h 20m",
    "distance": "Ex: 185 NM",
    "eta": "Ex: 18:40"
  },
  "routeWeather": "Resumo do clima em rota",
  "windsAloft": "Resumo dos ventos em altitude",
  "operationalNotes": "Observação operacional importante da rota",
  "notams": {
    "origin": "Resumo dos NOTAMs relevantes da origem",
    "destination": "Resumo dos NOTAMs relevantes do destino"
  },
  "safetyAlert": "Alerta operacional principal da rota"
}

Regras obrigatórias:
- responda somente com JSON válido
- não use blocos de código
- não escreva texto antes ou depois do JSON
- use português do Brasil
- se não souber algum campo, preencha com "Não informado"
- não invente excesso de precisão; seja plausível e direto
`;

  const result = await generateWithRetry(model, prompt, 3);
  return result.response.text();
}
