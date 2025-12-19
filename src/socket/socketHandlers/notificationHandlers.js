const Notification = require('../../models/Notification');

module.exports = async (io, socket) => {

    socket.on('get_notifications', async () => {

        try {

            const notifications = await Notification.find({ user: socket.userId });
            await io.to(`user_${socket.userId}`).emit('get_request', {success: true, notifications: notifications })

        } catch(error) {
            await io.to(`user_${socket.userId}`).emit('error', { success: false, message: "Internal Error request unsuccessful"});

        }
    });

    socket.on('mark_as_read', async (data) => {

        if(!data) return

         data.forEach(async notification_id => {
            await Notification.findByIdAndUpdate(notification_id, { read: true});
        });
    })
}