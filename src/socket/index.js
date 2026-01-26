const socketIO = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const { CLIENT_URL, REDIS_URI } = require('../../envVars');
const { socketAuth } = require('./middleware/socketAuth');
const taskHandlers = require('./socketHandlers/taskHandlers');
const userHandlers = require('./socketHandlers/userHandlers');
const notificationHandlers = require('./socketHandlers/notificationHandlers');
const presenceHandlers = require('./socketHandlers/presenceHandlers');
const ListenEvents = require('./socket_events/ListenEvents');


let io;
let pubClient;
let subClient;

exports.init = async (server) => {

    io = socketIO(server, {
        cors: {
            origin: CLIENT_URL | "0.0.0.0",
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeOut: 60000,
        pingInterval: 25000
    });

    // Initialize Redis clients for pub/sub
    if (REDIS_URI) {
        try {
            pubClient = createClient({
                url: REDIS_URI,
                socket: {
                    reconnectStrategy: false // Disable automatic reconnection
                }
            });
            subClient = pubClient.duplicate();

            // Error handling for Redis clients
            pubClient.on('error', (err) => {
                console.error('Redis Pub Client Error:', err.message);
            });

            subClient.on('error', (err) => {
                console.error('Redis Sub Client Error:', err.message);
            });

            // Connect Redis clients
            await Promise.all([pubClient.connect(), subClient.connect()]);

            // Configure Socket.IO to use Redis adapter
            io.adapter(createAdapter(pubClient, subClient));

            console.log('✅ Redis adapter connected successfully');
        } catch (error) {
            console.error('❌ Failed to connect Redis adapter:', error.message);
            console.log('⚠️  Socket.IO will run without Redis (single instance mode)');

            // Clean up failed clients
            if (pubClient) {
                try { await pubClient.disconnect(); } catch (e) { /* ignore */ }
            }
            if (subClient) {
                try { await subClient.disconnect(); } catch (e) { /* ignore */ }
            }
            pubClient = null;
            subClient = null;
        }
    } else {
        console.log('⚠️  REDIS_URI not configured. Socket.IO running in single instance mode.');
    }

    // assign a socket auth middleware eg: io.use()
    io.use(socketAuth);


    io.on(ListenEvents.CONNECTION, (socket) => {
        console.log(`User ${socket.userId} connected (Socket: ${socket.id})`);


        // Join user to their personal room
        socket.join(`user_${socket.userId}`);

        // Join user to role-based room
        socket.join(`role_${socket.userRole}`);

        taskHandlers(io, socket);
        userHandlers(io, socket);
        notificationHandlers(io, socket);
        presenceHandlers(io, socket);


        socket.on(ListenEvents.DISCONNECT, (reason) => {
            console.error(`socket error for user ${socket.userId}`, reason);
        });

    });

    exports.io = io;
    return io;

};

// Export to instance for use in controllers

exports.getIO = () => {
    if (!io) {
        throw new Error("Socket not initialized! Call init() first");
    }
    return io;
};


exports.emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
    }
};

exports.emitToTask = (taskId, event, data) => {
    if (io) {
        io.to(`task_${taskId}`).emit(event, data);
    }
};

exports.emitToRole = (role, event, data) => {
    if (io) {
        io.to(`role_${role}`).emit(event, data);
    }
};

// Export Redis clients for graceful shutdown
exports.pubClient = pubClient;
exports.subClient = subClient;
