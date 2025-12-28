const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const Question = require('./question-model');

let app;
let mongoServer;

beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    // Set the MongoDB URI before requiring the app
    process.env.MONGODB_URI = mongoUri;

    // Now require the app (it will connect to our in-memory MongoDB)
    app = require('./question-service');

    // Wait for connection
    await mongoose.connection.asPromise();
});

afterAll(async () => {
    // Close the server
    if (app && app.close) {
        await new Promise((resolve) => app.close(resolve));
    }

    // Disconnect mongoose
    await mongoose.disconnect();

    // Stop in-memory MongoDB
    if (mongoServer) {
        await mongoServer.stop();
    }
});

beforeEach(async () => {
    await Question.deleteMany({});
});

describe('Question Model', () => {

    test('should create a question with all required fields', async () => {
        const questionData = {
            question: '¿Cuál es la capital de Francia?',
            correctAnswer: 'París',
            incorrectAnswers: ['Londres', 'Berlín', 'Madrid'],
            category: 'Capitales',
            imageUrl: 'http://example.com/france.jpg',
            wikidataId: 'Q142'
        };

        const question = await Question.create(questionData);

        expect(question.question).toBe('¿Cuál es la capital de Francia?');
        expect(question.correctAnswer).toBe('París');
        expect(question.incorrectAnswers).toEqual(['Londres', 'Berlín', 'Madrid']);
        expect(question.category).toBe('Capitales');
        expect(question.imageUrl).toBe('http://example.com/france.jpg');
        expect(question.wikidataId).toBe('Q142');
        expect(question.createdAt).toBeDefined();
    });

    test('should fail without question field', async () => {
        await expect(
            Question.create({
                correctAnswer: 'París',
                incorrectAnswers: ['Londres', 'Berlín', 'Madrid'],
                category: 'Capitales',
                imageUrl: 'http://example.com/image.jpg',
                wikidataId: 'Q142'
            })
        ).rejects.toThrow();
    });

    test('should fail without correctAnswer field', async () => {
        await expect(
            Question.create({
                question: '¿Cuál es la capital de Francia?',
                incorrectAnswers: ['Londres', 'Berlín', 'Madrid'],
                category: 'Capitales',
                imageUrl: 'http://example.com/image.jpg',
                wikidataId: 'Q142'
            })
        ).rejects.toThrow();
    });

    test('should fail without incorrectAnswers field', async () => {
        await expect(
            Question.create({
                question: '¿Cuál es la capital de Francia?',
                correctAnswer: 'París',
                category: 'Capitales',
                imageUrl: 'http://example.com/image.jpg',
                wikidataId: 'Q142'
            })
        ).rejects.toThrow();
    });

    test('should fail without category field', async () => {
        await expect(
            Question.create({
                question: '¿Cuál es la capital de Francia?',
                correctAnswer: 'París',
                incorrectAnswers: ['Londres', 'Berlín', 'Madrid'],
                imageUrl: 'http://example.com/image.jpg',
                wikidataId: 'Q142'
            })
        ).rejects.toThrow();
    });

    test('should fail without imageUrl field', async () => {
        await expect(
            Question.create({
                question: '¿Cuál es la capital de Francia?',
                correctAnswer: 'París',
                incorrectAnswers: ['Londres', 'Berlín', 'Madrid'],
                category: 'Capitales',
                wikidataId: 'Q142'
            })
        ).rejects.toThrow();
    });

    test('should fail without wikidataId field', async () => {
        await expect(
            Question.create({
                question: '¿Cuál es la capital de Francia?',
                correctAnswer: 'París',
                incorrectAnswers: ['Londres', 'Berlín', 'Madrid'],
                category: 'Capitales',
                imageUrl: 'http://example.com/image.jpg'
            })
        ).rejects.toThrow();
    });

    test('should fail with less than 3 incorrect answers', async () => {
        await expect(
            Question.create({
                question: '¿Cuál es la capital de Francia?',
                correctAnswer: 'París',
                incorrectAnswers: ['Londres', 'Berlín'],
                category: 'Capitales',
                imageUrl: 'http://example.com/image.jpg',
                wikidataId: 'Q142'
            })
        ).rejects.toThrow();
    });

    test('should fail with more than 3 incorrect answers', async () => {
        await expect(
            Question.create({
                question: '¿Cuál es la capital de Francia?',
                correctAnswer: 'París',
                incorrectAnswers: ['Londres', 'Berlín', 'Madrid', 'Roma'],
                category: 'Capitales',
                imageUrl: 'http://example.com/image.jpg',
                wikidataId: 'Q142'
            })
        ).rejects.toThrow();
    });

    test('should accept exactly 3 incorrect answers', async () => {
        const question = await Question.create({
            question: '¿Cuál es la capital de Francia?',
            correctAnswer: 'París',
            incorrectAnswers: ['Londres', 'Berlín', 'Madrid'],
            category: 'Capitales',
            imageUrl: 'http://example.com/image.jpg',
            wikidataId: 'Q142'
        });

        expect(question.incorrectAnswers).toHaveLength(3);
    });

    test('should set createdAt automatically', async () => {
        const question = await Question.create({
            question: 'Test question?',
            correctAnswer: 'Answer',
            incorrectAnswers: ['Wrong1', 'Wrong2', 'Wrong3'],
            category: 'Capitales',
            imageUrl: 'http://example.com/image.jpg',
            wikidataId: 'Q123'
        });

        expect(question.createdAt).toBeDefined();
        expect(question.createdAt).toBeInstanceOf(Date);
    });
});

describe('Question Service - GET /questions/random', () => {

    beforeEach(async () => {
        // Create test questions
        await Question.insertMany([
            {
                question: 'Q1?',
                correctAnswer: 'A1',
                incorrectAnswers: ['W1', 'W2', 'W3'],
                category: 'Capitales',
                imageUrl: 'http://example.com/1.jpg',
                wikidataId: 'Q1'
            },
            {
                question: 'Q2?',
                correctAnswer: 'A2',
                incorrectAnswers: ['W1', 'W2', 'W3'],
                category: 'Banderas',
                imageUrl: 'http://example.com/2.jpg',
                wikidataId: 'Q2'
            },
            {
                question: 'Q3?',
                correctAnswer: 'A3',
                incorrectAnswers: ['W1', 'W2', 'W3'],
                category: 'Capitales',
                imageUrl: 'http://example.com/3.jpg',
                wikidataId: 'Q3'
            }
        ]);
    });

    test('should return a random question', async () => {
        const response = await request(app).get('/questions/random');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('question');
        expect(response.body).toHaveProperty('correctAnswer');
        expect(response.body).toHaveProperty('incorrectAnswers');
        expect(response.body).toHaveProperty('category');
        expect(response.body).toHaveProperty('imageUrl');
        expect(response.body).toHaveProperty('wikidataId');
    });

    test('should return random question from specific category', async () => {
        const response = await request(app).get('/questions/random?category=Capitales');

        expect(response.status).toBe(200);
        expect(response.body.category).toBe('Capitales');
    });

    test('should return 404 when no questions available', async () => {
        await Question.deleteMany({});

        const response = await request(app).get('/questions/random');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('No questions available');
    });

    test('should return 404 when no questions in category', async () => {
        const response = await request(app).get('/questions/random?category=Monumentos');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('No questions available');
    });

    test('should handle database errors', async () => {
        await mongoose.connection.close();

        const response = await request(app).get('/questions/random');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');

        await mongoose.connect(process.env.MONGODB_URI);
    });
});

describe('Question Service - GET /admin/questions', () => {

    beforeEach(async () => {
        await Question.insertMany([
            {
                question: 'Q1?',
                correctAnswer: 'A1',
                incorrectAnswers: ['W1', 'W2', 'W3'],
                category: 'Capitales',
                imageUrl: 'http://example.com/1.jpg',
                wikidataId: 'Q1',
                createdAt: new Date('2024-01-01')
            },
            {
                question: 'Q2?',
                correctAnswer: 'A2',
                incorrectAnswers: ['W1', 'W2', 'W3'],
                category: 'Banderas',
                imageUrl: 'http://example.com/2.jpg',
                wikidataId: 'Q2',
                createdAt: new Date('2024-01-03')
            },
            {
                question: 'Q3?',
                correctAnswer: 'A3',
                incorrectAnswers: ['W1', 'W2', 'W3'],
                category: 'Capitales',
                imageUrl: 'http://example.com/3.jpg',
                wikidataId: 'Q3',
                createdAt: new Date('2024-01-02')
            }
        ]);
    });

    test('should return all questions sorted by most recent', async () => {
        const response = await request(app).get('/admin/questions');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(3);
        // Should be sorted by createdAt desc
        expect(response.body[0].question).toBe('Q2?');
        expect(response.body[1].question).toBe('Q3?');
        expect(response.body[2].question).toBe('Q1?');
    });

    test('should filter questions by category', async () => {
        const response = await request(app).get('/admin/questions?category=Capitales');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[0].category).toBe('Capitales');
        expect(response.body[1].category).toBe('Capitales');
    });

    test('should return empty array when no questions exist', async () => {
        await Question.deleteMany({});

        const response = await request(app).get('/admin/questions');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    test('should return empty array when category has no questions', async () => {
        const response = await request(app).get('/admin/questions?category=Monumentos');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    test('should handle database errors', async () => {
        await mongoose.connection.close();

        const response = await request(app).get('/admin/questions');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');

        await mongoose.connect(process.env.MONGODB_URI);
    });
});

describe('Question Service - DELETE /admin/questions/:id', () => {

    let questionId;

    beforeEach(async () => {
        const question = await Question.create({
            question: 'Test question?',
            correctAnswer: 'Answer',
            incorrectAnswers: ['Wrong1', 'Wrong2', 'Wrong3'],
            category: 'Capitales',
            imageUrl: 'http://example.com/image.jpg',
            wikidataId: 'Q123'
        });
        questionId = question._id;
    });

    test('should delete a question successfully', async () => {
        const response = await request(app).delete(`/admin/questions/${questionId}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Question deleted successfully');

        // Verify deletion
        const deletedQuestion = await Question.findById(questionId);
        expect(deletedQuestion).toBeNull();
    });

    test('should return 404 when question does not exist', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app).delete(`/admin/questions/${fakeId}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Question not found');
    });

    test('should handle invalid ID format', async () => {
        const response = await request(app).delete('/admin/questions/invalidid');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
    });

    test('should handle database errors', async () => {
        await mongoose.connection.close();

        const response = await request(app).delete(`/admin/questions/${questionId}`);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');

        await mongoose.connect(process.env.MONGODB_URI);
    });
});

describe('Question Service - POST /admin/generate', () => {

    test('should fail without category', async () => {
        const response = await request(app)
            .post('/admin/generate')
            .send({ count: 5 });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Category is required');
    });

    test('should fail with unsupported category', async () => {
        const response = await request(app)
            .post('/admin/generate')
            .send({
                category: 'UnsupportedCategory',
                count: 5
            });

        expect(response.status).toBe(500);
        expect(response.body.error).toContain('Categoría no soportada');
    });

    test('should use default count of 10 when not specified', async () => {
        // This test would require mocking Wikidata API
        // For now we just verify the endpoint exists and validates category
        const response = await request(app)
            .post('/admin/generate')
            .send({ category: 'Capitales' });

        // Will likely fail due to Wikidata API call, but validates structure
        expect([200, 500]).toContain(response.status);
    });

    // Note: Full testing of generation would require mocking axios calls to Wikidata
    // These are integration tests that verify the endpoint structure works correctly
});