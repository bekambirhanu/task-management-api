const app = require('./app.js');
const socketService = require('./socket');
const { PORT } = require('../envVars');



const server = app.listen(PORT, async () => {
    console.log(`HTTP server running on port: ${PORT}`);
    console.log("Websocket is ready for connections");

    // Initialize Socket.IO with Redis adapter
    await socketService.init(server);
})



// Sutdown gracefully
process.on("SIGTERM", async () => {
    console.log('SIGTERM received, shutting down gracefully');

    server.close(async () => {
        // Close Redis connections if they exist
        const { pubClient, subClient } = socketService;
        if (pubClient && subClient) {
            try {
                await Promise.all([
                    pubClient.quit(),
                    subClient.quit()
                ]);
                console.log('✅ Redis connections closed');
            } catch (error) {
                console.error('Error closing Redis connections:', error);
            }
        }
        console.log("Process terminated!")
    })
})

module.exports = server;