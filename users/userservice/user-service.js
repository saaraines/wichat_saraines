// user-service.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./user-model')

const app = express();
const port = 8001;

// Middleware to parse JSON in request body
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);



// Function to validate required fields in the request body
function validateRequiredFields(req, requiredFields) {
    for (const field of requiredFields) {
      if (!(field in req.body)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
}

app.post('/adduser', async (req, res) => {
    try {
        // Check if required fields are present in the request body
        validateRequiredFields(req, ['username', 'password']);

        const { username, password } = req.body;

        // NUEVO: Validar longitud del username
        if (username.length < 3) {
            return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' });
        }

        // NUEVO: Validar longitud de la contraseña
        if (password.length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        // NUEVO: Validar que contenga al menos un número
        if (!/\d/.test(password)) {
            return res.status(400).json({ error: 'La contraseña debe contener al menos un número' });
        }

        // NUEVO: Verificar si el usuario ya existe
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.status(409).json({ error: 'El nombre de usuario ya existe' });
        }

        // Encrypt the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username: username,
            password: hashedPassword,
        });

        await newUser.save();
        res.json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Obtener todos los usuarios (para el dashboard admin)
app.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// NUEVO: Obtener un usuario específico por ID
app.get('/users/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId, '-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bloquear/Desbloquear usuario
app.put('/users/:userId/block', async (req, res) => {
    try {
        const { userId } = req.params;
        const { isBlocked } = req.body;

        if (typeof isBlocked !== 'boolean') {
            return res.status(400).json({ error: 'isBlocked must be a boolean' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { isBlocked: isBlocked },
            { new: true, select: '-password' }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user: user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cambiar rol de usuario
app.put('/users/:userId/role', async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({ error: 'Role must be "admin" or "user"' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role: role },
            { new: true, select: '-password' }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'Role updated successfully',
            user: user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const server = app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});

// Listen for the 'close' event on the Express.js server
server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });

module.exports = server