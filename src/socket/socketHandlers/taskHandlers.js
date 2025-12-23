const Task = require("../../models/Task");
const Notification = require('../../models/Notification');
const EmitEvents = require("../socket_events/EmitEvents");
const ListenEvents = require("../socket_events/ListenEvents");



module.exports = (io, socket) => {

    socket.on(ListenEvents.JOIN_TASK, async (taskId) => {
        const task_id = typeof(taskId) === String? JSON.parse(taskId).task_id: taskId.task_id;

        try {
            if(!task_id) {await io.to(socket.id).emit(EmitEvents.JOIN_REQUEST, {'message': 'no task provided!'})};

            const task = await Task.findById(task_id);

            if(task){
                await socket.join(`task_${task_id}`);
                console.log(`User ${socket.userId} joined task ${task._id}`);
                

                if(io.sockets.adapter.rooms?.get(`task_${task_id}`)?.has(socket.id)) {
                    await io.to(`task_${task_id}`).emit(EmitEvents.JOIN_REQUEST, {'message': `User ${socket.first_name} joined task`});
                }
                else {
                    await io.to(socket.id).emit(EmitEvents.JOIN_REQUEST, {'message': 'task not joined'});
                }
            } else{
                await io.to(socket.id).emit(EmitEvents.ERROR, {'message': "task doesn't exist"});

            }


        } catch(err) {
            await io.to(socket.id).emit(EmitEvents.ERROR, {"message": "failed to join task"});
            console.log(err)
        }
    });


    socket.on(ListenEvents.LEAVE_TASK, async (taskId) => {
        const task_id = typeof(taskId) === String? JSON.parse(taskId).task_id: taskId.task_id;

        await socket.leave(`task_${task_id}`);
        console.log(`User ${socket.userId} left room task_${task_id}`);
        await io.to(socket.id).emit(EmitEvents.LEAVE_REQUEST, {success: true, message: "successfully left the group"})
    });

    // Task create event
    socket.on(ListenEvents.CREATE_TASK, async (taskData) => {
        await io.to(`user_${socket.userId}`).emit(EmitEvents.CREATE_REQUEST, {message: "creating task ..."});
        const task_data = taskData?typeof(taskData) === String? JSON.parse(taskData): taskData: null
        console.log(task_data);
        if(!task_data) return await io.to(`user_${socket.userId}`).emit(EmitEvents.CREATE_REQUEST, {success: false, message: "invalid task data"});
        if(task_data.assignedTo.length > 0 && socket.userRole === 'user')
            {return await io.to(`user_${socket.userId}`).emit(EmitEvents.CREATE_REQUEST, {success: false, message: "Forbidden: cannot assign task to users"})}
        try{

            await io.to(`user_${socket.userId}`).emit(EmitEvents.CREATE_REQUEST, {
                success: true,
                message: "A new task is created",
            });

            const task = new Task({...taskData, createdBy: socket.userId});

            await task.save();

            if(task.assignedTo?.length > 0) {
                task.assignedTo.forEach((userId) => {
                    io.to(`user_${userId}`).emit(EmitEvents.TASK_ASSIGNED, {
                        message: "You have been assigned to a new task",
                        task: task
                    }); 
                });
            }

            await io.to(`task_${task._id}`).to(`user_${socket.userId}`).emit(EmitEvents.CREATE_REQUEST, {
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
        await io.to(socket.id).emit(EmitEvents.ERROR, {success: false, message:`Internal Error, task unsuccessful`});
    }
    });

    socket.on(ListenEvents.UPDATE_TASK, async(data) => {
        await io.to(`user_${socket.userId}`).emit(EmitEvents.UPDATE_REQUEST, {message: "updating task..."});

        if(!data.update_data) return await io.to(`user_${socket.userId}`).emit(EmitEvents.UPDATE_REQUEST, {success: false, message: "no data provided!"});

        const update_data = typeof(data) === String? JSON.parse(data).update_data:data.update_data;

        if(update_data.assignedTo?.length > 0 && socket.userRole === 'user') return await io.to(`user_${socket.userId}`).emit(EmitEvents.UPDATE_REQUEST, {success: false, message: "Forbidden: cannot assign task to users!"});

        const task_id = typeof(data) === String? JSON.parse(data).task_id:data.task_id;

        try {
            const latest_task = await Task.findByIdAndUpdate(task_id, {...update_data});

            if(!latest_task)
                { return io.to(`user_${socket.userId}`).emit(EmitEvents.UPDATE_REQUEST, {success: false, message: "Task Not Found!"}); }

            if(latest_task.assignedTo.length > 0)
            {
                latest_task.assignedTo.forEach((user_id) => {
                    io.to(`user_${user_id}`).emit(EmitEvents.TASK_UPDATE, {message: "task been updated", task: latest_task});
                });
            };

            io.to(`task_${task_id}`).to(`user_${socket.userId}`).emit(EmitEvents.UPDATE_REQUEST, {success: true, message: "Task updated successfully", task: latest_task});

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
            await io.to(`user_${socket.userId}`).emit(EmitEvents.UPDATE_REQUEST, {success: false, message: "Internal Server Error, update unsuccessful"});
        }

    });

    socket.on(ListenEvents.DELETE_TASK, async (data) => {
        await io.to(`user_${socket.userId}`).emit(EmitEvents.DELETE_REQUEST, {message: "deleting task..."});
        if(!data.task_id) return io.to(socket.userId).emit(EmitEvents.DELETE_REQUEST, {success: false, message: "no task provided"})
        const task_id = type0f(data) === String? JSON.parse(data).task_id: data.task_id;
        try {

            io.to(socket.userId).emit(EmitEvents.DELETE_REQUEST, {success: true, message: "request sent successfuly"});
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
            io.to(socket.userId).emit(EmitEvents.ERROR, { message: "Internal Error delete unsucessful"});
        }
    })

};