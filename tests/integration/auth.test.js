const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { 
    setupTestDB, 
    clearDatabase, 
    closeTestDB,
    generateTestUser 
} = require('../utils/testHelpers');

describe('Auth API', () => {
    beforeAll(async () => {
        await setupTestDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const userData = generateTestUser();
            
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);
            
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe(userData.email);
            expect(response.body.user.password).toBeUndefined();
        });

        it('should not register with existing email', async () => {
            const userData = generateTestUser();
            
            // First registration
            await request(app)
                .post('/api/auth/register')
                .send(userData);
            
            // Second attempt with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(409);
            
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com' }) // Missing required fields
                .expect(400);
            
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            const userData = generateTestUser();
            await request(app)
                .post('/api/auth/register')
                .send(userData);
        });

        it('should login with valid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'Password123!'
            };
            
            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user).toBeDefined();
        });

        it('should not login with invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);
            
            expect(response.body.success).toBe(false);
        });

        it('should not login with non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password'
                })
                .expect(401);
            
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        it('should send reset email for valid user', async () => {
            const userData = generateTestUser();
            await request(app)
                .post('/api/auth/register')
                .send(userData);
            
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: userData.email })
                .expect(200);
            
            expect(response.body.success).toBe(true);
        });

        it('should not reveal if email exists', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' })
                .expect(200); // Still returns 200 for security
            
            expect(response.body.success).toBe(true);
        });
    });
});