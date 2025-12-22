const PresenceService = require('../../services/PresenceServices');


module.exports = (io, socket) => {
    
    PresenceService.userConnected(socket.userId, socket.id);

    socket.on('update_activity', (activities) => {
        PresenceService.updateActivities(activities, socket.userId);
        
        if(activities.currentTask) {
            socket.broadcast.to(`task_${activities.currentTask}`).emit('update_activity', {
                userId: socket.userId,
                activity: activities.type,
                timestamp: new Date()
            });
        }
    
    });


    socket.on('get_online_users', () => {
        const online_users = PresenceService.getOnlineUsers();

        socket.emit('online_users', {users: online_users});
    });

    socket.on('check_user_status', (userId) => {
        const isOnline = PresenceService.isUserOnline(userId);
        const activities = PresenceService.getUserActivities(userId);

        socket.to(`user_${socket.userId}`).emit('user_status', {
            userId: userId,
            isOnline: isOnline,
            activities: activities
        });
    });


    socket.on('disconnect', () => {
        PresenceService.userDisconnected(socket.id, socket.userId);
    });
}