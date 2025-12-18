//const { io } = require('socket.io-client');


//const JWT_TOKEN = <jwt-token>


// const client = io('http://localhost:3000',{
//     auth: {
//         token: `Bearer ${JWT_TOKEN}`
//     }
// });

// client.on('connect', () => {
//     console.log(client.id);


//     // client.emit(...)
// });


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