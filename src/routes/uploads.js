const fileRoute = require('express').Router();
const { protectedRoute } = require('../middleware/auth');
const { canModifyTask, canDeleteTask } = require('../middleware/authorization');
const Task = require('../models/Task');
const FileUploadServices = require('../services/FileUploadServices');

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File upload and management for tasks
 */

/**
 * @swagger
 * /tasks/{task_id}/file:
 *   get:
 *     summary: Get all files attached to a task
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: task_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: List of files attached to the task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalStorageUsed:
 *                   type: number
 *                   example: 1024000
 *                 totalStorageLimit:
 *                   type: number
 *                   example: 10485760
 *                 file:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       filename:
 *                         type: string
 *                       size:
 *                         type: number
 *                       uploadedBy:
 *                         type: object
 *                       uploadedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Task not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

fileRoute.get('/tasks/:task_id/file',
    protectedRoute,
    async (req, res) => {
        try {

            const task = await Task.findById(req.params.task_id, { attachments: 1, totalStorageUsed: 1 })
                .populate('attachments.uploadedBy', 'first_name last_name');

            if (!task) return res.status(400).json({ success: false, message: error.message });

            return res.status(200).json({
                success: true,
                totalStorageUsed: task.totalStorageUsed,
                totalStorageLimit: task.MAX_STORAGE_PER_TASK,
                file: task.attachments
            });

        } catch (error) {
            console.log(error)
            return res.status(400).json({
                success: false,
                message: error.message
            });

        }
    });

/**
 * @swagger
 * /tasks/{task_id}/upload:
 *   post:
 *     summary: Upload files to a task
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: task_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: file Uploaded successfuly
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 file:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Not authorized to modify this task
 *       500:
 *         description: Upload failed
 */
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
        } catch (error) {

            console.log(error);

            return res.status(500).json({
                success: false,
                message: 'Internal Server Error. upload unsuccessful'
            });
        }
    });

/**
 * @swagger
 * /tasks/{task_id}/delete/{file_id}:
 *   delete:
 *     summary: Delete a file from a task
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: task_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *       - in: path
 *         name: file_id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: file deleted successfuly
 *       400:
 *         description: File not found or deletion failed
 *       403:
 *         description: Not authorized to delete files from this task
 */
fileRoute.delete('/tasks/:task_id/delete/:file_id',
    protectedRoute,
    canDeleteTask,
    async (req, res) => {
        try {

            await FileUploadServices.deleteFile(req.params.task_id, req.params.file_id);

            return res.status(200).json({
                success: true,
                message: 'file deleted successfuly'
            });

        } catch (error) {
            console.log(error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });


module.exports = fileRoute;