const router = require('express').Router();
const { protectedRoute } = require('../middleware/auth');
const NotificationService = require('../services/NotificationSerivices');
const Notification = require('../models/Notification')

// Get user notifications
router.get('/', protectedRoute, async (req, res) => {
    try {
        const notifications = await NotificationService.getUserNotifications(
            req.user.id,
            req.query.limit || 20
        );
        
        res.json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
});

// Mark notification as read
router.patch('/:id/read', protectedRoute, async (req, res) => {
    try {
        const notification = await NotificationService.markAsRead(
            req.params.id,
            req.user.id
        );
        
        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
});

// Mark all as read
router.patch('/read-all', protectedRoute, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, read: false },
            { read: true }
        );
        
        // Notify client via socket
        const io = require('../sockets').getIO();
        io.to(`user_${req.user.id}`).emit('all_notifications_read');
        
        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
        });
    }
});

module.exports = router;