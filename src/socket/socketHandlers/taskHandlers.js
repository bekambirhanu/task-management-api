const Task = require("../../models/Task")


module.exports = (io, socket) => {

    socket.on('join_task', async (taskId) => {
        try {
            if(!taskId) {socket.to(`user_${socket.userId}`).emit(json({'message': 'no task provided!'}))}
            
            const task = Task.findOne(
                {
                    _id: (taskId)
                }
            )

            if(task){
                socket.join(`task_${taskId}`);
                console.log(`User ${socket.userId} joined task ${taskId}`);

                socket.to(`user_${socket.userId}`).emit('task_join', {'message': "task joined"});
            } else{
                socket.to(`user_${socket.userId}`).emit('error', {'message': "task doesnt exist"});

            }


        } catch(err) {
            socket.on(`user_${socket.userId}`).emit('error', {"message": "failed to join task"});
        }
    });


    socket.on('leave_task', (taskId) => {
        socket.leave(`task_${taskId}`);
    });

    // Task create event
    socket.on('create_task', async (taskData) => {
        try{
            const task = new Task({...taskData, createdBy: socket.userId});

            await task.save();

            if(task.assignedTo && task.assignedTo.length > 0) {
                task.assignedTo.forEach((userId) => {
                    socket.to(`user_${userId}`).emmit('new_task_assigned', {
                        "task": task,
                        "message": "You have been assigned to a new task"
                    }); 
                });
            }

            socket.to(`task_${task._id}`).emit('task_created', {
                "task": task,
                "message": "A new task is created"
            });


    }catch(err) {
        console.log(`SocketError: ${err}`);
        socket.to(`user_${socket.userId}`).emit('error', {'message':`Internal Error, task unsuccessful`});
    }
    });
};