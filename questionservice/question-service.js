const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const Question = require('./question-model');

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
        // TODO: Implementar más adelante
        return [];
    } else if (category === 'Monumentos') {
        // TODO: Implementar más adelante
        return [];
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

// ========== SERVER ==========

const server = app.listen(port, () => {
    console.log(`Question Service listening at http://localhost:${port}`);
});

server.on('close', () => {
    mongoose.connection.close();
});

module.exports = server;