const { validationResult } = require("express-validator");
const Task = require("../models/Task");

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
    } catch(error) {

        console.log(error);
        res.status(500).json({success: false, error: error});
    }


};

exports.getTask = async (req, res) => {
    
}