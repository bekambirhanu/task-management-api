const mongoose = require('mongoose');
const { Schema } = mongoose;


const notificationSchema = new Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },

    type: {
        type: String,
        enum: ['task_assigned', 'task_updated', 'mension', 'system'],
        required: true
    },

    title: {
        type: String,
        required: true
    },

    message: String,

    data: mongoose.Schema.Types.Mixed,

    read: {
        type: Boolean,
        default: false
    },

    relatedTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }
},
    {timestamps: true}
);


const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;