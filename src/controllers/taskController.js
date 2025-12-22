const { validationResult } = require("express-validator");
const Task = require("../models/Task");
const User = require("../models/User");
const NotificationSerivice = require("../services/NotificationSerivices");
const { getIO, emitToTask } = require("../socket");
const { Socket } = require("socket.io");

exports.createTask = async (req, res) => {
    //validate data
    const error = validationResult(req);
    if(!error.isEmpty()) return res.status(400).json({success: false, error: error.array()});

try{
        const data = req.body;
        const issuedUserId = req.user.id;

        const valid_data = {
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority || 'medium',
            dueDate: data.dueDate || undefined,
            createdBy: issuedUserId,
            assignedTo: data.assignedTo || undefined
        }
        const new_task = new Task(valid_data);

        await new_task.save();
        // notify all the assigned users if any
        if(new_task.assignedTo && new_task.assignedTo.length > 0) {
            new_task.assignedTo.forEach(async user_id => {
                NotificationSerivice.notifyTaskAssigned(user_id, new_task, req.user.first_name);
            })
        }
        return res.status(200).json({ success: true, message: "task created successfully", data: new_task })
    } catch(error) {
        console.log(error);
        res.status(500).json({success: false, error: error});
    }
};


// get a list of tasks for only those that are authorized
exports.getTask = async (req, res) => {
    try {
        // Data filtering
        const {
            status,
            priority,
            dueDate,
            deadline,
            assignedTo,
            skip,
            limit,
            afterDate,
            beforeDate
        } = req.query;

        const filter = {};
        if(status) filter.status = status;
        if(priority) filter.priority = priority;
        if(dueDate) filter.dueDate = {$gte: new Date(dueDate)}; // for tasks that their deadline is far
        if(deadline) filter.dueDate = {$lte: new Date(deadline)}; // for tasks that their deadline is approaching
        if(afterDate || beforeDate) filter.createdAt = {$gt: afterDate&& new Date(afterDate), $lt: beforeDate&& new Date(beforeDate)};
        if(assignedTo) filter.assignedTo = assignedTo;

        const options = {};
        if(skip) options.skip = skip;
        if(limit) options.limit = limit;


        if(req.user.role != 'admin') {
            filter.$or = [
                {createdBy: req.user.id},
                {assignedTo: req.user.id}
            ]
        }

        const data = await Task.find(filter)
                                .populate([
                                    {path: 'createdBy', select:'_id email first_name last_name role'},
                                    {path:'assignedTo', select:'_id email first_name last_name role'}
                                ])
                                .sort({createdAt: -1})
                                .skip(options.skip)
                                .limit(options.limit)

            const io = getIO();

            io.to(`task_${data._id}`).emit('user_viewing', {
                userId: req.user.id,
                action: 'viewing'
            });
         return res.status(200).send(data);
        
    } catch(error) {
        console.log(error);
        res.status(500).json({ success: false, error: error });
    }
};

// Modify(Update) Operation
exports.modifyTask = async (req, res) => {

    // Validate the request data
    const error = validationResult(req);
    if(!error.isEmpty()) return res.status(400).json({success: false, error: error.array()})

    const canModify = ['title', 'description', 'status', 'priority', 'dueDate'];
    const targetId = req.taskId;
    const requestData = req.body;

    const valid_data = {};
    canModify.forEach(element => {
        if(requestData[element]) valid_data[element] = requestData[element];
    });

    try {    
            const new_task = await Task.findByIdAndUpdate(targetId, valid_data);

            if(!new_task) return res.status(500).json({success: false, message: "Internal Error: request unsuccessfully"});
            io.to(`task_${new_task._id}`).emit('task_updated', {
                task: new_task,
                updatedBy: req.user.id,
                changes: valid_data,
                timestamp: new Date()
            });

            // Notify users
            NotificationSerivice.notifyTaskUpdated(req.user.id, result, req.user.id, valid_data);

            if(new_task.assignedTo && new_task.assignedTo.length > 0){
                new_task.assignedTo.forEach(async user => {
                    NotificationSerivice.notifyTaskUpdated(user, new_task, req.user.first_name, valid_data);
                });
            }
            const io = getIO();


            return res.status(200).json({success: true, message: "task modified successfully"});

        } catch(error) {
            console.log({Error: error});
            return res.status(500).json({success: false, message: "Internal server error"});
        }

};

// Delete Operation
exports.deleteTask = async (req, res) => {

    try {
        if(req.task) {
            await Task.findByIdAndDelete(req.task._id).exec();
            return res.status(200).json({success: true, message: 'task deleted successfully'});
            
        }
    } catch(error) {
        console.log(error);
        return res.status(500).json({success: false, message: 'Internal server error'});
    }


}

// Assign/Deassign Operation
exports.assignDeassignTask = async (req, res) => {

    //validate the taskId and the issuedUserId from the query
    const error = validationResult(req);
    if(!error.isEmpty()) return res.status(400).json({success: false, error: error.array()});


    const taskId = req.query.taskId;
    const issuedUserId = req.query.userId;
    const type = req.query.type || "assign";

    try{
        // check if the task and the user exists
        const task = await Task.findOne({_id: taskId});
        const user = await User.findOne({_id: issuedUserId});
        const isAssignedAlready = task.assignedTo.includes(issuedUserId);

        if(!user || !task) return res.status(400).json({success: false, message: 'update failed. unknown task or user!'});

        // To deassign an existing user 
        if(type === "deassign") {
            if(!isAssignedAlready) return res.status(404).json({success: false, message: "User is not assigned"});
            await Task.updateOne(
                {_id: taskId}, 
                {$pull: {assignedTo: issuedUserId}}
            ).then((result, err) => {
                if(err) return res.status(500).json({success: false, message: "Internal Error: request unsuccessfully"});

                // Notify IssuedUser
                NotificationSerivice.createAndSend({
                    user: issuedUserId,
                    type: 'mension',
                    title: "Deassigned from task",
                    message: `You have been deassigned from task: ${task.title}`,
                    data: {
                        taskId: task._id,
                        deassignedBy: req.user.first_name,
                        priority: task.priority
                    },
                    relatedTask: task._id
                });

                return res.status(200).json({success: true, message: "user deassigned successfully"});
            });
        };

        if(isAssignedAlready) return res.status(400).json({success: false, message: 'update failed. User is already assigned!'});

           const updated_task = await Task.updateOne({_id: taskId}, { $addToSet: { assignedTo: { $each: [ issuedUserId ] } } }, {new: true});
           // Notify User
            if(updated_task.acknowledged){
                NotificationSerivice.notifyTaskAssigned(issuedUserId, task, user.first_name);
                return res.status(200).json({success: true, message: 'Task successfully updated', data: result});
           }
        return res.status(404).json({success: false, message: 'Task Not found'});

        
    } catch(error) {
        console.log(error);
        res.status(500).json({success: false, message: 'Internal server error'});
    }
}

exports.updateTypingStatus = async (req, res) => {
    const { taskId, isTyping } = req.body;
    const userId = req.user.id;

    try{

        const io = getIO();
        
        io.to(`task_${taskId}`).emit('user_typing', {
            userId: userId,
            isTyping: isTyping,
            timestamp: new Date()
        });

        return res.status(200).json({success: true, message: "status updated successfully"})

    } catch(error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Internal Error"});
    }
}

// Bulk data migration controller
exports.bulkTask = async (req, res) => {

    const bulk_data = req.body;
    try {
    await bulk_data.forEach(element => {
        let new_task = new Task(element);
        new_task.save();
    });
    return res.status(200).json({success: true, message: "data migrated successfully"})

}catch(error) {
    console.log(error);
    res.status(500).send("Internal Error: migration failed");
}
}