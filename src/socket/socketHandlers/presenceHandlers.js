const PresenceService = require('../../services/PresenceServices');
const EmitEvents = require('../socket_events/EmitEvents');
const ListenEvents = require('../socket_events/ListenEvents');


module.exports = (io, socket) => {
    
    PresenceService.userConnected(socket.userId, socket.id);

    socket.on(ListenEvents.UPDATE_ACTIVITY, (activities) => {
        PresenceService.updateActivities(activities, socket.userId);
        
        if(activities.currentTask) {
            socket.broadcast.to(`task_${activities.currentTask}`).emit(EmitEvents.ACTIVITY_UPDATE, {
                userId: socket.userId,
                activity: activities.type,
                timestamp: new Date()
            });
        }
    
    });


    socket.on(ListenEvents.GET_ONLINE_USERS, () => {
        const online_users = PresenceService.getOnlineUsers();

        socket.emit(EmitEvents.ONLINE_USERS, {users: online_users});
    });

    socket.on(ListenEvents.CHECK_USER_STATUS, (userId) => {
        if(!userId.user_id) return socket.to(`user_${socket.userId}`).emit(EmitEvents.ERROR, {
            "message": "user not provided"
        });
        const isOnline = PresenceService.isUserOnline(userId.user_id);
        const activities = PresenceService.getUserActivity(userId.user_id) || "None";
        io.to(`user_${socket.userId}`).emit(EmitEvents.USER_STATUS, {
            userId: userId.user_id,
            isOnline: isOnline,
            activities: activities
        });
    });


    socket.on(ListenEvents.DISCONNECT, () => {
        PresenceService.userDisconnected(socket.id, socket.userId);
    });
}