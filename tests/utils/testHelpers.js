const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup in-memory MongoDB for testing
exports.setupTestDB = async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
};

// Clean up database
exports.clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
        await collections[key].deleteMany();
    }
};

// Teardown database
exports.closeTestDB = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
};

// Generate test user data
exports.generateTestUser = (overrides = {}) => ({
    email: `test${Date.now()}@example.com`,
    password: 'Password123!',
    first_name: 'Test',
    last_name: 'User',
    sex: 'male',
    role: 'user',
    ...overrides
});

// Generate test task data
exports.generateTestTask = (overrides = {}) => ({
    title: `Test Task ${Date.now()}`,
    description: 'Test task description',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000), // Tomorrow
    ...overrides
});

// Get auth token for testing
exports.getAuthToken = async (request, userData) => {
    const user = await request
        .post('/api/auth/register')
        .send(userData);
    
    return user.body.token;
};