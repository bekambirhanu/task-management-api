const { createClient } = require('redis');
const { REDIS_URI } = require('../../envVars');

describe('Redis Integration', () => {
    let redisClient;
    let pubClient;
    let subClient;

    beforeAll(async () => {
        if (!REDIS_URI) {
            console.warn('REDIS_URI not configured, skipping Redis tests');
            return;
        }

        try {
            redisClient = createClient({
                url: REDIS_URI,
                socket: {
                    reconnectStrategy: false
                }
            });
            await redisClient.connect();
        } catch (error) {
            console.warn('Redis not available, skipping tests:', error.message);
        }
    });

    afterAll(async () => {
        if (redisClient && redisClient.isOpen) {
            await redisClient.disconnect();
        }
        if (pubClient && pubClient.isOpen) {
            await pubClient.disconnect();
        }
        if (subClient && subClient.isOpen) {
            await subClient.disconnect();
        }
    });

    describe('Redis Connection', () => {
        it('should connect to Redis server', async () => {
            if (!redisClient) {
                return;
            }

            expect(redisClient.isOpen).toBe(true);
        });

        it('should respond to PING command', async () => {
            if (!redisClient) {
                return;
            }

            const pong = await redisClient.ping();
            expect(pong).toBe('PONG');
        });

        it('should get server info', async () => {
            if (!redisClient) {
                return;
            }

            const info = await redisClient.info('server');
            expect(info).toContain('redis_version');
        });
    });

    describe('Redis Pub/Sub', () => {
        beforeEach(async () => {
            if (!REDIS_URI) {
                return;
            }

            try {
                pubClient = createClient({
                    url: REDIS_URI,
                    socket: {
                        reconnectStrategy: false
                    }
                });
                subClient = pubClient.duplicate();

                await Promise.all([
                    pubClient.connect(),
                    subClient.connect()
                ]);
            } catch (error) {
                console.warn('Could not create pub/sub clients:', error.message);
            }
        });

        it('should publish and subscribe to messages', (done) => {
            if (!pubClient || !subClient) {
                done();
                return;
            }

            const channel = 'test-channel';
            const message = 'Hello Redis!';

            subClient.subscribe(channel, (receivedMessage) => {
                expect(receivedMessage).toBe(message);
                done();
            });

            // Wait a bit for subscription to be ready
            setTimeout(() => {
                pubClient.publish(channel, message);
            }, 100);
        });

        it('should handle multiple subscribers', (done) => {
            if (!pubClient || !subClient) {
                done();
                return;
            }

            const channel = 'multi-test';
            const message = 'Broadcast message';
            let receivedCount = 0;

            const checkDone = () => {
                receivedCount++;
                if (receivedCount === 2) {
                    done();
                }
            };

            // First subscriber
            subClient.subscribe(channel, (msg) => {
                expect(msg).toBe(message);
                checkDone();
            });

            // Second subscriber (using duplicate)
            const sub2 = pubClient.duplicate();
            sub2.connect().then(() => {
                sub2.subscribe(channel, (msg) => {
                    expect(msg).toBe(message);
                    checkDone();
                });

                // Publish after both subscribed
                setTimeout(() => {
                    pubClient.publish(channel, message);
                }, 200);
            });
        });

        it('should handle Socket.IO adapter channels', (done) => {
            if (!pubClient || !subClient) {
                done();
                return;
            }

            const taskId = '507f1f77bcf86cd799439011';
            const channel = `socket.io#/#task_${taskId}#`;
            const eventData = JSON.stringify({
                type: 'task_update',
                data: { taskId, status: 'done' }
            });

            subClient.subscribe(channel, (message) => {
                const parsed = JSON.parse(message);
                expect(parsed.type).toBe('task_update');
                expect(parsed.data.taskId).toBe(taskId);
                done();
            });

            setTimeout(() => {
                pubClient.publish(channel, eventData);
            }, 100);
        });
    });

    describe('Redis Data Operations', () => {
        it('should set and get values', async () => {
            if (!redisClient) {
                return;
            }

            const key = 'test-key';
            const value = 'test-value';

            await redisClient.set(key, value);
            const retrieved = await redisClient.get(key);

            expect(retrieved).toBe(value);

            // Cleanup
            await redisClient.del(key);
        });

        it('should handle expiring keys', async () => {
            if (!redisClient) {
                return;
            }

            const key = 'expiring-key';
            const value = 'temporary';

            await redisClient.set(key, value, { EX: 1 }); // Expire in 1 second

            let retrieved = await redisClient.get(key);
            expect(retrieved).toBe(value);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));

            retrieved = await redisClient.get(key);
            expect(retrieved).toBeNull();
        });

        it('should handle hash operations', async () => {
            if (!redisClient) {
                return;
            }

            const hashKey = 'user:123';
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                role: 'user'
            };

            await redisClient.hSet(hashKey, userData);
            const retrieved = await redisClient.hGetAll(hashKey);

            expect(retrieved.name).toBe(userData.name);
            expect(retrieved.email).toBe(userData.email);
            expect(retrieved.role).toBe(userData.role);

            // Cleanup
            await redisClient.del(hashKey);
        });
    });

    describe('Redis Error Handling', () => {
        it('should handle connection errors gracefully', async () => {
            const badClient = createClient({
                url: 'redis://invalid-host:6379',
                socket: {
                    reconnectStrategy: false,
                    connectTimeout: 1000
                }
            });

            await expect(badClient.connect()).rejects.toThrow();
        });

        it('should handle invalid commands', async () => {
            if (!redisClient) {
                return;
            }

            // Try to get a non-existent key
            const result = await redisClient.get('non-existent-key');
            expect(result).toBeNull();
        });
    });

    describe('Socket.IO Adapter Integration', () => {
        it('should verify Redis clients for Socket.IO', async () => {
            if (!redisClient) {
                return;
            }

            const info = await redisClient.info('clients');
            expect(info).toContain('connected_clients');

            // Parse connected clients count
            const match = info.match(/connected_clients:(\d+)/);
            expect(match).toBeDefined();

            const clientCount = parseInt(match[1]);
            expect(clientCount).toBeGreaterThanOrEqual(1);
        });

        it('should handle room-based pub/sub', (done) => {
            if (!pubClient || !subClient) {
                done();
                return;
            }

            const userId = 'user123';
            const roomChannel = `socket.io#/#user_${userId}#`;
            const notification = {
                type: 'new_notification',
                title: 'Test Notification',
                message: 'You have a new notification'
            };

            subClient.subscribe(roomChannel, (message) => {
                const parsed = JSON.parse(message);
                expect(parsed.type).toBe('new_notification');
                expect(parsed.title).toBe(notification.title);
                done();
            });

            setTimeout(() => {
                pubClient.publish(roomChannel, JSON.stringify(notification));
            }, 100);
        });
    });
});
