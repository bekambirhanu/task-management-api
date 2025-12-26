const fileRoute = require('express').Router();
const { protectedRoute } = require('../middleware/auth');
const {canModifyTask, canDeleteTask} = require('../middleware/authorization');
const Task = require('../models/Task');
const FileUploadServices = require('../services/FileUploadServices');


// Upload route
fileRoute.post('/tasks/:task_id/upload', 
    protectedRoute,
    canModifyTask,
    async (req, res) => {
    try {
        const file = await FileUploadServices.processUpload(req, res);

            return res.status(200).json({
                success: true,
                message: 'file Uploaded successfuly',
                count: file.length,
                file: file
            });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error. upload unsuccessful'
        });
    }
});

// Delete route
fileRoute.delete('/tasks/:task_id/delete',
    protectedRoute,
    canDeleteTask,
    async (req, res) => {
        try {

            await FileUploadServices.deleteFile(req.params.task_id, req.params.file_id);

            return res.status(200).json({
                success: true,
                message: 'file deleted successfuly'
            });

        } catch(error) {
            console.log(error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });


fileRoute.get('tasks/:task_id/files',
    protectedRoute,
    async (req, res) => {
        try {

            const task = await Task.findById(req.params.task_id, {attachments: 1, totalStorageUsed: 1})
                                    .populate('attachments.uploadedBy', 'first_name last_name');
            
            return res.status(500).json({
                success: true,
                totalStorageUsed: task.totalStorageUsed,
                totalStorageLimit: task.MAX_STORAGE_PER_TASK,
                file: task.attachments
            });

        } catch(error) {
            console.log(error)
        return res.status(400).json({
            success: false,
            message: error.message
        });

        }
    });

    module.exports = fileRoute;