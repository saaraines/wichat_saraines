const jwt = require('jsonwebtoken');
const axios = require('axios');

const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8001';

// Verificar que el token sea válido
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, 'your-secret-key', async (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        // NUEVO: Verificar que el usuario no esté bloqueado
        try {
            const userResponse = await axios.get(`${userServiceUrl}/users/${user.userId}`);
            const userData = userResponse.data;

            if (userData.isBlocked) {
                return res.status(403).json({ error: 'User is blocked' });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(500).json({ error: 'Error verifying user status' });
        }
    });
}

// Verificar que sea admin
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

module.exports = { authenticateToken, requireAdmin };