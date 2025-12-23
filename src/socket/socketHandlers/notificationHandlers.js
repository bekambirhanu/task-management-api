const Notification = require('../../models/Notification');
const EmitEvents = require('../socket_events/EmitEvents');
const ListenEvents = require('../socket_events/ListenEvents');

module.exports = async (io, socket) => {

    socket.on(ListenEvents.GET_NOTIFICATIONS, async () => {

        try {

            const notifications = await Notification.find({ user: socket.userId });
            await io.to(`user_${socket.userId}`).emit(EmitEvents.GET_REQUEST, {success: true, notifications: notifications })

        } catch(error) {
            await io.to(`user_${socket.userId}`).emit(EmitEvents.ERROR, { success: false, message: "Internal Error request unsuccessful"});

        }
    });

    socket.on(ListenEvents.MARK_AS_READ, async (data) => {

        if(!data) return

         data.forEach(async notification_id => {
            await Notification.findByIdAndUpdate(notification_id, { read: true});
        });
    })
}