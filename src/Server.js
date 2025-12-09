const app = require('./app.js');
const socketService = require('./socket');
const { PORT } = require('../envVars');



const server = app.listen(PORT, () => {
    console.log(`HTTP server running on port: ${PORT}`);
    console.log("Websocket is ready for connections");
})


socketService.init(server);




// Sutdown gracefully
process.on("SIGTERM", () => {
    console.log('SIGTERM recerved, shutting down gracefully');

    server.close(() => {
        console.log("Process terminated!")
    })
})

module.exports = server;