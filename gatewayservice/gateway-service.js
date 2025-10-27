const express = require('express');
const axios = require('axios');
const cors = require('cors');
const promBundle = require('express-prom-bundle');
//libraries required for OpenAPI-Swagger
const swaggerUi = require('swagger-ui-express');
const fs = require("fs")
const YAML = require('yaml')

const { authenticateToken, requireAdmin } = require('./auth-middleware');

const app = express();
const port = 8000;

const llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8003';
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8002';
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8001';
const questionServiceUrl = process.env.QUESTION_SERVICE_URL || 'http://localhost:8004';

app.use(cors());
app.use(express.json());

//Prometheus configuration
const metricsMiddleware = promBundle({includeMethod: true});
app.use(metricsMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.post('/login', async (req, res) => {
  try {
    // Forward the login request to the authentication service
    const authResponse = await axios.post(authServiceUrl+'/login', req.body);
    res.json(authResponse.data);
  } catch (error) {
    res.status(error.response.status).json({ error: error.response.data.error });
  }
});

app.post('/adduser', async (req, res) => {
  try {
    // Forward the add user request to the user service
    const userResponse = await axios.post(userServiceUrl+'/adduser', req.body);
    res.json(userResponse.data);
  } catch (error) {
    res.status(error.response.status).json({ error: error.response.data.error });
  }
});

app.post('/askllm', async (req, res) => {
  try {
    // Forward the add user request to the user service
    const llmResponse = await axios.post(llmServiceUrl+'/ask', req.body);
    res.json(llmResponse.data);
  } catch (error) {
    res.status(error.response.status).json({ error: error.response.data.error });
  }
});

// ========== RUTAS DE ADMIN ==========

// Obtener todos los usuarios (solo admin)
app.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersResponse = await axios.get(userServiceUrl + '/users');
    res.json(usersResponse.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error'
    });
  }
});

// Bloquear/desbloquear usuario (solo admin)
app.put('/admin/users/:userId/block', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    // Verificar que no se esté bloqueando a sí mismo
    const targetUserResponse = await axios.get(`${userServiceUrl}/users/${userId}`);
    const targetUser = targetUserResponse.data;

    // req.user viene del token JWT y contiene userId
    if (targetUser._id === req.user.userId) {
      return res.status(403).json({ error: 'Cannot block yourself' });
    }

    const response = await axios.put(
        `${userServiceUrl}/users/${userId}/block`,
        { isBlocked }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error'
    });
  }
});

// Cambiar rol de usuario (solo admin)
app.put('/admin/users/:userId/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Verificar que no se esté quitando admin a sí mismo
    const targetUserResponse = await axios.get(`${userServiceUrl}/users/${userId}`);
    const targetUser = targetUserResponse.data;

    // req.user viene del token JWT y contiene userId
    if (targetUser._id === req.user.userId) {
      return res.status(403).json({ error: 'Cannot change your own role' });
    }

    const response = await axios.put(
        `${userServiceUrl}/users/${userId}/role`,
        { role }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error'
    });
  }
});

// ========== RUTAS DE PREGUNTAS (ADMIN) ==========

// Generar preguntas (solo admin)
app.post('/admin/questions/generate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await axios.post(`${questionServiceUrl}/admin/generate`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error'
    });
  }
});

// Obtener todas las preguntas (solo admin)
app.get('/admin/questions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await axios.get(`${questionServiceUrl}/admin/questions`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error'
    });
  }
});

// Eliminar pregunta (solo admin)
app.delete('/admin/questions/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await axios.delete(`${questionServiceUrl}/admin/questions/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error'
    });
  }
});

// Obtener pregunta aleatoria (usuarios autenticados)
app.get('/game/question', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${questionServiceUrl}/questions/random`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error'
    });
  }
});

// ==========================================
// ========== RUTAS DE JUEGO NUEVAS ==========

// Iniciar partida (usuarios autenticados)
app.post('/game/start', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post(`${questionServiceUrl}/game/start`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error'
    });
  }
});

// Responder pregunta (usuarios autenticados)
app.post('/game/:gameId/answer', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post(
        `${questionServiceUrl}/game/${req.params.gameId}/answer`,
        req.body
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error'
    });
  }
});

// Obtener historial de partidas (usuarios autenticados)
app.get('/game/history/:userId', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${questionServiceUrl}/game/history/${req.params.userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error'
    });
  }
});

// Read the OpenAPI YAML file synchronously
const openapiPath='./openapi.yaml'
if (fs.existsSync(openapiPath)) {
  const file = fs.readFileSync(openapiPath, 'utf8');

  // Parse the YAML content into a JavaScript object representing the Swagger document
  const swaggerDocument = YAML.parse(file);

  // Serve the Swagger UI documentation at the '/api-doc' endpoint
  // This middleware serves the Swagger UI files and sets up the Swagger UI page
  // It takes the parsed Swagger document as input
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  console.log("Not configuring OpenAPI. Configuration file not present.")
}


// Start the gateway service
const server = app.listen(port, () => {
  console.log(`Gateway Service listening at http://localhost:${port}`);
});

module.exports = server
