const jwt = require('jsonwebtoken');
require('dotenv').config({path: '../../.env'});

const JWT_SECRET_TOKEN = process.env.JWT_SECRET_TOKEN;

exports.protectedRoute = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({success: false, message:'Access Denied: No Token Provided'});

    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET_TOKEN, (err, decode) => {
        if (err) {
            return res.status(403).json({success: true, message:'Access Denied: Invalid Token'});
        }

        // If successful, attach the user data to the request object and proceed
        req.user = decode;
        next();
    });
};