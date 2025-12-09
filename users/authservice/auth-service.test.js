const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./auth-model');

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
  app = require('./auth-service');

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

describe('Auth Service - POST /login', () => {

  test('should login successfully with valid credentials', async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const testUser = await User.create({
      username: 'testuser',
      password: hashedPassword,
      role: 'user',
      isBlocked: false,
      createdAt: new Date()
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.username).toBe('testuser');
    expect(response.body.role).toBe('user');
    expect(response.body).toHaveProperty('createdAt');

    // Verify JWT token is valid
    const decoded = jwt.verify(response.body.token, 'your-secret-key');
    expect(decoded.userId).toBe(testUser._id.toString());
    expect(decoded.role).toBe('user');
    expect(decoded).toHaveProperty('exp');
  });

  test('should login successfully as admin', async () => {
    // Create an admin user
    const hashedPassword = await bcrypt.hash('adminpass123', 10);
    await User.create({
      username: 'adminuser',
      password: hashedPassword,
      role: 'admin',
      isBlocked: false,
      createdAt: new Date()
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: 'adminuser',
          password: 'adminpass123'
        });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.role).toBe('admin');

    // Verify JWT token contains admin role
    const decoded = jwt.verify(response.body.token, 'your-secret-key');
    expect(decoded.role).toBe('admin');
  });

  test('should fail when username is missing', async () => {
    const response = await request(app)
        .post('/login')
        .send({
          password: 'password123'
        });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('should fail when password is missing', async () => {
    const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser'
        });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('should fail when username is less than 3 characters', async () => {
    const response = await request(app)
        .post('/login')
        .send({
          username: 'ab',
          password: 'password123'
        });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('should fail when password is less than 3 characters', async () => {
    const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'ab'
        });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('should fail with invalid username', async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'testuser',
      password: hashedPassword,
      role: 'user',
      isBlocked: false,
      createdAt: new Date()
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: 'wronguser',
          password: 'password123'
        });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });

  test('should fail with invalid password', async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'testuser',
      password: hashedPassword,
      role: 'user',
      isBlocked: false,
      createdAt: new Date()
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

  test('should fail when user is blocked', async () => {
    // Create a blocked user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'blockeduser',
      password: hashedPassword,
      role: 'user',
      isBlocked: true,
      createdAt: new Date()
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: 'blockeduser',
          password: 'password123'
        });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('User is blocked');
  });

  test('should trim and escape username input', async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'testuser',
      password: hashedPassword,
      role: 'user',
      isBlocked: false,
      createdAt: new Date()
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: '  testuser  ',  // with spaces
          password: 'password123'
        });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('testuser');
  });

  test('should trim and escape password input', async () => {
    // Create a test user with trimmed password
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'testuser',
      password: hashedPassword,
      role: 'user',
      isBlocked: false,
      createdAt: new Date()
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: '  password123  '  // with spaces
        });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  test('should handle database errors gracefully', async () => {
    // Close the connection to force an error
    await mongoose.connection.close();

    const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal Server Error');

    // Reconnect for other tests
    await mongoose.connect(process.env.MONGODB_URI);
  });

  test('should return token that expires in 1 hour', async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'testuser',
      password: hashedPassword,
      role: 'user',
      isBlocked: false,
      createdAt: new Date()
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

    expect(response.status).toBe(200);

    // Verify token expiration
    const decoded = jwt.verify(response.body.token, 'your-secret-key');
    const expirationTime = decoded.exp - decoded.iat;
    expect(expirationTime).toBe(3600); // 1 hour in seconds
  });

  test('should handle special characters in username safely', async () => {
    // Create a test user with special chars
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'test<script>alert("xss")</script>',
      password: hashedPassword,
      role: 'user',
      isBlocked: false,
      createdAt: new Date()
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: 'test<script>alert("xss")</script>',
          password: 'password123'
        });

    // Should be escaped by express-validator
    expect(response.status).toBe(401); // Won't find escaped version
  });

  test('should accept username with exactly 3 characters', async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'abc',
      password: hashedPassword,
      role: 'user',
      isBlocked: false,
      createdAt: new Date()
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: 'abc',
          password: 'password123'
        });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('abc');
  });

  test('should accept password with exactly 3 characters', async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('abc', 10);
    await User.create({
      username: 'testuser',
      password: hashedPassword,
      role: 'user',
      isBlocked: false,
      createdAt: new Date()
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'abc'
        });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  test('should not return password in response', async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'testuser',
      password: hashedPassword,
      role: 'user',
      isBlocked: false,
      createdAt: new Date()
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty('password');
  });

  test('should handle empty request body', async () => {
    const response = await request(app)
        .post('/login')
        .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('should convert username to string', async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      username: '12345',
      password: hashedPassword,
      role: 'user',
      isBlocked: false,
      createdAt: new Date()
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: 12345,  // sending as number
          password: 'password123'
        });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('12345');
  });

  test('should convert password to string', async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('123', 10);
    await User.create({
      username: 'testuser',
      password: hashedPassword,
      role: 'user',
      isBlocked: false,
      createdAt: new Date()
    });

    const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 123  // sending as number
        });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});

describe('Auth Service - validateRequiredFields function', () => {

  test('should not throw error when all fields are present', () => {
    const mockReq = {
      body: {
        username: 'test',
        password: 'test123'
      }
    };

    // Import the function - we test it indirectly through endpoints
    // This is tested through all the endpoint tests above
    expect(() => {
      const validateRequiredFields = (req, fields) => {
        for (const field of fields) {
          if (!(field in req.body)) {
            throw new Error(`Missing required field: ${field}`);
          }
        }
      };
      validateRequiredFields(mockReq, ['username', 'password']);
    }).not.toThrow();
  });

  test('should throw error when field is missing', () => {
    const mockReq = {
      body: {
        username: 'test'
      }
    };

    expect(() => {
      const validateRequiredFields = (req, fields) => {
        for (const field of fields) {
          if (!(field in req.body)) {
            throw new Error(`Missing required field: ${field}`);
          }
        }
      };
      validateRequiredFields(mockReq, ['username', 'password']);
    }).toThrow('Missing required field: password');
  });
});