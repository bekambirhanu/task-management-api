const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskSchema = new Schema({

    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    description: {
        type: String,
        required: true,
        maxlength: 1000
    },

    status: {
        type: String,
        enum: ['todo', 'in-progress', 'done'],
        required: true,
        default: 'todo'
    },

    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },

    dueDate: {
        type: Date,
        validate: {
            validator: function(date) {
                return date > new Date(); // due date must be in future!
            },
            message: 'Due date must be in future'
        }
    },

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    assignedTo: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
},{
    timestamps: true
});

 const Task = mongoose.model( 'Task', taskSchema);
 module.exports = Task;
