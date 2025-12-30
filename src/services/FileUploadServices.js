const multer = require('multer');
const Task = require('../models/Task');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const EmitEvents = require('../socket/socket_events/EmitEvents');


class FileUploadServices {
    constructor() {
        this.storage = multer.diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = `uploads/task/${req.params.task_id}`;
                fs.mkdir(uploadPath, {recursive: true})
                .then(() => cb(null, uploadPath))
                .catch((err) => cb(err));
            },
            filename: (req, file, cb) => {
                const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
                cb(null, uniqueName);
            }
        });
        
        // File Filtering
        this.fileFilter = (req, file, cb) => {
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/gif',
                'application/pdf',
                'application/json',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'text/csv',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ];

            if(allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new Error('invalid file format'), false);
            }
        };
        this.upload = multer({
            storage: this.storage,
            fileFilter: this.fileFilter,
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB per file
                files: 10 // Max 10 files per request
            }
        });
    }

        // check storage limit
    async checkStorageLimit(taskId, fileSize) {
        const task = await Task.findById(taskId);
        const newTotal = (task.totalStorageUsed || 0) + fileSize;
        if (newTotal >= Task.MAX_STORAGE_PER_TASK) {
            throw new Error('Not enough space')
        }

        return true;
    };

    async uploadToCloud(filePath, originalName, mimeType) {
        // For now, we'll use local storage
        // In production, replace with AWS S3, Google Cloud Storage, etc.

        
        console.log('uploadToCloud');
        return {
            filename: path.basename(filePath),
            oritinalName: originalName,
            mimeType: mimeType,
            size: (await fs.stat(filePath)).size,
            url: `/uploads/${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`,
            localPath: filePath
        };
    };

    // Process upload
    async processUpload(req, res) {
        return new Promise((resolve, reject) => {
            this.upload.array('attachments', 10)(req, res, async (err) => {
                if (err) {
                    return reject(err);
                }
                
                try {
                    const taskId = req.params.task_id;
                    const uploadedBy = req.user.userId;
                    const processedFiles = [];
                    console.log(req.files)
                    for (const file of req.files) {
                        // Check storage limit
                        await this.checkStorageLimit(taskId, file.size);
                        
                        // Process file (in production: upload to cloud)
                        const fileInfo = await this.uploadToCloud(
                            file.path,
                            file.originalname,
                            file.mimetype
                        );
                        
                        // Add to task
                        await Task.findByIdAndUpdate(
                            taskId,
                            {
                                $push: {
                                    attachments: {
                                        ...fileInfo,
                                        uploadedBy
                                    }
                                },
                                $inc: {
                                    totalStorageUsed: file.size
                                }
                            },
                            { new: true }
                        ).populate('attachments.uploadedBy', 'first_name last_name');
                        
                        processedFiles.push(fileInfo);
                        
                        // Real-time notification
                        const io = require('../socket/index').getIO();
                        io.to(`task_${taskId}`).emit('file_uploaded', {
                            file: fileInfo,
                            uploadedBy,
                            taskId,
                            timestamp: new Date()
                        });
                    }
                    
                    resolve(processedFiles);
                } catch (error) {
                    // Cleanup uploaded files on error
                    if (req.files) {
                        req.files.forEach(file => {
                            fs.unlink(file.path).catch(() => {});
                        });
                    }
                    reject(error);
                }
            });
        });
    }

    // Delete file
    async deleteFile(taskId, fileId) {
        const task = await Task.findById(taskId);
        const file = task.attachments.find(element => element._id.toString() === fileId.toString());

        // console.log(task.attachments.find(element => element._id.toString() === "6953c57b23361207b27048df"))
        // console.log(fileId, task.attachments[1]._id.toString())
        if (!file) {
            throw new Error('File not found');
        }
        
        // Delete from storage
        if (file.localPath) {
            await fs.unlink(file.localPath).catch(() => {});
        }
        
        // Remove from database
        task.attachments.pull(fileId);
        task.totalStorageUsed -= file.size;
        await task.save();
        
        // Real-time notification
        const io = require('../socket/index').getIO();
        io.to(`task_${taskId}`).emit(EmitEvents.FILE_DELETE, {
            fileId: fileId,
            taskId: taskId,
            timestamp: new Date()
        });
        
        return true;
    };
    
};

module.exports = new FileUploadServices();