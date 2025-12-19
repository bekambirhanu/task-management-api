const Task = require("../../models/Task");
const Notification = require('../../models/Notification');



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
        await io.to(`user_${socket.userId}`).emit('create_request', {message: "creating task ..."});
        const task_data = taskData?typeof(taskData) === String? JSON.parse(taskData): taskData: null
        console.log(task_data);
        if(!task_data) return await io.to(`user_${socket.userId}`).emit('create_request', {success: false, message: "invalid task data"});
        if(task_data.assignedTo.length > 0 && socket.userRole === 'user')
            {return await io.to(`user_${socket.userId}`).emit('create_request', {success: false, message: "Forbidden: cannot assign task to users"})}
        try{

            await io.to(`user_${socket.userId}`).emit('create_request', {
                success: true,
                message: "A new task is created",
            });

            const task = new Task({...taskData, createdBy: socket.userId});

            await task.save();

            if(task.assignedTo?.length > 0) {
                task.assignedTo.forEach((userId) => {
                    io.to(`user_${userId}`).emit('task_assigned', {
                        message: "You have been assigned to a new task",
                        task: task
                    }); 
                });
            }

            await io.to(`task_${task._id}`).to(`user_${socket.userId}`).emit('create_request', {
                success: true,
                message: "A new task is created",
                task: task
            });

            // Add to Notification DB

            if(task.assignedTo?.length > 0) {
                const notify = new Notification({
                    type: 'task_assigned',
                    title: "new task is created",
                    message: "new task is created and you are assigned",
                });

                task.assignedTo.forEach(async (user_id) => {
                    notify.user = user_id;
                    await notify.save();
                })
            }

    }catch(err) {
        console.log(`SocketError: ${err}`);
        await io.to(socket.id).emit('error', {success: false, message:`Internal Error, task unsuccessful`});
    }
    });

    socket.on('update_task', async(data) => {
        await io.to(`user_${socket.userId}`).emit('update_request', {message: "updating task..."});

        if(!data.update_data) return await io.to(`user_${socket.userId}`).emit('update_request', {success: false, message: "no data provided!"});

        const update_data = typeof(data) === String? JSON.parse(data).update_data:data.update_data;

        if(update_data.assignedTo?.length > 0 && socket.userRole === 'user') return await io.to(`user_${socket.userId}`).emit('update_request', {success: false, message: "Forbidden: cannot assign task to users!"});

        const task_id = typeof(data) === String? JSON.parse(data).task_id:data.task_id;

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

            // Add to Notification DB

            if(latest_task.assignedTo?.length > 0) {

                const notify = new Notification({
                    type: 'task_updated',
                    title: "Task has been updated",
                    message: "An existing task that you have been assigned has been updated"
                });

                latest_task.assignedTo.forEach( async (user_id) => {
                    notify.user = user_id;
                    await notify.save();
                })
            };


        } catch (error) {
            await io.to(`user_${socket.userId}`).emit('update_request', {success: false, message: "Internal Server Error, update unsuccessful"});
        }

    });

    socket.on('delete_task', async (data) => {
        await io.to(`user_${socket.userId}`).emit('update_request', {message: "deleting task..."});
        if(!data.task_id) return io.to(socket.userId).emit('delete_request', {success: false, message: "no task provided"})
        const task_id = type0f(data) === String? JSON.parse(data).task_id: data.task_id;
        try {

            io.to(socket.userId).emit('delete_request', {success: true, message: "request sent successfuly"});
            const task = await Task.findByIdAndDelete(task_id);

            // add to Notification DB

            if(latest_task.assignedTo?.length > 0) {

                const notify = new Notification({
                    type: 'system',
                    title: "Task has been removed",
                    message: "An existing task that you have been assigned has been terminated"
                });

                latest_task.assignedTo.forEach( async (user_id) => {
                    notify.user = user_id;
                    await notify.save();
                })
            };
        } catch(error) {
            io.to(socket.userId).emit('error', { message: "Internal Error delete unsucessful"});
        }
    })

};