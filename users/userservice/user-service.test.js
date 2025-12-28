const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./user-model');

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
  app = require('./user-service');

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
  // Clear all users before each test
  await User.deleteMany({});
});

describe('User Service - POST /adduser', () => {

  test('should create a new user successfully', async () => {
    const response = await request(app)
        .post('/adduser')
        .send({
          username: 'testuser',
          password: 'password123'
        });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('_id');
    expect(response.body.username).toBe('testuser');
    expect(response.body).toHaveProperty('password');
    expect(response.body.role).toBe('user');
    expect(response.body.isBlocked).toBe(false);

    // Verify password is hashed
    const isPasswordHashed = await bcrypt.compare('password123', response.body.password);
    expect(isPasswordHashed).toBe(true);
  });

  test('should fail when username is missing', async () => {
    const response = await request(app)
        .post('/adduser')
        .send({
          password: 'password123'
        });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required field: username');
  });

  test('should fail when password is missing', async () => {
    const response = await request(app)
        .post('/adduser')
        .send({
          username: 'testuser'
        });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required field: password');
  });

  test('should fail when username is less than 3 characters', async () => {
    const response = await request(app)
        .post('/adduser')
        .send({
          username: 'ab',
          password: 'password123'
        });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('El nombre de usuario debe tener al menos 3 caracteres');
  });

  test('should fail when password is less than 8 characters', async () => {
    const response = await request(app)
        .post('/adduser')
        .send({
          username: 'testuser',
          password: 'pass123'
        });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('La contraseña debe tener al menos 8 caracteres');
  });

  test('should fail when password does not contain a number', async () => {
    const response = await request(app)
        .post('/adduser')
        .send({
          username: 'testuser',
          password: 'passwordonly'
        });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('La contraseña debe contener al menos un número');
  });

  test('should fail when username already exists', async () => {
    // Create first user
    await request(app)
        .post('/adduser')
        .send({
          username: 'existinguser',
          password: 'password123'
        });

    // Try to create duplicate
    const response = await request(app)
        .post('/adduser')
        .send({
          username: 'existinguser',
          password: 'password456'
        });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('El nombre de usuario ya existe');
  });

  test('should accept username with exactly 3 characters', async () => {
    const response = await request(app)
        .post('/adduser')
        .send({
          username: 'abc',
          password: 'password123'
        });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('abc');
  });

  test('should accept password with exactly 8 characters including a number', async () => {
    const response = await request(app)
        .post('/adduser')
        .send({
          username: 'testuser',
          password: 'passwor1'
        });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('testuser');
  });
});

describe('User Service - GET /users', () => {

  test('should return empty array when no users exist', async () => {
    const response = await request(app).get('/users');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('should return all users without passwords', async () => {
    // Create test users
    await User.create([
      { username: 'user1', password: 'hashedpass1', role: 'user' },
      { username: 'user2', password: 'hashedpass2', role: 'admin' },
      { username: 'user3', password: 'hashedpass3', role: 'user', isBlocked: true }
    ]);

    const response = await request(app).get('/users');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);

    response.body.forEach(user => {
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('isBlocked');
      expect(user).not.toHaveProperty('password');
    });
  });

  test('should handle database errors gracefully', async () => {
    // Force an error by closing the connection temporarily
    await mongoose.connection.close();

    const response = await request(app).get('/users');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');

    // Reconnect for other tests
    await mongoose.connect(process.env.MONGODB_URI);
  });
});

describe('User Service - GET /users/:userId', () => {

  test('should return a specific user by ID without password', async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'hashedpassword',
      role: 'user'
    });

    const response = await request(app).get(`/users/${user._id}`);

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('testuser');
    expect(response.body.role).toBe('user');
    expect(response.body).not.toHaveProperty('password');
  });

  test('should return 404 when user does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app).get(`/users/${fakeId}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
  });

  test('should return 500 for invalid user ID format', async () => {
    const response = await request(app).get('/users/invalidid123');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
});

describe('User Service - PUT /users/:userId/block', () => {

  test('should block a user successfully', async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'hashedpassword',
      isBlocked: false
    });

    const response = await request(app)
        .put(`/users/${user._id}/block`)
        .send({ isBlocked: true });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User blocked successfully');
    expect(response.body.user.isBlocked).toBe(true);
    expect(response.body.user).not.toHaveProperty('password');

    // Verify in database
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.isBlocked).toBe(true);
  });

  test('should unblock a user successfully', async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'hashedpassword',
      isBlocked: true
    });

    const response = await request(app)
        .put(`/users/${user._id}/block`)
        .send({ isBlocked: false });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User unblocked successfully');
    expect(response.body.user.isBlocked).toBe(false);

    // Verify in database
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.isBlocked).toBe(false);
  });

  test('should fail when isBlocked is not a boolean', async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'hashedpassword'
    });

    const response = await request(app)
        .put(`/users/${user._id}/block`)
        .send({ isBlocked: 'true' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('isBlocked must be a boolean');
  });

  test('should fail when isBlocked is missing', async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'hashedpassword'
    });

    const response = await request(app)
        .put(`/users/${user._id}/block`)
        .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('isBlocked must be a boolean');
  });

  test('should return 404 when user does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
        .put(`/users/${fakeId}/block`)
        .send({ isBlocked: true });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
  });

  test('should return 500 for invalid user ID format', async () => {
    const response = await request(app)
        .put('/users/invalidid/block')
        .send({ isBlocked: true });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
});

describe('User Service - PUT /users/:userId/role', () => {

  test('should change user role to admin successfully', async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'hashedpassword',
      role: 'user'
    });

    const response = await request(app)
        .put(`/users/${user._id}/role`)
        .send({ role: 'admin' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Role updated successfully');
    expect(response.body.user.role).toBe('admin');
    expect(response.body.user).not.toHaveProperty('password');

    // Verify in database
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.role).toBe('admin');
  });

  test('should change admin role to user successfully', async () => {
    const user = await User.create({
      username: 'adminuser',
      password: 'hashedpassword',
      role: 'admin'
    });

    const response = await request(app)
        .put(`/users/${user._id}/role`)
        .send({ role: 'user' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Role updated successfully');
    expect(response.body.user.role).toBe('user');

    // Verify in database
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.role).toBe('user');
  });

  test('should fail when role is invalid', async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'hashedpassword',
      role: 'user'
    });

    const response = await request(app)
        .put(`/users/${user._id}/role`)
        .send({ role: 'superadmin' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Role must be "admin" or "user"');
  });

  test('should fail when role is missing', async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'hashedpassword',
      role: 'user'
    });

    const response = await request(app)
        .put(`/users/${user._id}/role`)
        .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Role must be "admin" or "user"');
  });

  test('should return 404 when user does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
        .put(`/users/${fakeId}/role`)
        .send({ role: 'admin' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
  });

  test('should return 500 for invalid user ID format', async () => {
    const response = await request(app)
        .put('/users/invalidid/role')
        .send({ role: 'admin' });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
});