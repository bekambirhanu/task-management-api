const Task = require("../../models/Task")



module.exports = (io, socket) => {

    socket.on('join_task', async (taskId) => {
        const task_id = typeof(taskId) === String? JSON.parse(taskId).task_id: taskId.task_id;

        try {
            if(!task_id) {await io.to(socket.id).emit("join_request", {'message': 'no task provided!'})};

            const task = await Task.findById(task_id);

            if(task){
                await socket.join(`task_${task_id}`);
                console.log(`User ${socket.userId} joined task ${task._id}`);
                

                if(io.sockets.adapter.rooms?.get(`task_${task_id}`)?.has(socket.id)) {
                    await io.to(`task_${task_id}`).emit('join_request', {'message': `User ${socket.first_name} joined task`});
                }
                else {
                    await io.to(socket.id).emit("join_request", {'message': 'task not joined'});
                }
            } else{
                await io.to(socket.id).emit('error', {'message': "task doesn't exist"});

            }


        } catch(err) {
            await io.to(socket.id).emit('error', {"message": "failed to join task"});
            console.log(err)
        }
    });


    socket.on('leave_task', async (taskId) => {
        const task_id = typeof(taskId) === String? JSON.parse(taskId).task_id: taskId.task_id;

        await socket.leave(`task_${task_id}`);
        console.log(`User ${socket.userId} left room task_${task_id}`)
    });

    // Task create event
    socket.on('create_task', async (taskData) => {
        const task_data = typeof(taskData) === String? JSON.parse(taskData): typeof(taskData) === Object? taskData: null;
        if(task_data === null) return await socket.emit('create_request', {"message": "invalid task data"});

        try{
            const task = new Task({...taskData, createdBy: socket.userId});

            await task.save();

            if(task.assignedTo && task.assignedTo.length > 0) {
                task.assignedTo.forEach((userId) => {
                    io.to(`user_${userId}`).emit('task_assigned', {
                        "task": task,
                        "message": "You have been assigned to a new task"
                    }); 
                });
            }

            io.to(`task_${task._id}`).emit('create_request', {
                "task": task,
                "message": "A new task is created"
            });


    }catch(err) {
        console.log(`SocketError: ${err}`);
        io.to(socket.id).emit('error', {'message':`Internal Error, task unsuccessful`});
    }
    });
};