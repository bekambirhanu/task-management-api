const mongoose = require('mongoose');
const User = require('../../src/models/User');
const { 
    setupTestDB, 
    clearDatabase, 
    closeTestDB,
    generateTestUser 
} = require('../utils/testHelpers');

describe('User Model', () => {
    beforeAll(async () => {
        await setupTestDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    describe('User Creation', () => {
        it('should create a user successfully', async () => {
            const userData = generateTestUser();
            const user = new User(userData);
            
            const savedUser = await user.save();
            
            expect(savedUser._id).toBeDefined();
            expect(savedUser.email).toBe(userData.email);
            expect(savedUser.first_name).toBe(userData.first_name);
            expect(savedUser.password).not.toBe(userData.password); // Should be hashed
        });

        it('should not create user with duplicate email', async () => {
            const userData = generateTestUser();
            
            // Create first user
            await new User(userData).save();
            
            // Try to create second user with same email
            const secondUser = new User(userData);
            
            await expect(secondUser.save()).rejects.toThrow();
        });

        it('should require email field', async () => {
            const userData = generateTestUser({ email: null });
            const user = new User(userData);
            
            await expect(user.save()).rejects.toThrow();
        });

        it('should validate email format', async () => {
            const userData = generateTestUser({ email: 'invalid-email' });
            const user = new User(userData);
            
            await expect(user.save()).rejects.toThrow();
        });
    });

    describe('Password Hashing', () => {
        it('should hash password before saving', async () => {
            const userData = generateTestUser({ password: 'plaintext123' });
            const user = new User(userData);
            
            await user.save();
            
            expect(user.password).not.toBe('plaintext123');
            expect(user.password).toHaveLength(60); // bcrypt hash length
        });

        it('should verify password correctly', async () => {
            const userData = generateTestUser({ password: 'correctpassword' });
            const user = new User(userData);
            await user.save();
            
            const isMatch = await user.correctPassword('correctpassword');
            expect(isMatch).toBe(true);
            
            const isWrong = await user.correctPassword('wrongpassword');
            expect(isWrong).toBe(false);
        });
    });

    describe('User Methods', () => {
        it('should exclude password from toJSON', async () => {
            const userData = generateTestUser();
            const user = new User(userData);
            await user.save();
            
            const userJSON = user.toJSON();
            
            expect(userJSON.password).toBeUndefined();
            expect(userJSON.__v).toBeUndefined();
        });
    });
});