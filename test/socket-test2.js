const { io } = require('socket.io-client');
const ListenEvents = require('../src/socket/socket_events/ListenEvents');
const EmitEvents = require('../src/socket/socket_events/EmitEvents');

// manager
const JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTMzYWNhYmU5NWMzMWNhYWFlMDQxOCIsImVtYWlsIjoibWFuYWdlckBtYW5hZ2VybWFpbC5jb20iLCJmaXJzdF9uYW1lIjoibWFuYWdlciIsInJvbGUiOiJtYW5hZ2VyIiwiaWF0IjoxNzY2NDk4ODE4LCJleHAiOjE3NjY1ODUyMTh9.BPTUvo8NE5voLt165OTTNPcHtZOz9fFsCpP7HFkYxAg";


const client = io('http://localhost:3000',{
    auth: {
        token: `Bearer ${JWT_TOKEN}`
    }
});

client.on('connect', async () => {
    console.log(client.id);
// to 
    client.emit(ListenEvents.JOIN_TASK, {
        // receiverId: '690f12dfd91547b6f82c1d2a',
        // chat: 'hello lake?',
        task_id: "6937d722c55814514ba651e9"
    });
})




client.on(EmitEvents.CHAT_USER, (data) => {
    console.log(data);
})

client.on(EmitEvents.JOIN_REQUEST, (data) => {
    console.log(data)
})
client.on(EmitEvents.ERROR, (error) => {
    console.log(`error: ${JSON.stringify(error)}`);
});