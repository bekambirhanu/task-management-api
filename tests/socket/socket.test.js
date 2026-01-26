const io = require('socket.io-client');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Task = require('../../src/models/Task');
const User = require('../../src/models/User');
const Notification = require('../../src/models/Notification');
const { JWT_SECRET_TOKEN } = require('../../envVars');
const {
    setupTestDB,
    clearDatabase,
    closeTestDB,
    generateTestUser,
    generateTestTask
} = require('../utils/testHelpers');

describe('Socket.IO Realtime Features', () => {
    let httpServer;
    let ioServer;
    let clientSocket;
    let testUser;
    let testToken;
    let taskId;

    beforeAll(async () => {
        await setupTestDB();

        // Create test user
        testUser = await User.create({
            ...generateTestUser(),
            password: await require('bcryptjs').hash('Password123!', 10)
        });

        // Generate JWT token
        testToken = jwt.sign(
            { userId: testUser._id, role: testUser.role },
            JWT_SECRET_TOKEN,
            { expiresIn: '1h' }
        );
    });

    beforeEach((done) => {
        // Create HTTP server and Socket.IO server
        httpServer = createServer();
        ioServer = new Server(httpServer);

        // Setup socket handlers (simplified version)
        ioServer.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            try {
                const decoded = jwt.verify(token, JWT_SECRET_TOKEN);
                socket.userId = decoded.userId;
                socket.userRole = decoded.role;
                socket.first_name = testUser.first_name;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });

        ioServer.on('connection', (socket) => {
            // Join user room
            socket.join(`user_${socket.userId}`);
            socket.join(`role_${socket.userRole}`);

            // Task handlers
            socket.on('join_task', async (data) => {
                const taskId = data.task_id || data;
                await socket.join(`task_${taskId}`);
                socket.emit('join_request', { message: 'Joined task successfully' });
            });

            socket.on('leave_task', async (data) => {
                const taskId = data.task_id || data;
                await socket.leave(`task_${taskId}`);
                socket.emit('leave_request', { success: true, message: 'Left task successfully' });
            });

            socket.on('create_task', async (taskData) => {
                try {
                    const task = await Task.create({
                        ...taskData,
                        createdBy: socket.userId
                    });
                    socket.emit('create_request', {
                        success: true,
                        message: 'Task created successfully',
                        task: task
                    });
                } catch (error) {
                    socket.emit('error', { message: 'Failed to create task' });
                }
            });

            socket.on('update_task', async (data) => {
                try {
                    const task = await Task.findByIdAndUpdate(
                        data.task_id,
                        data.update_data,
                        { new: true }
                    );
                    if (task) {
                        socket.emit('update_request', {
                            success: true,
                            message: 'Task updated successfully',
                            task: task
                        });
                        ioServer.to(`task_${data.task_id}`).emit('task_update', {
                            message: 'Task has been updated',
                            task: task
                        });
                    } else {
                        socket.emit('update_request', {
                            success: false,
                            message: 'Task not found'
                        });
                    }
                } catch (error) {
                    socket.emit('error', { message: 'Failed to update task' });
                }
            });

            socket.on('delete_task', async (data) => {
                try {
                    const task = await Task.findByIdAndDelete(data.task_id);
                    if (task) {
                        socket.emit('delete_request', {
                            success: true,
                            message: 'Task deleted successfully'
                        });
                    } else {
                        socket.emit('delete_request', {
                            success: false,
                            message: 'Task not found'
                        });
                    }
                } catch (error) {
                    socket.emit('error', { message: 'Failed to delete task' });
                }
            });

            // Notification handlers
            socket.on('get_notifications', async () => {
                try {
                    const notifications = await Notification.find({ user: socket.userId });
                    socket.emit('get_request', {
                        success: true,
                        notifications: notifications
                    });
                } catch (error) {
                    socket.emit('error', { message: 'Failed to get notifications' });
                }
            });

            // Presence handlers
            socket.on('update_activity', (activity) => {
                if (activity.currentTask) {
                    socket.broadcast.to(`task_${activity.currentTask}`).emit('activity_update', {
                        userId: socket.userId,
                        activity: activity.type,
                        timestamp: new Date()
                    });
                }
            });

            socket.on('get_online_users', () => {
                // Simplified - just return test data
                socket.emit('online_users', { users: [socket.userId] });
            });
        });

        httpServer.listen(() => {
            const port = httpServer.address().port;
            clientSocket = io(`http://localhost:${port}`, {
                auth: { token: testToken }
            });
            clientSocket.on('connect', done);
        });
    });

    afterEach((done) => {
        if (clientSocket.connected) {
            clientSocket.disconnect();
        }
        ioServer.close();
        httpServer.close(done);
    });

    afterAll(async () => {
        await clearDatabase();
        await closeTestDB();
    });

    describe('Connection and Authentication', () => {
        it('should connect with valid token', (done) => {
            expect(clientSocket.connected).toBe(true);
            done();
        });

        it('should reject connection without token', (done) => {
            const port = httpServer.address().port;
            const unauthorizedSocket = io(`http://localhost:${port}`);

            unauthorizedSocket.on('connect_error', (error) => {
                expect(error.message).toContain('Authentication error');
                unauthorizedSocket.close();
                done();
            });
        });
    });

    describe('Task Room Management', () => {
        beforeEach(async () => {
            const task = await Task.create({
                ...generateTestTask(),
                createdBy: testUser._id
            });
            taskId = task._id.toString();
        });

        it('should join task room', (done) => {
            clientSocket.emit('join_task', { task_id: taskId });

            clientSocket.on('join_request', (data) => {
                expect(data.message).toContain('Joined task');
                done();
            });
        });

        it('should leave task room', (done) => {
            clientSocket.emit('join_task', { task_id: taskId });

            clientSocket.once('join_request', () => {
                clientSocket.emit('leave_task', { task_id: taskId });

                clientSocket.on('leave_request', (data) => {
                    expect(data.success).toBe(true);
                    expect(data.message).toContain('Left task');
                    done();
                });
            });
        });
    });

    describe('Task Operations via Socket', () => {
        it('should create task via socket', (done) => {
            const taskData = generateTestTask();

            clientSocket.emit('create_task', taskData);

            clientSocket.on('create_request', async (data) => {
                expect(data.success).toBe(true);
                expect(data.task).toBeDefined();
                expect(data.task.title).toBe(taskData.title);

                // Verify task was saved to database
                const savedTask = await Task.findById(data.task._id);
                expect(savedTask).toBeDefined();
                done();
            });
        });

        it('should update task via socket', (done) => {
            Task.create({
                ...generateTestTask(),
                createdBy: testUser._id
            }).then((task) => {
                const updateData = {
                    task_id: task._id.toString(),
                    update_data: { status: 'in-progress', title: 'Updated Title' }
                };

                clientSocket.emit('update_task', updateData);

                clientSocket.on('update_request', (data) => {
                    expect(data.success).toBe(true);
                    expect(data.task.status).toBe('in-progress');
                    expect(data.task.title).toBe('Updated Title');
                    done();
                });
            });
        });

        it('should delete task via socket', (done) => {
            Task.create({
                ...generateTestTask(),
                createdBy: testUser._id
            }).then((task) => {
                clientSocket.emit('delete_task', { task_id: task._id.toString() });

                clientSocket.on('delete_request', async (data) => {
                    expect(data.success).toBe(true);

                    // Verify task was deleted from database
                    const deletedTask = await Task.findById(task._id);
                    expect(deletedTask).toBeNull();
                    done();
                });
            });
        });
    });

    describe('Notification Events', () => {
        beforeEach(async () => {
            await Notification.create({
                user: testUser._id,
                type: 'task_assigned',
                title: 'Test Notification',
                message: 'You have been assigned a task',
                read: false
            });
        });

        it('should get notifications via socket', (done) => {
            clientSocket.emit('get_notifications');

            clientSocket.on('get_request', (data) => {
                expect(data.success).toBe(true);
                expect(data.notifications).toBeDefined();
                expect(Array.isArray(data.notifications)).toBe(true);
                expect(data.notifications.length).toBeGreaterThan(0);
                done();
            });
        });
    });

    describe('Presence Tracking', () => {
        it('should broadcast activity updates', (done) => {
            const port = httpServer.address().port;
            const secondClient = io(`http://localhost:${port}`, {
                auth: { token: testToken }
            });

            Task.create({
                ...generateTestTask(),
                createdBy: testUser._id
            }).then((task) => {
                secondClient.on('connect', () => {
                    secondClient.emit('join_task', { task_id: task._id.toString() });

                    secondClient.once('join_request', () => {
                        secondClient.on('activity_update', (data) => {
                            expect(data.userId).toBeDefined();
                            expect(data.activity).toBe('typing');
                            expect(data.timestamp).toBeDefined();
                            secondClient.close();
                            done();
                        });

                        // First client emits activity
                        clientSocket.emit('join_task', { task_id: task._id.toString() });
                        clientSocket.once('join_request', () => {
                            clientSocket.emit('update_activity', {
                                type: 'typing',
                                currentTask: task._id.toString()
                            });
                        });
                    });
                });
            });
        });

        it('should get online users', (done) => {
            clientSocket.emit('get_online_users');

            clientSocket.on('online_users', (data) => {
                expect(data.users).toBeDefined();
                expect(Array.isArray(data.users)).toBe(true);
                done();
            });
        });
    });

    describe('Real-time Broadcasting', () => {
        it('should broadcast task updates to all clients in task room', (done) => {
            const port = httpServer.address().port;
            const secondClient = io(`http://localhost:${port}`, {
                auth: { token: testToken }
            });

            Task.create({
                ...generateTestTask(),
                createdBy: testUser._id
            }).then((task) => {
                secondClient.on('connect', () => {
                    // Both clients join the same task room
                    clientSocket.emit('join_task', { task_id: task._id.toString() });
                    secondClient.emit('join_task', { task_id: task._id.toString() });

                    let joinCount = 0;
                    const checkJoined = () => {
                        joinCount++;
                        if (joinCount === 2) {
                            // Second client listens for updates
                            secondClient.on('task_update', (data) => {
                                expect(data.message).toContain('updated');
                                expect(data.task.status).toBe('done');
                                secondClient.close();
                                done();
                            });

                            // First client updates the task
                            clientSocket.emit('update_task', {
                                task_id: task._id.toString(),
                                update_data: { status: 'done' }
                            });
                        }
                    };

                    clientSocket.once('join_request', checkJoined);
                    secondClient.once('join_request', checkJoined);
                });
            });
        });
    });
});
