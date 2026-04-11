const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Libera o CORS para o seu painel React conseguir ler os dados
app.use(cors()); 

app.get('/api/radar', async (req, res) => {
  try {
    // Coordenadas que formam a "caixa" do espaço aéreo brasileiro
    const url = 'https://opensky-network.org/api/states/all?lamin=-34.0&lamax=5.0&lomin=-74.0&lomax=-34.0';
    
    // O Servidor faz o pedido para a OpenSky (o navegador não interfere aqui)
    const response = await axios.get(url);

    if (!response.data || !response.data.states) {
        return res.json([]); // Céu limpo / sem aviões
    }

    // Filtra e converte as unidades para aviação (Pés e Nós)
    const voosTratados = response.data.states
      .filter(voo => voo[5] && voo[6]) // Apenas com Lat e Lng válidas
      .map(voo => ({
        id: voo[1] ? voo[1].trim() : 'VFR',
        lng: voo[5],
        lat: voo[6],
        altitude: voo[7] ? Math.round(voo[7] * 3.28084) : 0, 
        velocidade: voo[9] ? Math.round(voo[9] * 1.94384) : 0 
      }));

    // Envia os aviões mastigados para o seu painel React
    res.json(voosTratados);
    
  } catch (error) {
    console.error("📡 Erro ao contatar a OpenSky:", error.message);
    res.status(500).json({ error: 'Falha na comunicação com o radar' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Torre de Controle AEROBRIF online na porta ${PORT}! Aguardando aeronaves...`);
});