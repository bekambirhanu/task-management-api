const Task = require('../../models/Task');
const EmitEvents = require('../socket_events/EmitEvents');
const ListenEvents = require('../socket_events/ListenEvents');

module.exports = async (io, socket) => {

    socket.on(ListenEvents.USER_MESSAGE,async (data) => {
        const {
             receiverId,
             chat,
             taskId = null } = data;

        const task = taskId? await Task.findById(taskId): null;


        const isAdmin = socket.userRole === 'admin';
        const isManager = socket.userRole === 'manager';
        // If manager then check if the receiver is assigned to the task created by the manager
        const isInTheirTask = task? (task.createdBy.toString() === socket.userId.toString() && task.assignedTo.includes(receiverId)): false;
        const areInTask = task? (task.assignedTo.includes(receiverId) || task.createdBy.toString() === receiverId) && task.assignedTo.includes(socket.userId) : false;

        if(isAdmin || areInTask)
            { await io.to(`user_${receiverId}`).emit(EmitEvents.CHAT_USER, {"sender": `${socket.userRole}_${socket.first_name}`, "message": chat}); }

        else if(isManager && isInTheirTask)
            { await io.to(`user_${receiverId}`).emit(EmitEvents.CHAT_USER, {"sender": `${socket.userRole}_${socket.first_name}`,"message": chat}); console.log('manager') }
        
        else {
            if(!task)
                { await io.to(`user_${socket.userId}`).emit(EmitEvents.ERROR, "couldn't find task"); console.log('no task') }
            else
                { await io.to(`user_${socket.userId}`).emit(EmitEvents.ERROR, {"error": 'forbiden to chat with person in different task'}); console.log('forbidden') }
        }

    });
}