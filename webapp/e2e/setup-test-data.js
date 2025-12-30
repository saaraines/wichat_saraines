const axios = require('axios');
const mongoose = require('mongoose');

const apiEndpoint = 'http://localhost:8000';

async function setupTestData() {
    console.log('Setting up test data...');

    try {
        // Wait a bit to ensure all services are ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 1. Crear usuario 'chetis' con partidas
        console.log('Creating user chetis...');
        try {
            await axios.post(`${apiEndpoint}/adduser`, {
                username: 'chetis1',
                password: 'hola'
            });
            console.log('User chetis created');
        } catch (error) {
            console.log('User chetis already exists');
        }

        // Login para obtener token de chetis
        const loginResponse = await axios.post(`${apiEndpoint}/login`, {
            username: 'chetis1',
            password: 'hola'
        });

        const token = loginResponse.data.token;

        // Crear partidas para chetis
        console.log('Creating game history for chetis...');
        for (let i = 0; i < 3; i++) {
            try {
                const category = i === 0 ? 'Capitales' : (i === 1 ? 'Banderas' : 'Monumentos');

                const gameResponse = await axios.post(
                    `${apiEndpoint}/game/start`,
                    {
                        userId: 'chetis1',
                        username: 'chetis',
                        category: category
                    },
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );

                const gameId = gameResponse.data.gameId;
                const questions = gameResponse.data.questions;

                // Responder algunas preguntas
                for (let j = 0; j < Math.min(3, questions.length); j++) {
                    const question = questions[j];
                    await axios.post(
                        `${apiEndpoint}/game/${gameId}/answer`,
                        {
                            questionId: question._id,
                            answer: question.correctAnswer,
                            timeSpent: 10
                        },
                        {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }
                    );
                }

                // Finalizar partida
                await axios.post(
                    `${apiEndpoint}/game/${gameId}/finish`,
                    {},
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );

                console.log(`Game ${i + 1} created for chetis1`);
            } catch (error) {
                console.log(`Error creating game ${i + 1}:`, error.message);
            }
        }

        // 2. Crear usuario 'admin' y promover a admin
        console.log('Creating admin user...');
        try {
            await axios.post(`${apiEndpoint}/adduser`, {
                username: 'admin',
                password: 'hola'
            });
            console.log('Admin user created');
        } catch (error) {
            console.log('Admin user already exists');
        }

        // Promover a admin usando MongoDB
        const mongoUri = process.env.MONGODB_URI;
        if (mongoUri) {
            try {
                await mongoose.connect(mongoUri);
                const User = mongoose.model('User', new mongoose.Schema({
                    username: String,
                    password: String,
                    role: String,
                    blocked: Boolean
                }));

                await User.updateOne(
                    { username: 'admin' },
                    { $set: { role: 'admin', blocked: false } }
                );
                console.log('User admin promoted to admin role');
                await mongoose.disconnect();
            } catch (error) {
                console.log('Error promoting admin:', error.message);
            }
        }

        // 3. Crear usuario 'blocked' y bloquearlo
        console.log('Creating blocked user...');
        try {
            await axios.post(`${apiEndpoint}/adduser`, {
                username: 'blocked',
                password: 'hola'
            });
            console.log('Blocked user created');
        } catch (error) {
            console.log('Blocked user already exists');
        }

        // Bloquear usuario usando MongoDB
        if (mongoUri) {
            try {
                await mongoose.connect(mongoUri);
                const User = mongoose.model('User', new mongoose.Schema({
                    username: String,
                    password: String,
                    role: String,
                    blocked: Boolean
                }));

                await User.updateOne(
                    { username: 'blocked' },
                    { $set: { blocked: true } }
                );
                console.log('User blocked has been blocked');
                await mongoose.disconnect();
            } catch (error) {
                console.log('Error blocking user:', error.message);
            }
        }

        console.log('Test data setup completed successfully!');
    } catch (error) {
        console.error('Error setting up test data:', error.message);
        // No lanzar error para que los tests continúen
    }
}

// Ejecutar setup si se llama directamente
if (require.main === module) {
    setupTestData()
        .then(() => {
            console.log('Setup completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Setup failed:', error);
            process.exit(1);
        });
}

module.exports = setupTestData;