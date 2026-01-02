const { MongoMemoryServer } = require('mongodb-memory-server');
const dotenv = require('dotenv');
const path = require('path');

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

    console.log('Services ready for testing!');
}

startServer();