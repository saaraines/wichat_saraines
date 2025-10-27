const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const Question = require('./question-model');
const Game = require('./game-model');

const app = express();
const port = 8004;

app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/questiondb';
mongoose.connect(mongoUri);

// ========== RUTAS ADMIN ==========

// Generar preguntas desde Wikidata
app.post('/admin/generate', async (req, res) => {
    try {
        const { category, count = 10 } = req.body;

        if (!category) {
            return res.status(400).json({ error: 'Category is required' });
        }

        // Aquí implementaremos la lógica de Wikidata
        // Por ahora devolvemos un placeholder
        const questions = await generateQuestionsFromWikidata(category, count);

        // Guardar en BD
        const savedQuestions = await Question.insertMany(questions);

        res.json({
            message: `${savedQuestions.length} questions generated successfully`,
            questions: savedQuestions
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todas las preguntas (para admin)
app.get('/admin/questions', async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};

        const questions = await Question.find(filter).sort({ createdAt: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar pregunta
app.delete('/admin/questions/:id', async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== RUTAS JUGADORES ==========

// Obtener pregunta aleatoria
app.get('/questions/random', async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};

        // Obtener pregunta aleatoria
        const count = await Question.countDocuments(filter);

        if (count === 0) {
            return res.status(404).json({ error: 'No questions available' });
        }

        const random = Math.floor(Math.random() * count);
        const question = await Question.findOne(filter).skip(random);

        res.json(question);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== FUNCIÓN DE GENERACIÓN WIKIDATA ==========

async function generateQuestionsFromWikidata(category, count) {
    if (category === 'Capitales') {
        return await generateCapitalsQuestions(count);
    } else if (category === 'Banderas') {
        return await generateFlagsQuestions(count);
    } else if (category === 'Monumentos') {
        return await generateMonumentsQuestions(count);
    } else {
        throw new Error('Categoría no soportada');
    }
}

async function generateCapitalsQuestions(count) {
    const sparqlQuery = `
        SELECT DISTINCT ?country ?countryLabel ?capital ?capitalLabel ?image WHERE {
          ?country wdt:P31 wd:Q3624078;  # Instancia de país soberano
                   wdt:P36 ?capital;      # Tiene capital
                   wdt:P18 ?image.        # Tiene imagen
          ?capital wdt:P18 ?capitalImage. # La capital también tiene imagen
          
          SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
        }
        LIMIT ${count * 3}
    `;

    try {
        const response = await axios.get('https://query.wikidata.org/sparql', {
            params: {
                query: sparqlQuery,
                format: 'json'
            },
            headers: {
                'User-Agent': 'WIChat/1.0'
            }
        });

        const results = response.data.results.bindings;

        if (results.length === 0) {
            throw new Error('No se encontraron resultados en Wikidata');
        }

        // Generar preguntas
        const questions = [];
        const usedCountries = new Set();

        for (let i = 0; i < Math.min(count, results.length); i++) {
            const result = results[i];
            const countryName = result.countryLabel.value;
            const capitalName = result.capitalLabel.value;
            const imageUrl = result.image.value;

            // Evitar duplicados
            if (usedCountries.has(countryName)) {
                continue;
            }
            usedCountries.add(countryName);

            // Generar distractores (otras capitales)
            const incorrectAnswers = results
                .filter(r => r.capitalLabel.value !== capitalName)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(r => r.capitalLabel.value);

            // Solo añadir si tenemos suficientes distractores
            if (incorrectAnswers.length === 3) {
                questions.push({
                    question: `¿Cuál es la capital de ${countryName}?`,
                    correctAnswer: capitalName,
                    incorrectAnswers: incorrectAnswers,
                    category: 'Capitales',
                    imageUrl: imageUrl,
                    wikidataId: result.country.value.split('/').pop()
                });
            }
        }

        return questions;

    } catch (error) {
        console.error('Error consultando Wikidata:', error.message);
        throw new Error('Error al generar preguntas desde Wikidata');
    }
}

async function generateFlagsQuestions(count) {
    const sparqlQuery = `
        SELECT DISTINCT ?country ?countryLabel ?flag ?capital ?capitalLabel WHERE {
          ?country wdt:P31 wd:Q3624078;     # Instancia de país soberano
                   wdt:P41 ?flag;           # Tiene imagen de bandera
                   wdt:P36 ?capital.        # Tiene capital
          
          SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
        }
        LIMIT ${count * 3}
    `;

    try {
        const response = await axios.get('https://query.wikidata.org/sparql', {
            params: {
                query: sparqlQuery,
                format: 'json'
            },
            headers: {
                'User-Agent': 'WIChat/1.0'
            }
        });

        const results = response.data.results.bindings;

        if (results.length === 0) {
            throw new Error('No se encontraron resultados en Wikidata');
        }

        const questions = [];
        const usedCountries = new Set();

        for (let i = 0; i < Math.min(count, results.length); i++) {
            const result = results[i];
            const countryName = result.countryLabel.value;
            const flagUrl = result.flag.value;

            if (usedCountries.has(countryName)) {
                continue;
            }
            usedCountries.add(countryName);

            // Generar distractores (otros países)
            const incorrectAnswers = results
                .filter(r => r.countryLabel.value !== countryName)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(r => r.countryLabel.value);

            if (incorrectAnswers.length === 3) {
                questions.push({
                    question: `¿De qué país es esta bandera?`,
                    correctAnswer: countryName,
                    incorrectAnswers: incorrectAnswers,
                    category: 'Banderas',
                    imageUrl: flagUrl,
                    wikidataId: result.country.value.split('/').pop()
                });
            }
        }

        return questions;

    } catch (error) {
        console.error('Error consultando Wikidata:', error.message);
        throw new Error('Error al generar preguntas desde Wikidata');
    }
}

async function generateMonumentsQuestions(count) {
    const sparqlQuery = `
        SELECT DISTINCT ?monument ?monumentLabel ?image ?country ?countryLabel ?city ?cityLabel WHERE {
          ?monument wdt:P31/wdt:P279* wd:Q4989906;  # Instancia de monumento
                    wdt:P18 ?image;                  # Tiene imagen
                    wdt:P17 ?country.                # Está en un país
          
          OPTIONAL { ?monument wdt:P131 ?city. }     # Opcionalmente tiene ciudad
          
          SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
          
          FILTER(BOUND(?image))
        }
        LIMIT ${count * 5}
    `;

    try {
        const response = await axios.get('https://query.wikidata.org/sparql', {
            params: {
                query: sparqlQuery,
                format: 'json'
            },
            headers: {
                'User-Agent': 'WIChat/1.0'
            }
        });

        const results = response.data.results.bindings;

        if (results.length === 0) {
            throw new Error('No se encontraron resultados en Wikidata');
        }

        const questions = [];
        const usedMonuments = new Set();

        for (let i = 0; i < Math.min(count, results.length); i++) {
            const result = results[i];
            const monumentName = result.monumentLabel.value;
            const imageUrl = result.image.value;

            // Preferir ciudad si existe, sino país
            const correctAnswer = result.cityLabel
                ? result.cityLabel.value
                : result.countryLabel.value;

            if (usedMonuments.has(monumentName) || !correctAnswer) {
                continue;
            }
            usedMonuments.add(monumentName);

            // Generar distractores (otras ciudades/países)
            const allLocations = results
                .map(r => r.cityLabel ? r.cityLabel.value : r.countryLabel.value)
                .filter(loc => loc && loc !== correctAnswer);

            const incorrectAnswers = [...new Set(allLocations)]
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);

            if (incorrectAnswers.length === 3) {
                questions.push({
                    question: `¿Dónde se encuentra ${monumentName}?`,
                    correctAnswer: correctAnswer,
                    incorrectAnswers: incorrectAnswers,
                    category: 'Monumentos',
                    imageUrl: imageUrl,
                    wikidataId: result.monument.value.split('/').pop()
                });
            }
        }

        return questions;

    } catch (error) {
        console.error('Error consultando Wikidata:', error.message);
        throw new Error('Error al generar preguntas desde Wikidata');
    }
}

// ========== RUTAS DE JUEGO ==========

// Iniciar una nueva partida
app.post('/game/start', async (req, res) => {
    try {
        const { userId, username, category } = req.body;

        if (!userId || !username) {
            return res.status(400).json({ error: 'userId and username are required' });
        }

        // Obtener 5 preguntas aleatorias
        const filter = category ? { category } : {};
        const totalQuestions = await Question.countDocuments(filter);

        if (totalQuestions < 5) {
            return res.status(404).json({ error: 'Not enough questions available' });
        }

        // Obtener 5 preguntas aleatorias
        const questions = [];
        const usedIndices = new Set();

        while (questions.length < 5) {
            const randomIndex = Math.floor(Math.random() * totalQuestions);
            if (!usedIndices.has(randomIndex)) {
                usedIndices.add(randomIndex);
                const question = await Question.findOne(filter).skip(randomIndex);
                if (question) {
                    questions.push(question);
                }
            }
        }

        // Crear partida
        const game = new Game({
            userId,
            username,
            category: category || 'Todas',
            questions: questions.map(q => ({
                questionId: q._id,
                question: q.question,
                correctAnswer: q.correctAnswer,
                userAnswer: null,
                isCorrect: false,
                timeSpent: 0,
                timedOut: false
            })),
            totalQuestions: 5,
            correctAnswers: 0,
            incorrectAnswers: 0,
            score: 0
        });

        await game.save();

        // Devolver las preguntas sin la respuesta correcta
        const questionsForClient = questions.map(q => ({
            _id: q._id,
            question: q.question,
            imageUrl: q.imageUrl,
            options: [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5)
        }));

        res.json({
            gameId: game._id,
            questions: questionsForClient
        });

    } catch (error) {
        console.error('Error starting game:', error);
        res.status(500).json({ error: error.message });
    }
});

// Responder a una pregunta
app.post('/game/:gameId/answer', async (req, res) => {
    try {
        const { gameId } = req.params;
        const { questionId, answer, timeSpent } = req.body;

        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        const questionIndex = game.questions.findIndex(
            q => q.questionId.toString() === questionId
        );

        if (questionIndex === -1) {
            return res.status(404).json({ error: 'Question not found in this game' });
        }

        const gameQuestion = game.questions[questionIndex];

        // Marcar si se agotó el tiempo
        const timedOut = !answer || timeSpent >= 20;

        // Verificar respuesta
        const isCorrect = !timedOut && answer === gameQuestion.correctAnswer;

        // Actualizar pregunta
        game.questions[questionIndex].userAnswer = answer || 'Sin respuesta';
        game.questions[questionIndex].isCorrect = isCorrect;
        game.questions[questionIndex].timeSpent = timeSpent;
        game.questions[questionIndex].timedOut = timedOut;

        // Actualizar estadísticas
        if (isCorrect) {
            game.correctAnswers += 1;
            game.score += 100; // Puedes ajustar el puntaje
        } else {
            game.incorrectAnswers += 1;
        }

        await game.save();

        res.json({
            isCorrect,
            correctAnswer: gameQuestion.correctAnswer,
            currentScore: game.score,
            questionsAnswered: game.correctAnswers + game.incorrectAnswers
        });

    } catch (error) {
        console.error('Error answering question:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener historial de partidas de un usuario
app.get('/game/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const games = await Game.find({ userId }).sort({ completedAt: -1 }).limit(10);
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== SERVER ==========

const server = app.listen(port, () => {
    console.log(`Question Service listening at http://localhost:${port}`);
});

server.on('close', () => {
    mongoose.connection.close();
});

module.exports = server;