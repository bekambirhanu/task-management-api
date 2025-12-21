const { io } = require('socket.io-client');


const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGYxMmRmZDkxNTQ3YjZmODJjMWQyYSIsImVtYWlsIjoibGFrZUBsYWtlbWFpbC5jb20iLCJmaXJzdF9uYW1lIjoibGFrZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzY2MzE4NTg2LCJleHAiOjE3NjY0MDQ5ODZ9.bt2EzRMfGyc_Y5hErs8Vx5gEnozgVuVe99T9duojI8I'


const client = io('http://localhost:3000',{
    auth: {
        token: `Bearer ${JWT_TOKEN}`
    }
});

client.on('connect', () => {
    console.log(client.id);


    // client.emit(...)
});


// client.on('chat_user', (data) => {
//     console.log(data);
// });

// client.on('update_request', (data) => {
// console.log(`create_data: ${JSON.stringify(data)}`);
// });

// client.on('task_update', (data) => {
//     console.log(`join_request: ${JSON.stringify(data)}`);
// });

// client.on('join_request', (data) => {
//     console.log(`join_request: ${JSON.stringify(data)}`);
// });


// client.on('chat_request', (data) => {
//     console.log(`join_request: ${JSON.stringify(data)}`);
// });

// client.on('error', (error) => {
//     console.log(`error: ${JSON.stringify(error)}`);
// });