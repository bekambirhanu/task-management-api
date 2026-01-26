const adminRoute = require('express').Router();
const { getAllUsers, deleteUser } = require('../controllers/userController');
const { requireRole } = require('../middleware/authorization');



adminRoute.use(requireRole('admin'));


adminRoute.get('/', getAllUsers);

adminRoute.delete('/:id/delete', deleteUser);


module.exports = adminRoute;