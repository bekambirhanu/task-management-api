const Notification = require('../models/Notification');
const { getIO, emitToUser, emitToRole } = require('../socket/index');


class NotificationService {

    static async createAndSend(notificationData) {

        try{
            const new_notification = new Notification(notificationData);

            await new_notification.save();

            await new_notification.populate('user', 'first_name last_name email');

            if(new_notification.relatedTask) {
                await new_notification.populate('relatedTask', 'title');
            }
            emitToUser(
                new_notification.user._id,
                'new_notification',
                new_notification
            );

            return new_notification;


        } catch (error) {
            console.error('Notification service error:', error);
            throw error;
        }
    
    };


    static async notifyTaskAssigned(userId, task, assignedBy) {

        return await this.createAndSend({
            user: userId,
            type: 'task_assigned',
            title: "New Task Assigned",
            message: `You have been assigned to task ${task.title}`,
            data: {
                taskId: task._id,
                assignedBy: assignedBy,
                priority: task.priority
            },
            relatedTask: task._id

        });
    };


    static async notifyTaskUpdated(userId, task, updatedBy, changes) {
        return await this.createAndSend({
            user: userId,
            type: 'task_updated',
            title: "Task Updated",
            message: `Task "${task.title}" has been updated`,
            data: {
                taskId: task._id,
                updatedBy: updatedBy,
                changes: changes
            },
            relatedTask: task._id
        });
    };

    static async getUserNotification(userId, limit=20) {
        const notifications = await Notification.find({user: userId})
                                .sort({createdAt: -1})
                                .limit(limit)
                                .populate('relatedTask', 'title')
                                .lean()
    }

    static async markAsRead(notificationId) {

        await Notification.findByIdAndUpdate(notificationId, {read: true});
        
    }
};

module.exports = NotificationService;