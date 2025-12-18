const { io } = require('socket.io-client');

// lake
const JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGYxMmRmZDkxNTQ3YjZmODJjMWQyYSIsImVtYWlsIjoibGFrZUBsYWtlbWFpbC5jb20iLCJmaXJzdF9uYW1lIjoibGFrZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzY2MDQ1ODczLCJleHAiOjE3NjYxMzIyNzN9.83aJsC0Svl5rQdJfmsVVi4QFliiSeY6nwXPse3byA74";


const client = io('http://localhost:3000',{
    auth: {
        token: `Bearer ${JWT_TOKEN}`
    }
});

client.on('connect', () => {
    console.log(client.id);

    //client.emit("join_task", {"task_id": "6937d722c55814514ba651e9"});
})


client.on('chat_user', (data) => {
    console.log(data);
});

client.on('create_request', (data) => {
console.log(`create_data: ${data}`);
});


client.on('join_request', (data) => {
    console.log(`join_request: ${JSON.stringify(data)}`);
});

client.on('error', (error) => {
    console.log(`error: ${error}`);
});