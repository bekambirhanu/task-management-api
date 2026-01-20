const { createTask, getTask, bulkTask, deleteTask, assignDeassignTask, modifyTask } = require('../controllers/taskController');
const { protectedRoute } = require('../middleware/auth');
const { canModifyTask, canAssignTask, canDeleteTask } = require('../middleware/authorization');
const { validateNewTask, validateAssignTask, validateModifierTask } = require('../middleware/validation');
const routeCRUD = require('express').Router();



// Add jwt authentication middleware
routeCRUD.use(protectedRoute);

// To create a new task
routeCRUD.post('/c', validateNewTask, createTask);

// To list all the tasks
routeCRUD.get('/', getTask);

// Bulk migration of tasks
routeCRUD.post('/migrate', bulkTask);

// Delete a task route
routeCRUD.delete('/:id/delete', canDeleteTask, deleteTask);

// Update(assign tasks to user)
routeCRUD.patch('/a',validateAssignTask, canAssignTask, assignDeassignTask);

//Update(modify tasks)
routeCRUD.put('/:id/modify', validateModifierTask, canModifyTask, modifyTask);

module.exports = routeCRUD;