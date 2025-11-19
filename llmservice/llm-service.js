const axios = require('axios');
const express = require('express');

const app = express();
const port = 8003;

// Middleware to parse JSON in request body
app.use(express.json());
// Load enviornment variables
require('dotenv').config();

// Define configurations for different LLM APIs
const llmConfigs = {
  gemini: {
    url: (apiKey) => `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    transformRequest: (question) => ({
      contents: [{ parts: [{ text: question }] }]
    }),
    transformResponse: (response) => response.data.candidates[0]?.content?.parts[0]?.text
  }
};

// Function to validate required fields in the request body
function validateRequiredFields(req, requiredFields) {
  for (const field of requiredFields) {
    if (!(field in req.body)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

// Generic function to send questions to LLM
async function sendQuestionToLLM(question, apiKey, model = 'gemini') {
  try {
    const config = llmConfigs[model];
    if (!config) {
      throw new Error(`Model "${model}" is not supported.`);
    }

    const url = config.url(apiKey);
    const requestData = config.transformRequest(question);

    const headers = {
      'Content-Type': 'application/json',
      ...(config.headers ? config.headers(apiKey) : {})
    };

    const response = await axios.post(url, requestData, { headers });

    return config.transformResponse(response);

  } catch (error) {
    console.error(`Error sending question to ${model}:`, error.message || error);
    return null;
  }
}

// Función para construir el prompt de pistas
function buildHintPrompt(correctAnswer, userMessage, history) {
  const basePrompt = `Eres un asistente de pistas en un juego de adivinanzas.

CONTEXTO:
- El jugador está viendo una imagen y debe adivinar qué es
- La respuesta correcta es: "${correctAnswer}"
- Tu objetivo es ayudar con pistas útiles SIN revelar directamente la respuesta

REGLAS:
- NUNCA menciones directamente "${correctAnswer}"
- Da pistas progresivas: empieza vago y sé más específico si insisten
- Responde con 2-4 frases informativas
- Si es un lugar: habla de ubicación, clima, monumentos, cultura
- Si es un objeto: habla de características, uso, origen
- No respondas solo "sí" o "no", siempre añade información
- Si preguntan algo no relacionado: "Solo puedo ayudarte con pistas sobre la imagen"`;

  let conversationHistory = "";
  if (history && history.length > 0) {
    conversationHistory = "\n\nHISTORIAL:\n";
    history.forEach(msg => {
      conversationHistory += `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\n`;
    });
  }

  return `${basePrompt}${conversationHistory}\n\nUsuario: ${userMessage}\n\nRESPONDE AHORA:`;
}

// Ruta original (mantener por compatibilidad)
app.post('/ask', async (req, res) => {
  try {
    validateRequiredFields(req, ['question', 'model']);

    const { question, model } = req.body;
    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is missing.' });
    }
    const answer = await sendQuestionToLLM(question, apiKey, model);
    res.json({ answer });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Nueva ruta para pistas
app.post('/hint', async (req, res) => {
  try {
    const { correctAnswer, message, history } = req.body;

    if (!correctAnswer || !message) {
      return res.status(400).json({
        error: 'Missing required fields: correctAnswer, message'
      });
    }

    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Construir prompt completo
    const fullPrompt = buildHintPrompt(correctAnswer, message, history || []);

    // Enviar a Gemini
    const answer = await sendQuestionToLLM(fullPrompt, apiKey, 'gemini');

    if (!answer) {
      throw new Error('No response from LLM');
    }

    res.json({ response: answer });

  } catch (error) {
    console.error('Error in /hint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const server = app.listen(port, () => {
  console.log(`LLM Service listening at http://localhost:${port}`);
});

module.exports = server;