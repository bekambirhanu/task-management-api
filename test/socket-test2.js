const { io } = require('socket.io-client');

// admin
const JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTMzYTM0YmU5NWMzMWNhYWFlMDQxNSIsImVtYWlsIjoiYWRtaW5AYWRtaW5tYWlsLmNvbSIsImZpcnN0X25hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NjA0NTA2NCwiZXhwIjoxNzY2MTMxNDY0fQ.GCjQJ9Gtqn7GS8b8bvsv_3cvLcrRfDWWWAjq-u5pf8g";


const client = io('http://localhost:3000',{
    auth: {
        token: `Bearer ${JWT_TOKEN}`
    }
});

client.on('connect', () => {
    console.log(client.id);
// to boogie
    client.emit("get_notifications");
})

client.on('get_request', (data) => {
    console.log(data);
})

client.on('error', (error) => {
    console.log(`error: ${JSON.stringify(error)}`);
});