const Task = require('../models/Task');

// Check if user can modify a task
exports.canModifyTask = async (req, res, next) => {
    try {
        const taskId = req.params.id || req.params.task_id;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Find the task
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Authorization logic
        const isOwner = task.createdBy.toString() === userId;
        const isAssigned = task.assignedTo.includes(userId);
        const isAdmin = userRole === 'admin';
        const isManager = userRole === 'manager';

        // Permission rules
        if (isOwner || isAdmin) {
            // Owners and Admins can do anything with their tasks
            req.taskId = taskId;
            return next();
        }

        if (isManager && (isAssigned || isOwner)) {
            // Managers can modify tasks they're assigned to or created
            req.taskId = taskId;
            return next();
        }

        // Regular users can only modify tasks they created
        if (isOwner) {
            req.taskId = taskId;
            return next();
        }
        return res.status(403).json({
            success: false,
            message: 'Access denied. You do not have permission to modify this task.'
        });

    } catch (error) {
        console.error('Authorization error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authorization'
        });
    }
};

exports.canDeleteTask = async (req, res, next) => {

    const taskId = req.params.id || req.params.task_id;
    const userId = req.user.id;
    const userRole = req.user.role;

    try{
        const task = await Task.findById(taskId);

        if(!task) return res.status(404).json({success: false, message: 'task not found'});

        const isAdmin = userRole === 'admin';
        const isManager = userRole === 'manager';
        const isAssigned = task.assignedTo.includes(userId);
        const isOwner = task.createdBy.toString() === userId;

        if(isOwner || isAdmin){
            req.task = task;
            return next();
        }
        //if its a manager, only if its assigned to or his own tasks
        if(isManager && (isAssigned || task.createdBy.toString() === userId)) {
            req.task = task;
            return next();
        }
        return res.status(403).json({success: false, message: 'You don`t have authority over this task'});

    } catch(error) {
        console.log(error);
        res.status(500).json({success: false, message: 'Internal server error'});
    }

}

exports.canAssignTask = async (req, res, next) => {
    try{
        const userId = req.user.id;
        const userRole = req.user.role;
        const taskId = req.query.taskId;  //new ObjectId.createFromHexString(req.query.taskId);
        const task = await Task.findOne({_id: taskId});
        if(!task) {console.log(task);return res.status(404).json({success: false, message: 'Task doesn`t exist'});}

        const isAdmin = userRole === 'admin';
        const isManager = userRole === 'manager';
        const isOwner = userId === task.createdBy._id.toString();
        if(isAdmin) {
            req.task = task;
            return next();
        }
        else if(isManager && isOwner) {
            req.task = task;
            return next();
        }
        else if(isManager && !isOwner) {
            return res.status(403).json({success: false, message: "Unauthorized task for manager"});
        }
        else {
            return res.status(403).json({success: false, message: "Unauthorized request!"});
        }
    } catch(error) {
        console.log(error);
        return res.status(500).json({seccess: false, message: 'Internal server error'});
    }


}

// for a general role based access
exports.requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
        }
        next();
    };
};
