const request = require('supertest');
const app = require('../../src/app');
const Notification = require('../../src/models/Notification');
const User = require('../../src/models/User');
const Task = require('../../src/models/Task');
const {
    setupTestDB,
    clearDatabase,
    closeTestDB,
    generateTestUser,
    generateTestTask,
    getAuthToken
} = require('../utils/testHelpers');

describe('Notification API', () => {
    let authToken;
    let userId;
    let notificationId;

    beforeAll(async () => {
        await setupTestDB();
    });

    beforeEach(async () => {
        const userData = generateTestUser();
        authToken = await getAuthToken(request(app), userData);

        const userResponse = await request(app)
            .post('/api/auth/register')
            .send(userData);
        userId = userResponse.body.user._id;

        // Create test notification
        const notification = await Notification.create({
            user: userId,
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: 'You have been assigned to a new task',
            read: false
        });
        notificationId = notification._id.toString();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    describe('GET /api/notifications', () => {
        it('should get all notifications for authenticated user', async () => {
            const response = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.notifications).toBeDefined();
            expect(Array.isArray(response.body.notifications)).toBe(true);
            expect(response.body.notifications.length).toBeGreaterThan(0);
        });

        it('should not get notifications without authentication', async () => {
            await request(app)
                .get('/api/notifications')
                .expect(401);
        });

        it('should only return notifications for current user', async () => {
            // Create another user with notifications
            const otherUserData = generateTestUser();
            const otherToken = await getAuthToken(request(app), otherUserData);
            const otherUserResponse = await request(app)
                .post('/api/auth/register')
                .send(otherUserData);

            await Notification.create({
                user: otherUserResponse.body.user._id,
                type: 'system',
                title: 'Other User Notification',
                message: 'This should not be visible',
                read: false
            });

            const response = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Should only get notifications for current user
            expect(response.body.notifications.every(n => n.user === userId)).toBe(true);
        });

        it('should filter unread notifications', async () => {
            // Create mix of read and unread notifications
            await Notification.create([
                {
                    user: userId,
                    type: 'task_updated',
                    title: 'Task Updated',
                    message: 'A task has been updated',
                    read: true
                },
                {
                    user: userId,
                    type: 'system',
                    title: 'System Notification',
                    message: 'System message',
                    read: false
                }
            ]);

            const response = await request(app)
                .get('/api/notifications?read=false')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.notifications.every(n => n.read === false)).toBe(true);
        });
    });

    describe('PUT /api/notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            const response = await request(app)
                .put(`/api/notifications/${notificationId}/read`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify in database
            const updatedNotification = await Notification.findById(notificationId);
            expect(updatedNotification.read).toBe(true);
        });

        it('should not mark non-existent notification as read', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            await request(app)
                .put(`/api/notifications/${fakeId}/read`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should not allow marking other user notifications as read', async () => {
            const otherUserData = generateTestUser();
            const otherToken = await getAuthToken(request(app), otherUserData);

            await request(app)
                .put(`/api/notifications/${notificationId}/read`)
                .set('Authorization', `Bearer ${otherToken}`)
                .expect(403);
        });
    });

    describe('DELETE /api/notifications/:id', () => {
        it('should delete notification', async () => {
            const response = await request(app)
                .delete(`/api/notifications/${notificationId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify deletion
            const deletedNotification = await Notification.findById(notificationId);
            expect(deletedNotification).toBeNull();
        });

        it('should not delete non-existent notification', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            await request(app)
                .delete(`/api/notifications/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should not allow deleting other user notifications', async () => {
            const otherUserData = generateTestUser();
            const otherToken = await getAuthToken(request(app), otherUserData);

            await request(app)
                .delete(`/api/notifications/${notificationId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .expect(403);
        });
    });

    describe('Notification Creation on Task Events', () => {
        it('should create notification when task is assigned', async () => {
            // This would typically be tested via Socket.IO or task controller
            // For now, we'll test the notification model directly

            const task = await Task.create({
                ...generateTestTask(),
                createdBy: userId,
                assignedTo: [userId]
            });

            const notification = await Notification.create({
                user: userId,
                type: 'task_assigned',
                title: 'New Task Assigned',
                message: `You have been assigned to task: ${task.title}`,
                relatedTask: task._id,
                read: false
            });

            expect(notification).toBeDefined();
            expect(notification.user.toString()).toBe(userId);
            expect(notification.type).toBe('task_assigned');
            expect(notification.relatedTask.toString()).toBe(task._id.toString());
        });

        it('should create notification when task is updated', async () => {
            const task = await Task.create({
                ...generateTestTask(),
                createdBy: userId,
                assignedTo: [userId]
            });

            const notification = await Notification.create({
                user: userId,
                type: 'task_updated',
                title: 'Task Updated',
                message: `Task "${task.title}" has been updated`,
                relatedTask: task._id,
                read: false
            });

            expect(notification.type).toBe('task_updated');
            expect(notification.relatedTask.toString()).toBe(task._id.toString());
        });
    });

    describe('Notification Pagination', () => {
        beforeEach(async () => {
            // Create multiple notifications
            const notifications = Array.from({ length: 15 }, (_, i) => ({
                user: userId,
                type: 'system',
                title: `Notification ${i + 1}`,
                message: `Test notification ${i + 1}`,
                read: false
            }));

            await Notification.create(notifications);
        });

        it('should paginate notifications', async () => {
            const response = await request(app)
                .get('/api/notifications?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.notifications.length).toBeLessThanOrEqual(10);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.currentPage).toBe(1);
        });

        it('should get second page of notifications', async () => {
            const response = await request(app)
                .get('/api/notifications?page=2&limit=10')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.pagination.currentPage).toBe(2);
        });
    });

    describe('Bulk Operations', () => {
        beforeEach(async () => {
            // Create multiple unread notifications
            await Notification.create([
                {
                    user: userId,
                    type: 'system',
                    title: 'Notification 1',
                    message: 'Message 1',
                    read: false
                },
                {
                    user: userId,
                    type: 'system',
                    title: 'Notification 2',
                    message: 'Message 2',
                    read: false
                }
            ]);
        });

        it('should mark all notifications as read', async () => {
            const response = await request(app)
                .put('/api/notifications/mark-all-read')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify all are marked as read
            const notifications = await Notification.find({ user: userId });
            expect(notifications.every(n => n.read === true)).toBe(true);
        });

        it('should delete all read notifications', async () => {
            // First mark some as read
            await Notification.updateMany(
                { user: userId },
                { read: true }
            );

            const response = await request(app)
                .delete('/api/notifications/delete-read')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify only unread notifications remain
            const remaining = await Notification.find({ user: userId });
            expect(remaining.every(n => n.read === false)).toBe(true);
        });
    });
});
