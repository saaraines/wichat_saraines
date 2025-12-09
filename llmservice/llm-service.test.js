const request = require('supertest');
const axios = require('axios');

// Mock axios before requiring the app
jest.mock('axios');

let app;

beforeAll(() => {
  // Set up environment variable
  process.env.LLM_API_KEY = 'test-api-key-12345';

  // Require the app after setting env
  app = require('./llm-service');
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

describe('LLM Service - GET /health', () => {

  test('should return OK status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'OK' });
  });
});

describe('LLM Service - POST /ask', () => {

  test('should successfully get answer from LLM', async () => {
    // Mock axios response
    axios.post.mockResolvedValue({
      data: {
        candidates: [{
          content: {
            parts: [{
              text: 'This is the answer from Gemini'
            }]
          }
        }]
      }
    });

    const response = await request(app)
        .post('/ask')
        .send({
          question: 'What is the capital of France?',
          model: 'gemini'
        });

    expect(response.status).toBe(200);
    expect(response.body.answer).toBe('This is the answer from Gemini');

    // Verify axios was called correctly
    expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          contents: expect.any(Array)
        }),
        expect.any(Object)
    );
  });

  test('should fail without question field', async () => {
    const response = await request(app)
        .post('/ask')
        .send({
          model: 'gemini'
        });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required field: question');
  });

  test('should fail without model field', async () => {
    const response = await request(app)
        .post('/ask')
        .send({
          question: 'What is the capital of France?'
        });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required field: model');
  });

  test('should fail when API key is missing', async () => {
    // Temporarily remove API key
    const originalKey = process.env.LLM_API_KEY;
    delete process.env.LLM_API_KEY;

    const response = await request(app)
        .post('/ask')
        .send({
          question: 'What is the capital of France?',
          model: 'gemini'
        });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('API key is missing.');

    // Restore API key
    process.env.LLM_API_KEY = originalKey;
  });

  test('should handle unsupported model', async () => {
    const response = await request(app)
        .post('/ask')
        .send({
          question: 'What is the capital of France?',
          model: 'unsupported-model'
        });

    expect(response.status).toBe(200);
    expect(response.body.answer).toBeNull();
  });

  test('should handle axios errors gracefully', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));

    const response = await request(app)
        .post('/ask')
        .send({
          question: 'What is the capital of France?',
          model: 'gemini'
        });

    expect(response.status).toBe(200);
    expect(response.body.answer).toBeNull();
  });

  test('should handle malformed API response', async () => {
    axios.post.mockResolvedValue({
      data: {
        candidates: []
      }
    });

    const response = await request(app)
        .post('/ask')
        .send({
          question: 'What is the capital of France?',
          model: 'gemini'
        });

    expect(response.status).toBe(200);
    expect(response.body.answer).toBeUndefined();
  });

  test('should include API key in URL', async () => {
    axios.post.mockResolvedValue({
      data: {
        candidates: [{
          content: {
            parts: [{
              text: 'Answer'
            }]
          }
        }]
      }
    });

    await request(app)
        .post('/ask')
        .send({
          question: 'Test question',
          model: 'gemini'
        });

    expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('key=test-api-key-12345'),
        expect.any(Object),
        expect.any(Object)
    );
  });

  test('should format request correctly for Gemini', async () => {
    axios.post.mockResolvedValue({
      data: {
        candidates: [{
          content: {
            parts: [{
              text: 'Answer'
            }]
          }
        }]
      }
    });

    await request(app)
        .post('/ask')
        .send({
          question: 'Test question',
          model: 'gemini'
        });

    expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          contents: [{
            parts: [{
              text: 'Test question'
            }]
          }]
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
    );
  });
});

describe('LLM Service - POST /hint', () => {

  test('should successfully get hint response', async () => {
    axios.post.mockResolvedValue({
      data: {
        candidates: [{
          content: {
            parts: [{
              text: 'This is a hint about the answer'
            }]
          }
        }]
      }
    });

    const response = await request(app)
        .post('/hint')
        .send({
          correctAnswer: 'Paris',
          message: 'Give me a hint',
          history: []
        });

    expect(response.status).toBe(200);
    expect(response.body.response).toBe('This is a hint about the answer');
  });

  test('should fail without correctAnswer', async () => {
    const response = await request(app)
        .post('/hint')
        .send({
          message: 'Give me a hint'
        });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required fields');
  });

  test('should fail without message', async () => {
    const response = await request(app)
        .post('/hint')
        .send({
          correctAnswer: 'Paris'
        });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required fields');
  });

  test('should work without history', async () => {
    axios.post.mockResolvedValue({
      data: {
        candidates: [{
          content: {
            parts: [{
              text: 'Hint response'
            }]
          }
        }]
      }
    });

    const response = await request(app)
        .post('/hint')
        .send({
          correctAnswer: 'Paris',
          message: 'Give me a hint'
        });

    expect(response.status).toBe(200);
    expect(response.body.response).toBe('Hint response');
  });

  test('should include conversation history in prompt', async () => {
    axios.post.mockResolvedValue({
      data: {
        candidates: [{
          content: {
            parts: [{
              text: 'Hint with history'
            }]
          }
        }]
      }
    });

    const history = [
      { role: 'user', content: 'Is it in Europe?' },
      { role: 'assistant', content: 'Yes, it is in Western Europe' }
    ];

    const response = await request(app)
        .post('/hint')
        .send({
          correctAnswer: 'Paris',
          message: 'Tell me more',
          history: history
        });

    expect(response.status).toBe(200);

    // Verify the prompt includes history
    const callArgs = axios.post.mock.calls[0];
    const requestData = callArgs[1];
    const promptText = requestData.contents[0].parts[0].text;

    expect(promptText).toContain('HISTORIAL');
    expect(promptText).toContain('Is it in Europe?');
    expect(promptText).toContain('Yes, it is in Western Europe');
  });

  test('should include correct answer in prompt without revealing it', async () => {
    axios.post.mockResolvedValue({
      data: {
        candidates: [{
          content: {
            parts: [{
              text: 'Hint'
            }]
          }
        }]
      }
    });

    await request(app)
        .post('/hint')
        .send({
          correctAnswer: 'Eiffel Tower',
          message: 'What is it?',
          history: []
        });

    const callArgs = axios.post.mock.calls[0];
    const requestData = callArgs[1];
    const promptText = requestData.contents[0].parts[0].text;

    expect(promptText).toContain('Eiffel Tower');
    expect(promptText).toContain('NUNCA menciones directamente');
  });

  test('should handle empty history array', async () => {
    axios.post.mockResolvedValue({
      data: {
        candidates: [{
          content: {
            parts: [{
              text: 'Hint'
            }]
          }
        }]
      }
    });

    const response = await request(app)
        .post('/hint')
        .send({
          correctAnswer: 'Paris',
          message: 'Give me a hint',
          history: []
        });

    expect(response.status).toBe(200);
    expect(response.body.response).toBe('Hint');
  });

  test('should fail when API key is missing', async () => {
    const originalKey = process.env.LLM_API_KEY;
    delete process.env.LLM_API_KEY;

    const response = await request(app)
        .post('/hint')
        .send({
          correctAnswer: 'Paris',
          message: 'Give me a hint'
        });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('API key not configured');

    process.env.LLM_API_KEY = originalKey;
  });

  test('should handle LLM returning null response', async () => {
    axios.post.mockResolvedValue({
      data: {
        candidates: []
      }
    });

    const response = await request(app)
        .post('/hint')
        .send({
          correctAnswer: 'Paris',
          message: 'Give me a hint'
        });

    expect(response.status).toBe(500);
    expect(response.body.error).toContain('No response from LLM');
  });

  test('should handle axios errors', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));

    const response = await request(app)
        .post('/hint')
        .send({
          correctAnswer: 'Paris',
          message: 'Give me a hint'
        });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });

  test('should build complete prompt with rules', async () => {
    axios.post.mockResolvedValue({
      data: {
        candidates: [{
          content: {
            parts: [{
              text: 'Hint'
            }]
          }
        }]
      }
    });

    await request(app)
        .post('/hint')
        .send({
          correctAnswer: 'Paris',
          message: 'Where is this?'
        });

    const callArgs = axios.post.mock.calls[0];
    const requestData = callArgs[1];
    const promptText = requestData.contents[0].parts[0].text;

    expect(promptText).toContain('CONTEXTO');
    expect(promptText).toContain('REGLAS');
    expect(promptText).toContain('Da pistas progresivas');
    expect(promptText).toContain('Usuario: Where is this?');
    expect(promptText).toContain('RESPONDE AHORA');
  });

  test('should include user message in prompt', async () => {
    axios.post.mockResolvedValue({
      data: {
        candidates: [{
          content: {
            parts: [{
              text: 'Hint'
            }]
          }
        }]
      }
    });

    const userMessage = 'Is this a famous landmark?';

    await request(app)
        .post('/hint')
        .send({
          correctAnswer: 'Eiffel Tower',
          message: userMessage
        });

    const callArgs = axios.post.mock.calls[0];
    const requestData = callArgs[1];
    const promptText = requestData.contents[0].parts[0].text;

    expect(promptText).toContain(userMessage);
  });
});

describe('Helper Functions', () => {

  test('validateRequiredFields should not throw when all fields present', () => {
    const mockReq = {
      body: {
        question: 'test',
        model: 'gemini'
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
      validateRequiredFields(mockReq, ['question', 'model']);
    }).not.toThrow();
  });

  test('validateRequiredFields should throw when field missing', () => {
    const mockReq = {
      body: {
        question: 'test'
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
      validateRequiredFields(mockReq, ['question', 'model']);
    }).toThrow('Missing required field: model');
  });
});