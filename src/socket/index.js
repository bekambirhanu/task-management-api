const socketIO = require('socket.io');
const { CLIENT_URL } = require('../../envVars');
const { socketAuth } = require('./middleware/socketAuth');
const taskHandlers = require('./socketHandlers/taskHandlers');
const userHandlers = require('./socketHandlers/userHandlers');


let io;

exports.init = (server) => {

    io = socketIO(server, {
        cors: {
            origin: CLIENT_URL | "0.0.0.0",
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeOut: 60000,
        pingInterval: 25000
    });

    // assign a socket auth middleware eg: io.use()
    io.use(socketAuth);
    

    io.on("connection", (socket) => {
        console.log(`User ${socket.userId} connected (Socket: ${socket.id})`);

        
        // Join user to their personal room
        socket.join(`user_${socket.userId}`);

        // Join user to role-based room
        socket.join(`role_${socket.userRole}`);

        taskHandlers(io, socket);
        userHandlers(io, socket);


        socket.on("disconnect", (reason) => {
            console.error(`socket error for user ${socket.userId}`, reason);
        });

        socket.on('error', (error) => {
            console.error(`Socket error for user ${socket.userId}`, error);
        })
        
    });

    exports.io = io;
    return io;

};

// Export to instance for use in controllers

exports.getIO = () => {
    if(!io) {
        throw new Error("Socket.io not initialized! Call init() first");
    }
    return io;
};
