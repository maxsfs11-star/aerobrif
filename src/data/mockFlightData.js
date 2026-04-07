export const mockFlightData = {
  origin: {
    icao: "SBRP",
    name: "Ribeirão Preto, SP",
    weather: {
      condition: "VFR Praticável",
      temp: "28°C",
      wind: "010° / 10KT",
      icon: "☀️",
    },
    runways: "18/36 • 2100x45m • Asfalto",
    lights: "L14, L21, L26 (Noturno Ativo)",
    briefing:
      "Condições excelentes para decolagem. Previsão de manutenção do tempo aberto nas próximas 12h. Nenhuma tesoura de vento.",
  },
  destination: {
    icao: "SBRJ",
    name: "Santos Dumont, RJ",
    weather: {
      condition: "IFR / Marginal",
      temp: "22°C",
      wind: "190° / 15KT",
      icon: "🌧️",
    },
    runways: "02R/20L • 1323x42m",
    lights: "Pista Curta - Atenção",
    briefing:
      "Teto baixando para 1500 pés. Previsão de chuva leve no horário estimado de chegada. Pista úmida.",
  },
};
