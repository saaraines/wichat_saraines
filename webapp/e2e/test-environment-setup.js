const { MongoMemoryServer } = require('mongodb-memory-server');
const dotenv = require('dotenv');
const path = require('path');
const setupTestData = require('./setup-test-data');

let mongoserver;
let userservice;
let authservice;
let llmservice;
let gatewayservice;

// Make available the .env file for the e2e tests so the enviroment variables are loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function startServer() {
    console.log('Starting MongoDB memory server...');
    mongoserver = await MongoMemoryServer.create();
    const mongoUri = mongoserver.getUri();
    process.env.MONGODB_URI = mongoUri;

    console.log('Starting services...');
    userservice = await require("../../users/userservice/user-service");
    authservice = await require("../../users/authservice/auth-service");
    llmservice = await require("../../llmservice/llm-service");
    gatewayservice = await require("../../gatewayservice/gateway-service");

    // Wait a bit for services to be ready
    console.log('Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Setup test data
    console.log('Populating test data...');
    await setupTestData();
    console.log('Environment ready for testing!');
}

startServer();