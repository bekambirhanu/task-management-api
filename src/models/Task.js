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

    assignedTo: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        unique: true
    },

    attachments: [{
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        url: String,
        uploadedBy: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    totalStorageUsed: {
        type: Number,
        default: 0
    }

},{
    timestamps: true
});

taskSchema.static.MAX_STORAGE_PER_TASK = 100*1024*1024; // 100MB

 const Task = mongoose.model( 'Task', taskSchema);
 module.exports = Task;
