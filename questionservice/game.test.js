const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const Game = require('./game-model');
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
    await Game.deleteMany({});
    await Question.deleteMany({});
});

describe('Game Model', () => {

    test('should create a game with required fields', async () => {
        const gameData = {
            userId: 'user123',
            username: 'testuser',
            category: 'Capitales',
            questions: [{
                questionId: new mongoose.Types.ObjectId(),
                question: 'Test question?',
                correctAnswer: 'Answer',
                userAnswer: 'Answer',
                isCorrect: true,
                timeSpent: 10,
                timedOut: false
            }],
            totalQuestions: 5,
            correctAnswers: 1,
            incorrectAnswers: 0,
            score: 100
        };

        const game = await Game.create(gameData);

        expect(game.userId).toBe('user123');
        expect(game.username).toBe('testuser');
        expect(game.category).toBe('Capitales');
        expect(game.questions).toHaveLength(1);
        expect(game.totalQuestions).toBe(5);
        expect(game.correctAnswers).toBe(1);
        expect(game.score).toBe(100);
        expect(game.completedAt).toBeDefined();
    });

    test('should have default values for scores', async () => {
        const game = await Game.create({
            userId: 'user123',
            username: 'testuser',
            category: 'Banderas',
            questions: []
        });

        expect(game.totalQuestions).toBe(5);
        expect(game.correctAnswers).toBe(0);
        expect(game.incorrectAnswers).toBe(0);
        expect(game.score).toBe(0);
    });

    test('should fail without required userId', async () => {
        await expect(
            Game.create({
                username: 'testuser',
                category: 'Capitales'
            })
        ).rejects.toThrow();
    });

    test('should fail without required username', async () => {
        await expect(
            Game.create({
                userId: 'user123',
                category: 'Capitales'
            })
        ).rejects.toThrow();
    });

    test('should fail without required category', async () => {
        await expect(
            Game.create({
                userId: 'user123',
                username: 'testuser'
            })
        ).rejects.toThrow();
    });

    test('should store question details correctly', async () => {
        const questionId = new mongoose.Types.ObjectId();
        const game = await Game.create({
            userId: 'user123',
            username: 'testuser',
            category: 'Monumentos',
            questions: [{
                questionId: questionId,
                question: '¿Dónde está la Torre Eiffel?',
                correctAnswer: 'París',
                userAnswer: 'París',
                isCorrect: true,
                timeSpent: 8,
                timedOut: false
            }]
        });

        const savedQuestion = game.questions[0];
        expect(savedQuestion.questionId.toString()).toBe(questionId.toString());
        expect(savedQuestion.question).toBe('¿Dónde está la Torre Eiffel?');
        expect(savedQuestion.correctAnswer).toBe('París');
        expect(savedQuestion.userAnswer).toBe('París');
        expect(savedQuestion.isCorrect).toBe(true);
        expect(savedQuestion.timeSpent).toBe(8);
        expect(savedQuestion.timedOut).toBe(false);
    });
});

describe('Game Service - POST /game/start', () => {

    beforeEach(async () => {
        // Create test questions
        const testQuestions = [];
        for (let i = 0; i < 10; i++) {
            testQuestions.push({
                question: `Test question ${i}?`,
                correctAnswer: `Answer ${i}`,
                incorrectAnswers: [`Wrong ${i}A`, `Wrong ${i}B`, `Wrong ${i}C`],
                category: 'Capitales',
                imageUrl: `http://example.com/image${i}.jpg`,
                wikidataId: `Q${i}`
            });
        }
        await Question.insertMany(testQuestions);
    });

    test('should start a game successfully', async () => {
        const response = await request(app)
            .post('/game/start')
            .send({
                userId: 'user123',
                username: 'testuser',
                category: 'Capitales'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('gameId');
        expect(response.body.questions).toHaveLength(5);

        // Verify question structure
        const question = response.body.questions[0];
        expect(question).toHaveProperty('_id');
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('imageUrl');
        expect(question).toHaveProperty('correctAnswer');
        expect(question).toHaveProperty('options');
        expect(question.options).toHaveLength(4);
    });

    test('should fail without userId', async () => {
        const response = await request(app)
            .post('/game/start')
            .send({
                username: 'testuser',
                category: 'Capitales'
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('userId and username are required');
    });

    test('should fail without username', async () => {
        const response = await request(app)
            .post('/game/start')
            .send({
                userId: 'user123',
                category: 'Capitales'
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('userId and username are required');
    });

    test('should fail when not enough questions available', async () => {
        // Clear all questions
        await Question.deleteMany({});

        // Add only 3 questions
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
                category: 'Capitales',
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

        const response = await request(app)
            .post('/game/start')
            .send({
                userId: 'user123',
                username: 'testuser',
                category: 'Capitales'
            });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Not enough questions available');
    });

    test('should create game with default category "Todas" when not specified', async () => {
        const response = await request(app)
            .post('/game/start')
            .send({
                userId: 'user123',
                username: 'testuser'
            });

        expect(response.status).toBe(200);

        // Verify in database
        const game = await Game.findById(response.body.gameId);
        expect(game.category).toBe('Todas');
    });

    test('should include correctAnswer in questions for hint system', async () => {
        const response = await request(app)
            .post('/game/start')
            .send({
                userId: 'user123',
                username: 'testuser',
                category: 'Capitales'
            });

        expect(response.status).toBe(200);
        response.body.questions.forEach(q => {
            expect(q.correctAnswer).toBeDefined();
        });
    });

    test('should randomize answer options', async () => {
        const response = await request(app)
            .post('/game/start')
            .send({
                userId: 'user123',
                username: 'testuser',
                category: 'Capitales'
            });

        expect(response.status).toBe(200);

        // Check that options are shuffled (correct answer not always in same position)
        const question = response.body.questions[0];
        expect(question.options).toContain(question.correctAnswer);
        expect(question.options).toHaveLength(4);
    });

    test('should save game to database with correct initial values', async () => {
        const response = await request(app)
            .post('/game/start')
            .send({
                userId: 'user123',
                username: 'testuser',
                category: 'Capitales'
            });

        expect(response.status).toBe(200);

        const game = await Game.findById(response.body.gameId);
        expect(game.userId).toBe('user123');
        expect(game.username).toBe('testuser');
        expect(game.category).toBe('Capitales');
        expect(game.totalQuestions).toBe(5);
        expect(game.correctAnswers).toBe(0);
        expect(game.incorrectAnswers).toBe(0);
        expect(game.score).toBe(0);
        expect(game.questions).toHaveLength(5);
    });
});

describe('Game Service - POST /game/:gameId/answer', () => {

    let gameId;
    let questionId;

    beforeEach(async () => {
        // Create a test question
        const question = await Question.create({
            question: 'Test question?',
            correctAnswer: 'Paris',
            incorrectAnswers: ['London', 'Berlin', 'Madrid'],
            category: 'Capitales',
            imageUrl: 'http://example.com/image.jpg',
            wikidataId: 'Q90'
        });

        questionId = question._id;

        // Create a test game
        const game = await Game.create({
            userId: 'user123',
            username: 'testuser',
            category: 'Capitales',
            questions: [{
                questionId: question._id,
                question: question.question,
                correctAnswer: question.correctAnswer,
                userAnswer: null,
                isCorrect: false,
                timeSpent: 0,
                timedOut: false
            }],
            totalQuestions: 5,
            correctAnswers: 0,
            incorrectAnswers: 0,
            score: 0
        });

        gameId = game._id;
    });

    test('should accept correct answer and update score', async () => {
        const response = await request(app)
            .post(`/game/${gameId}/answer`)
            .send({
                questionId: questionId.toString(),
                answer: 'Paris',
                timeSpent: 10
            });

        expect(response.status).toBe(200);
        expect(response.body.isCorrect).toBe(true);
        expect(response.body.correctAnswer).toBe('Paris');
        expect(response.body.currentScore).toBe(100);
        expect(response.body.questionsAnswered).toBe(1);

        // Verify in database
        const game = await Game.findById(gameId);
        expect(game.correctAnswers).toBe(1);
        expect(game.incorrectAnswers).toBe(0);
        expect(game.score).toBe(100);
        expect(game.questions[0].isCorrect).toBe(true);
        expect(game.questions[0].userAnswer).toBe('Paris');
    });

    test('should reject incorrect answer', async () => {
        const response = await request(app)
            .post(`/game/${gameId}/answer`)
            .send({
                questionId: questionId.toString(),
                answer: 'London',
                timeSpent: 8
            });

        expect(response.status).toBe(200);
        expect(response.body.isCorrect).toBe(false);
        expect(response.body.correctAnswer).toBe('Paris');
        expect(response.body.currentScore).toBe(0);

        // Verify in database
        const game = await Game.findById(gameId);
        expect(game.correctAnswers).toBe(0);
        expect(game.incorrectAnswers).toBe(1);
        expect(game.score).toBe(0);
        expect(game.questions[0].isCorrect).toBe(false);
        expect(game.questions[0].userAnswer).toBe('London');
    });

    test('should mark as timed out when time exceeds 20 seconds', async () => {
        const response = await request(app)
            .post(`/game/${gameId}/answer`)
            .send({
                questionId: questionId.toString(),
                answer: 'Paris',
                timeSpent: 21
            });

        expect(response.status).toBe(200);
        expect(response.body.isCorrect).toBe(false);

        // Verify in database
        const game = await Game.findById(gameId);
        expect(game.questions[0].timedOut).toBe(true);
        expect(game.questions[0].isCorrect).toBe(false);
        expect(game.incorrectAnswers).toBe(1);
    });

    test('should handle no answer (timed out)', async () => {
        const response = await request(app)
            .post(`/game/${gameId}/answer`)
            .send({
                questionId: questionId.toString(),
                answer: null,
                timeSpent: 20
            });

        expect(response.status).toBe(200);
        expect(response.body.isCorrect).toBe(false);

        // Verify in database
        const game = await Game.findById(gameId);
        expect(game.questions[0].timedOut).toBe(true);
        expect(game.questions[0].userAnswer).toBe('Sin respuesta');
        expect(game.incorrectAnswers).toBe(1);
    });

    test('should return 404 for non-existent game', async () => {
        const fakeGameId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .post(`/game/${fakeGameId}/answer`)
            .send({
                questionId: questionId.toString(),
                answer: 'Paris',
                timeSpent: 10
            });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Game not found');
    });

    test('should return 404 for non-existent question in game', async () => {
        const fakeQuestionId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .post(`/game/${gameId}/answer`)
            .send({
                questionId: fakeQuestionId.toString(),
                answer: 'Paris',
                timeSpent: 10
            });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Question not found in this game');
    });

    test('should track time spent correctly', async () => {
        const response = await request(app)
            .post(`/game/${gameId}/answer`)
            .send({
                questionId: questionId.toString(),
                answer: 'Paris',
                timeSpent: 15
            });

        expect(response.status).toBe(200);

        const game = await Game.findById(gameId);
        expect(game.questions[0].timeSpent).toBe(15);
    });

    test('should handle empty answer as timed out', async () => {
        const response = await request(app)
            .post(`/game/${gameId}/answer`)
            .send({
                questionId: questionId.toString(),
                answer: '',
                timeSpent: 10
            });

        expect(response.status).toBe(200);
        expect(response.body.isCorrect).toBe(false);

        const game = await Game.findById(gameId);
        expect(game.questions[0].timedOut).toBe(true);
        expect(game.questions[0].userAnswer).toBe('Sin respuesta');
    });
});

describe('Game Service - GET /game/history/:userId', () => {

    test('should return empty array when user has no games', async () => {
        const response = await request(app).get('/game/history/user123');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    test('should return all games for a user', async () => {
        // Create test games
        await Game.create([
            {
                userId: 'user123',
                username: 'testuser',
                category: 'Capitales',
                questions: [],
                score: 100
            },
            {
                userId: 'user123',
                username: 'testuser',
                category: 'Banderas',
                questions: [],
                score: 200
            },
            {
                userId: 'user456',
                username: 'otheruser',
                category: 'Monumentos',
                questions: [],
                score: 150
            }
        ]);

        const response = await request(app).get('/game/history/user123');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[0].userId).toBe('user123');
        expect(response.body[1].userId).toBe('user123');
    });

    test('should return games sorted by most recent first', async () => {
        // Create games with different timestamps
        const game1 = await Game.create({
            userId: 'user123',
            username: 'testuser',
            category: 'Capitales',
            questions: [],
            completedAt: new Date('2024-01-01')
        });

        const game2 = await Game.create({
            userId: 'user123',
            username: 'testuser',
            category: 'Banderas',
            questions: [],
            completedAt: new Date('2024-01-03')
        });

        const game3 = await Game.create({
            userId: 'user123',
            username: 'testuser',
            category: 'Monumentos',
            questions: [],
            completedAt: new Date('2024-01-02')
        });

        const response = await request(app).get('/game/history/user123');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(3);
        // Most recent first
        expect(response.body[0]._id.toString()).toBe(game2._id.toString());
        expect(response.body[1]._id.toString()).toBe(game3._id.toString());
        expect(response.body[2]._id.toString()).toBe(game1._id.toString());
    });

    test('should handle database errors', async () => {
        await mongoose.connection.close();

        const response = await request(app).get('/game/history/user123');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');

        await mongoose.connect(process.env.MONGODB_URI);
    });
});