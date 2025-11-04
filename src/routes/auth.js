const routeAuth = require('express').Router();
const { register, login } = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');


// Route for registry

routeAuth.post('/register', validateRegistration, register);

// Route for loging in

routeAuth.post('/login',validateLogin, login);

module.exports = routeAuth;