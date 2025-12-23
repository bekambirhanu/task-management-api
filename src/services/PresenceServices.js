const EmitEvents = require('../socket/socket_events/EmitEvents');

class PresenceService {
    constructor() {
        this.onlineUsers = new Map(); // userId -> []
        this.userActivities = new Map(); // userId -> activity data
    }


    userConnected(userId, socketId) {
        if(!this.onlineUsers.has(userId)) {
            this.onlineUsers.set(userId, []);
        }
            this.onlineUsers.get(userId).push(socketId);
            
            console.log(`users: online: ${this.onlineUsers.size}`)
    }

    userDisconnected(socketId, userId) {
        if(this.onlineUsers.has(userId)) {
            const socket = this.onlineUsers.get(userId);
            const index = socket.indexOf(socketId);


            if(index > -1) {
                socket.splice(index, 1);
            }

            if(socket.length === 0) {
                this.onlineUsers.delete(userId);
            }

            console.log(`user ${userId} is offline`);
        }
    }

    updateActivities(activities, userId) {
        this.userActivities.set(userId, {
            ...activities,
            lastActivity: new Date()
        });
    }

    getOnlineUsers() {
        return Array.from(this.onlineUsers.keys());
    }

    isUserOnline(userId) {
        return this.onlineUsers.has(userId);
    }

    getUserActivity(userId) {
        return this.userActivities.get(userId);
    }

    // userId, status timestamp
    broadcastPresenceChange(userId, status) {
        const io = require('../socket/index').getIO();
        if(io) {
            io.emit(EmitEvents.PRESENCE_CHANGE, {
                user: userId,
                status,
                timestamp: new Date()
            });
        }
    }

    getAllPresence() {
        const result = {};

        for (const [userId, socketId] of this.onlineUsers.entries()) {
            result[userId] = {
                online: true,
                socketCount: socketId.length,
                activity: this.userActivities.get(userId)
            }
        }
        return result;
    }

}

module.exports = new PresenceService();