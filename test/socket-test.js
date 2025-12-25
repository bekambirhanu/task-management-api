const { io } = require('socket.io-client');
const ListenEvents = require('../src/socket/socket_events/ListenEvents');
const EmitEvents = require('../src/socket/socket_events/EmitEvents');
const { json } = require('express');
// lake
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTMzYTM0YmU5NWMzMWNhYWFlMDQxNSIsImVtYWlsIjoiYWRtaW5AYWRtaW5tYWlsLmNvbSIsImZpcnN0X25hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NjU4NTI1OSwiZXhwIjoxNzY2NjcxNjU5fQ.LmdtjfgBVR9JdSU2hKLtugqEnYnnY7UjYqd6w61WpN0'


// admin: 69133a34be95c31caaae0415

const client = io('http://localhost:3000',{
    auth: {
        token: `Bearer ${JWT_TOKEN}`
    }
});

client.on('connect', async() => {
    console.log(client.id);

    client.emit(ListenEvents.JOIN_TASK, {task_id: "694a915d69fc7a280312801e"} );

    // client.emit(ListenEvents.CHECK_USER_STATUS, {user_id: "69133acabe95c31caaae0418"})

    // client.emit(ListenEvents.GET_ONLINE_USERS);


});



client.on(EmitEvents.JOIN_REQUEST, (data) => {
    console.log(data);
})

client.on(EmitEvents.LEAVE_REQUEST, (data) => {
    console.log(data)
})

client.on(EmitEvents.USER_STATUS, (data) => {
    console.log(data)
})

client.on(EmitEvents.ONLINE_USERS, (data) => {
    console.log(data)
})
client.on(EmitEvents.CHAT_USER, (data) => {
    console.log(data);
     client.emit(ListenEvents.USER_MESSAGE, {
        receiverId: "69133acabe95c31caaae0418", 
        chat: "hello manager! how are you", 
        taskId: "6937d722c55814514ba651e9"
    });
});

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

client.on(EmitEvents.ERROR, (error) => {
    console.log(error);
});