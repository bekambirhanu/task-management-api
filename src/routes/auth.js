const routeAuth = require('express').Router();
const { emailVerify, register, login, sendRecoveryPassword, changePassword } = require('../controllers/authController');
const { checkToken } = require('../middleware/auth');
const { validateRegistration, validateLogin, validateEmail, validateRecoveryKey } = require('../middleware/validation');


// Route for registry

routeAuth.post('/register', validateRegistration, register);

// Route for loging in

routeAuth.post('/login',validateLogin, login);

// Route for recovery
routeAuth.post('/forgot-password', validateEmail, sendRecoveryPassword);

routeAuth.put('/reset-password', validateRecoveryKey, checkToken, changePassword);

routeAuth.post('/v', emailVerify);

module.exports = routeAuth;