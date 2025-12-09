const request = require('supertest');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Mock axios and jwt before requiring the app
jest.mock('axios');
jest.mock('jsonwebtoken');

let app;

beforeAll(() => {
  // Require the app after mocking
  app = require('./gateway-service');
});

afterAll((done) => {
  if (app && app.close) {
    app.close(done);
  } else {
    done();
  }
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Helper function to generate valid token
const generateToken = (userId, role = 'user') => {
  return 'mock-jwt-token';
};

describe('Gateway Service - GET /health', () => {

  test('should return OK status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'OK' });
  });
});

describe('Gateway Service - POST /login', () => {

  test('should forward login request to auth service', async () => {
    axios.post.mockResolvedValue({
      data: {
        token: 'jwt-token',
        username: 'testuser',
        role: 'user'
      }
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe('jwt-token');
    expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.objectContaining({
          username: 'testuser',
          password: 'password123'
        })
    );
  });

  test('should handle auth service errors', async () => {
    axios.post.mockRejectedValue({
      response: {
        status: 401,
        data: { error: 'Invalid credentials' }
      }
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });
});

describe('Gateway Service - POST /adduser', () => {

  test('should forward add user request to user service', async () => {
    axios.post.mockResolvedValue({
      data: {
        _id: 'user123',
        username: 'newuser',
        role: 'user'
      }
    });

    const response = await request(app)
        .post('/adduser')
        .send({
          username: 'newuser',
          password: 'password123'
        });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('newuser');
    expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/adduser'),
        expect.objectContaining({
          username: 'newuser',
          password: 'password123'
        })
    );
  });

  test('should handle user service errors', async () => {
    axios.post.mockRejectedValue({
      response: {
        status: 409,
        data: { error: 'Username already exists' }
      }
    });

    const response = await request(app)
        .post('/adduser')
        .send({
          username: 'existinguser',
          password: 'password123'
        });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Username already exists');
  });
});

describe('Gateway Service - POST /askllm', () => {

  test('should forward question to LLM service', async () => {
    axios.post.mockResolvedValue({
      data: {
        answer: 'This is the LLM response'
      }
    });

    const response = await request(app)
        .post('/askllm')
        .send({
          question: 'What is AI?',
          model: 'gemini'
        });

    expect(response.status).toBe(200);
    expect(response.body.answer).toBe('This is the LLM response');
    expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/ask'),
        expect.objectContaining({
          question: 'What is AI?',
          model: 'gemini'
        })
    );
  });

  test('should handle LLM service errors', async () => {
    axios.post.mockRejectedValue({
      response: {
        status: 500,
        data: { error: 'LLM service error' }
      }
    });

    const response = await request(app)
        .post('/askllm')
        .send({
          question: 'Test',
          model: 'gemini'
        });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('LLM service error');
  });
});

describe('Gateway Service - Admin Routes - Authentication', () => {

  test('should reject request without token', async () => {
    const response = await request(app).get('/admin/users');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Access token required');
  });

  test('should reject request with invalid token', async () => {
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    const response = await request(app)
        .get('/admin/users')
        .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Invalid or expired token');
  });

  test('should reject non-admin users', async () => {
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { userId: 'user123', role: 'user' });
    });

    axios.get.mockResolvedValue({
      data: {
        _id: 'user123',
        username: 'testuser',
        role: 'user',
        isBlocked: false
      }
    });

    const response = await request(app)
        .get('/admin/users')
        .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Admin access required');
  });

  test('should reject blocked users', async () => {
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { userId: 'user123', role: 'admin' });
    });

    axios.get.mockResolvedValue({
      data: {
        _id: 'user123',
        username: 'blockedadmin',
        role: 'admin',
        isBlocked: true
      }
    });

    const response = await request(app)
        .get('/admin/users')
        .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('User is blocked');
  });
});

describe('Gateway Service - GET /admin/users', () => {

  test('should get all users as admin', async () => {
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { userId: 'admin123', role: 'admin' });
    });

    axios.get.mockImplementation((url) => {
      if (url.includes('/users/admin123')) {
        return Promise.resolve({
          data: { _id: 'admin123', role: 'admin', isBlocked: false }
        });
      }
      if (url.includes('/users')) {
        return Promise.resolve({
          data: [
            { _id: 'user1', username: 'user1' },
            { _id: 'user2', username: 'user2' }
          ]
        });
      }
    });

    const response = await request(app)
        .get('/admin/users')
        .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });
});

describe('Gateway Service - PUT /admin/users/:userId/block', () => {

  test('should block user as admin', async () => {
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { userId: 'admin123', role: 'admin' });
    });

    axios.get.mockImplementation((url) => {
      if (url.includes('/users/admin123')) {
        return Promise.resolve({
          data: { _id: 'admin123', role: 'admin', isBlocked: false }
        });
      }
      if (url.includes('/users/user456')) {
        return Promise.resolve({
          data: { _id: 'user456', username: 'targetuser', isBlocked: false }
        });
      }
    });

    axios.put.mockResolvedValue({
      data: {
        message: 'User blocked successfully',
        user: { _id: 'user456', isBlocked: true }
      }
    });

    const response = await request(app)
        .put('/admin/users/user456/block')
        .set('Authorization', 'Bearer admin-token')
        .send({ isBlocked: true });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('blocked successfully');
  });

  test('should prevent admin from blocking themselves', async () => {
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { userId: 'admin123', role: 'admin' });
    });

    axios.get.mockImplementation((url) => {
      if (url.includes('/users/admin123')) {
        return Promise.resolve({
          data: { _id: 'admin123', role: 'admin', isBlocked: false }
        });
      }
    });

    const response = await request(app)
        .put('/admin/users/admin123/block')
        .set('Authorization', 'Bearer admin-token')
        .send({ isBlocked: true });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Cannot block yourself');
  });
});

describe('Gateway Service - PUT /admin/users/:userId/role', () => {

  test('should change user role as admin', async () => {
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { userId: 'admin123', role: 'admin' });
    });

    axios.get.mockImplementation((url) => {
      if (url.includes('/users/admin123')) {
        return Promise.resolve({
          data: { _id: 'admin123', role: 'admin', isBlocked: false }
        });
      }
      if (url.includes('/users/user456')) {
        return Promise.resolve({
          data: { _id: 'user456', username: 'targetuser', role: 'user' }
        });
      }
    });

    axios.put.mockResolvedValue({
      data: {
        message: 'Role updated successfully',
        user: { _id: 'user456', role: 'admin' }
      }
    });

    const response = await request(app)
        .put('/admin/users/user456/role')
        .set('Authorization', 'Bearer admin-token')
        .send({ role: 'admin' });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('updated successfully');
  });

  test('should prevent admin from changing their own role', async () => {
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { userId: 'admin123', role: 'admin' });
    });

    axios.get.mockImplementation((url) => {
      if (url.includes('/users/admin123')) {
        return Promise.resolve({
          data: { _id: 'admin123', role: 'admin', isBlocked: false }
        });
      }
    });

    const response = await request(app)
        .put('/admin/users/admin123/role')
        .set('Authorization', 'Bearer admin-token')
        .send({ role: 'user' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Cannot change your own role');
  });
});

describe('Gateway Service - Admin Question Routes', () => {

  beforeEach(() => {
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { userId: 'admin123', role: 'admin' });
    });

    axios.get.mockImplementation((url) => {
      if (url.includes('/users/admin123')) {
        return Promise.resolve({
          data: { _id: 'admin123', role: 'admin', isBlocked: false }
        });
      }
    });
  });

  test('should generate questions as admin', async () => {
    axios.post.mockResolvedValue({
      data: {
        message: '10 questions generated successfully',
        questions: []
      }
    });

    const response = await request(app)
        .post('/admin/questions/generate')
        .set('Authorization', 'Bearer admin-token')
        .send({ category: 'Capitales', count: 10 });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('generated successfully');
  });

  test('should get all questions as admin', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/admin/questions')) {
        return Promise.resolve({
          data: [
            { _id: 'q1', question: 'Question 1' },
            { _id: 'q2', question: 'Question 2' }
          ]
        });
      }
      if (url.includes('/users/admin123')) {
        return Promise.resolve({
          data: { _id: 'admin123', role: 'admin', isBlocked: false }
        });
      }
    });

    const response = await request(app)
        .get('/admin/questions')
        .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  test('should delete question as admin', async () => {
    axios.delete.mockResolvedValue({
      data: { message: 'Question deleted successfully' }
    });

    const response = await request(app)
        .delete('/admin/questions/question123')
        .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('deleted successfully');
  });
});

describe('Gateway Service - Game Routes', () => {

  beforeEach(() => {
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { userId: 'user123', role: 'user' });
    });

    axios.get.mockImplementation((url) => {
      if (url.includes('/users/user123')) {
        return Promise.resolve({
          data: { _id: 'user123', role: 'user', isBlocked: false }
        });
      }
    });
  });

  test('should get random question as authenticated user', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/questions/random')) {
        return Promise.resolve({
          data: {
            _id: 'q1',
            question: 'What is the capital?',
            correctAnswer: 'Paris'
          }
        });
      }
      if (url.includes('/users/user123')) {
        return Promise.resolve({
          data: { _id: 'user123', role: 'user', isBlocked: false }
        });
      }
    });

    const response = await request(app)
        .get('/game/question')
        .set('Authorization', 'Bearer user-token');

    expect(response.status).toBe(200);
    expect(response.body.question).toBe('What is the capital?');
  });

  test('should start game as authenticated user', async () => {
    axios.post.mockResolvedValue({
      data: {
        gameId: 'game123',
        questions: []
      }
    });

    const response = await request(app)
        .post('/game/start')
        .set('Authorization', 'Bearer user-token')
        .send({
          userId: 'user123',
          username: 'testuser',
          category: 'Capitales'
        });

    expect(response.status).toBe(200);
    expect(response.body.gameId).toBe('game123');
  });

  test('should answer question as authenticated user', async () => {
    axios.post.mockResolvedValue({
      data: {
        isCorrect: true,
        correctAnswer: 'Paris',
        currentScore: 100
      }
    });

    const response = await request(app)
        .post('/game/game123/answer')
        .set('Authorization', 'Bearer user-token')
        .send({
          questionId: 'q1',
          answer: 'Paris',
          timeSpent: 10
        });

    expect(response.status).toBe(200);
    expect(response.body.isCorrect).toBe(true);
  });

  test('should get game history as authenticated user', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/game/history')) {
        return Promise.resolve({
          data: [
            { _id: 'game1', score: 100 },
            { _id: 'game2', score: 200 }
          ]
        });
      }
      if (url.includes('/users/user123')) {
        return Promise.resolve({
          data: { _id: 'user123', role: 'user', isBlocked: false }
        });
      }
    });

    const response = await request(app)
        .get('/game/history/user123')
        .set('Authorization', 'Bearer user-token');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });
});

describe('Gateway Service - POST /hint', () => {

  beforeEach(() => {
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { userId: 'user123', role: 'user' });
    });

    axios.get.mockImplementation((url) => {
      if (url.includes('/users/user123')) {
        return Promise.resolve({
          data: { _id: 'user123', role: 'user', isBlocked: false }
        });
      }
    });
  });

  test('should get hint as authenticated user', async () => {
    axios.post.mockResolvedValue({
      data: {
        response: 'This is a hint about the answer'
      }
    });

    const response = await request(app)
        .post('/hint')
        .set('Authorization', 'Bearer user-token')
        .send({
          correctAnswer: 'Paris',
          message: 'Give me a hint',
          history: []
        });

    expect(response.status).toBe(200);
    expect(response.body.response).toBe('This is a hint about the answer');
  });

  test('should handle LLM service errors', async () => {
    axios.post.mockRejectedValue({
      response: {
        status: 500,
        data: { error: 'LLM error' }
      }
    });

    const response = await request(app)
        .post('/hint')
        .set('Authorization', 'Bearer user-token')
        .send({
          correctAnswer: 'Paris',
          message: 'Give me a hint'
        });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('LLM error');
  });
});

describe('Error Handling', () => {

  test('should handle user service error when verifying user status', async () => {
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { userId: 'user123', role: 'user' });
    });

    axios.get.mockRejectedValue(new Error('User service down'));

    const response = await request(app)
        .get('/game/question')
        .set('Authorization', 'Bearer user-token');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Error verifying user status');
  });
});