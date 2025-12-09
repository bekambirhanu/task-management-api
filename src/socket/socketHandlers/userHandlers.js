const User = require('../../models/User');
const Task = require('../../models/Task')

module.exports = async (io, socket) => {

    socket.on('chat_user',async (data) => {
        const { receiverId, taskId, chat } = data;

        const task = await Task.findById(taskId);

        if(!task) {return socket.to(`user_${socket.userId}`).emit('error', "couldn't find task")}

        //check if both users are on the same task
        const areInTask = task.assignedTo.includes(receiverId) && task.assignedTo.includes(socket.userId);

        if(areInTask)
            { socket.to(`user_${receiverId}`).emit('chat_user', {"sender": `user_${socket.userId}`,"message": chat}) }
        else
            { socket.to(`user_${socket.userId}`).emit('error', 'forbiden to chat with person in different task') }


    });
}