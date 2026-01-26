const request = require('supertest');
const app = require('../../src/app');
const Task = require('../../src/models/Task');
const {
    setupTestDB,
    clearDatabase,
    closeTestDB,
    generateTestUser,
    generateTestTask,
    getAuthToken
} = require('../utils/testHelpers');

describe('Task API', () => {
    let authToken;
    let userId;
    let managerToken;
    let managerId;

    beforeAll(async () => {
        await setupTestDB();
    });

    beforeEach(async () => {
        // Create regular user
        const userData = generateTestUser();
        authToken = await getAuthToken(request(app), userData);
        const userResponse = await request(app)
            .post('/api/auth/register')
            .send(userData);
        userId = userResponse.body.user._id;

        // Create manager user
        const managerData = generateTestUser({ role: 'manager' });
        managerToken = await getAuthToken(request(app), managerData);
        const managerResponse = await request(app)
            .post('/api/auth/register')
            .send(managerData);
        managerId = managerResponse.body.user._id;
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    describe('POST /api/tasks/c', () => {
        it('should create a new task', async () => {
            const taskData = generateTestTask();

            const response = await request(app)
                .post('/api/tasks/c')
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.title).toBe(taskData.title);
            expect(response.body.data.description).toBe(taskData.description);
            expect(response.body.data.status).toBe(taskData.status);
        });

        it('should not create task without authentication', async () => {
            const taskData = generateTestTask();

            await request(app)
                .post('/api/tasks/c')
                .send(taskData)
                .expect(401);
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/tasks/c')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Test' }) // Missing required fields
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should allow manager to assign tasks', async () => {
            const taskData = generateTestTask({ assignedTo: [userId] });

            const response = await request(app)
                .post('/api/tasks/c')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(taskData)
                .expect(201);

            expect(response.body.data.assignedTo).toContain(userId);
        });
    });

    describe('GET /api/tasks', () => {
        beforeEach(async () => {
            // Create test tasks
            await Task.create([
                { ...generateTestTask({ title: 'Task 1', status: 'todo' }), createdBy: userId },
                { ...generateTestTask({ title: 'Task 2', status: 'in-progress' }), createdBy: userId },
                { ...generateTestTask({ title: 'Task 3', status: 'done' }), createdBy: userId }
            ]);
        });

        it('should get all tasks for authenticated user', async () => {
            const response = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should filter tasks by status', async () => {
            const response = await request(app)
                .get('/api/tasks?status=todo')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data.every(task => task.status === 'todo')).toBe(true);
        });

        it('should filter tasks by priority', async () => {
            const response = await request(app)
                .get('/api/tasks?priority=medium')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data.every(task => task.priority === 'medium')).toBe(true);
        });

        it('should paginate results', async () => {
            const response = await request(app)
                .get('/api/tasks?page=1&limit=2')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data.length).toBeLessThanOrEqual(2);
            expect(response.body.currentPage).toBe(1);
        });
    });

    describe('PUT /api/tasks/:id/modify', () => {
        let taskId;

        beforeEach(async () => {
            const task = await Task.create({
                ...generateTestTask(),
                createdBy: userId
            });
            taskId = task._id.toString();
        });

        it('should update task', async () => {
            const updateData = {
                title: 'Updated Task',
                status: 'in-progress'
            };

            const response = await request(app)
                .put(`/api/tasks/${taskId}/modify`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(updateData.title);
            expect(response.body.data.status).toBe(updateData.status);
        });

        it('should not update non-existent task', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            await request(app)
                .put(`/api/tasks/${fakeId}/modify`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Updated' })
                .expect(404);
        });

        it('should not allow unauthorized user to update task', async () => {
            const otherUserData = generateTestUser();
            const otherToken = await getAuthToken(request(app), otherUserData);

            await request(app)
                .put(`/api/tasks/${taskId}/modify`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ title: 'Hacked' })
                .expect(403);
        });
    });

    describe('DELETE /api/tasks/:id/delete', () => {
        let taskId;

        beforeEach(async () => {
            const task = await Task.create({
                ...generateTestTask(),
                createdBy: userId
            });
            taskId = task._id.toString();
        });

        it('should delete task', async () => {
            const response = await request(app)
                .delete(`/api/tasks/${taskId}/delete`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            const deletedTask = await Task.findById(taskId);
            expect(deletedTask).toBeNull();
        });

        it('should not delete non-existent task', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            await request(app)
                .delete(`/api/tasks/${fakeId}/delete`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should not allow unauthorized user to delete task', async () => {
            const otherUserData = generateTestUser();
            const otherToken = await getAuthToken(request(app), otherUserData);

            await request(app)
                .delete(`/api/tasks/${taskId}/delete`)
                .set('Authorization', `Bearer ${otherToken}`)
                .expect(403);
        });
    });

    describe('PATCH /api/tasks/a', () => {
        let taskId;

        beforeEach(async () => {
            const task = await Task.create({
                ...generateTestTask(),
                createdBy: managerId
            });
            taskId = task._id.toString();
        });

        it('should allow manager to assign task to user', async () => {
            const response = await request(app)
                .patch('/api/tasks/a')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    taskId: taskId,
                    userId: userId,
                    action: 'assign'
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            const updatedTask = await Task.findById(taskId);
            expect(updatedTask.assignedTo).toContain(userId);
        });

        it('should not allow regular user to assign tasks', async () => {
            await request(app)
                .patch('/api/tasks/a')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    taskId: taskId,
                    userId: userId,
                    action: 'assign'
                })
                .expect(403);
        });
    });
});
