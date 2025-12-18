const Task = require("../../models/Task");



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
        console.log(`User ${socket.userId} left room task_${task_id}`);
        await io.to(socket.id).emit('leave_request', {success: true, message: "successfully left the group"})
    });

    // Task create event
    socket.on('create_task', async (taskData) => {
        const task_data = taskData?typeof(taskData) === String? JSON.parse(taskData): taskData: null
        console.log(task_data);
        if(!task_data) return await io.to(`user_${socket.userId}`).emit('create_request', {success: false, message: "invalid task data"});
        if(task_data.assignedTo.length > 0 && socket.userRole === 'user')
            {return await io.to(`user_${socket.userId}`).emit('create_request', {success: false, message: "Forbidden: cannot assign task to users"})}
        try{
            const task = new Task({...taskData, createdBy: socket.userId});

            await task.save();

            if(task.assignedTo && task.assignedTo.length > 0) {
                task.assignedTo.forEach((userId) => {
                    io.to(`user_${userId}`).emit('task_assigned', {
                        message: "You have been assigned to a new task",
                        task: task
                    }); 
                });
            }

            io.to(`task_${task._id}`).to(`user_${socket.userId}`).emit('create_request', {
                success: true,
                message: "A new task is created",
                task: task
            });



    }catch(err) {
        console.log(`SocketError: ${err}`);
        io.to(socket.id).emit('error', {success: false, message:`Internal Error, task unsuccessful`});
    }
    });

    socket.on('update_task', async(data) => {
        if(!data.update_data) return await io.to(`user_${socket.userId}`).emit('update_request', {success: false, message: "no data provided!"});

        const update_data = typeof(data) === String? JSON.parse(data).update_data:data.update_data;

        if(update_data.assignedTo?.length > 0 && socket.userRole === 'user') return await io.to(`user_${socket.userId}`).emit('update_request', {success: false, message: "Forbidden: cannot assign task to users!"});

        const task_id = typeof(data) === String? JSON.parse(data).task_id:data.task_id;

        console.log(update_data);
        try {
            const latest_task = await Task.findByIdAndUpdate(task_id, {...update_data});

            if(!latest_task)
                { return io.to(`user_${socket.userId}`).emit('update_request', {success: false, message: "Task Not Found!"}); }

            if(latest_task.assignedTo.length > 0)
            {
                latest_task.assignedTo.forEach((user_id) => {
                    io.to(`user_${user_id}`).emit('task_update', {message: "task been updated", task: latest_task});
                });
            };

            io.to(`task_${task_id}`).to(`user_${socket.userId}`).emit('update_request', {success: true, message: "Task updated successfully", task: latest_task});



        } catch (error) {
            await io.to(`user_${socket.userId}`).emit('update_request', {success: false, message: "Internal Server Error, update unsuccessful"});
        }

    })

};