const { validationResult } = require("express-validator");
const Task = require("../models/Task");
const User = require("../models/User");

exports.createTask = async (req, res) => {
    //validate data
    const error = validationResult(req);
    if(!error.isEmpty()) return res.status(400).json({success: false, error: error.array()});

try{
        const data = req.body;
        const userId = req.user.id;

        const valid_data = {
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority || 'medium',
            dueDate: data.dueDate || undefined,
            createdBy: userId,
            assignedTo: data.assignedTo || undefined
        }
        const new_task = new Task(valid_data);

        await new_task.save();
        return res.status(200).json({ success: true, message: "task created successfully", data: new_task })
    } catch(error) {
        console.log(error);
        res.status(500).json({success: false, error: error});
    }


};


// get a list of tasks for only those that are authorized
exports.getTask = async (req, res) => {
    try {
        const {
            status,
            priority,
            dueDate,
            deadline,
            assignedTo,
            skip,
            limit,
            sort= 'createdAt',
            order= 'desc'
        } = req.query;

        const filter = {};
        if(status) filter.status = status;
        if(priority) filter.priority = priority;
        if(dueDate) filter.dueDate = {$gte: new Date(dueDate)}; // for tasks that their deadline is far
        if(deadline) filter.dueDate = {$lte: new Date(deadline)}; // for tasks that their deadline is approaching
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
                                .populate({path: 'createdBy', select:['_id', 'email', 'first_name', 'last_name', 'role']})
                                .populate({path:'assignedTo', select:['_id', 'email', 'first_name', 'last_name', 'role']});
        
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

    try {    await Task.findByIdAndUpdate(targetId, valid_data).then((result) => {
                res.status(200).json({success: true, message: "task modified successfully", data: result});
            });
        } catch(error) {
            console.log({Error: error});
            res.status(500).json({success: false, message: "Internal server error"});
        }

};

// Delete Operation
exports.deleteTask = async (req, res) => {

    try {
        if(req.task) {
            await Task.findByIdAndDelete(req.task._id).exec();
            return res.status(200).json({success: true, message: 'task deleted successfully'})
            
        }
    } catch(error) {
        console.log(error);
        return res.status(500).json({success: false, message: 'Internal server error'});
    } 


}

// Assign/ Deassign Operation
exports.assignDeassignTask = async (req, res) => {

    //validate the taskId and the userId from the query
    const error = validationResult(req);
    if(!error.isEmpty()) return res.status(400).json({success: false, error: error.array()});


    const taskId = req.query.taskId;
    const userId = req.query.userId;
    const type = req.query.type || "assign";

    try{
        // check if the task and the user exists
        const task = await Task.findOne({_id: taskId});
        const user = await User.findOne({_id: userId});
        const isAssignedAlready = task.assignedTo.includes(userId);

        if(!user || !task) return res.status(400).json({success: false, message: 'update failed. unknown task or user!'});

        // To deassign an existing user 
        if(type === "deassign") {
            if(!isAssignedAlready) return res.status(404).json({success: false, message: "User is not assigned"});
            await Task.updateOne(
                {_id: taskId}, 
                {$pull: {assignedTo: userId}}
            ).then((result) => {
                return res.status(200).json({success: true, message: "user deassigned successfully"});
            });
        };







        if(isAssignedAlready) return res.status(400).json({success: false, message: 'update failed. User is already assigned!'});

            await Task.updateOne({_id: taskId}, { $addToSet: { assignedTo: { $each: [ userId ] } } }, {new: true}).then((result) => {
                return res.status(200).json({success: true, message: 'Task successfully updated', data: result});
            });

        return res.status(404).json({success: false, message: 'Task Not found'});
    } catch(error) {
        console.log(error);
        res.status(500).json({success: false, message: 'Internal server error'});
    }
}

// Deassign


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
    res.status(500).send("migration failed");
}
}