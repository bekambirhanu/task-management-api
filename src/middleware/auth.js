const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { timeDifference } = require('../utils/time_difference');
const { JWT_SECRET_TOKEN } = require('../../envVars');

exports.protectedRoute = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({success: false, message:'Access Denied: No Token Provided'});

    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET_TOKEN, (err, decode) => {
        if (err) {
            return res.status(403).json({success: false, message:'Access Denied: Invalid Token'});
            
        }
        // If successful, attach the user data to the request object and proceed
        req.user = decode;
        next();
    });
};


exports.checkToken  = async (req, res, next) => {
    try {
    const { email, recovery_key } = req.body;
    if(!email) return res.status(400).json({success: false, message: "email is empty"});

    const user = await User.findOne({email: email}, {password: 1, password_recovery_key: 1, recovery_key_expire_date: 1, recovery_key_retries: 1});

    if(!user) return res.status(404).json({success: false, message: "please try setting the recovery email again"});

    const isRecoveryKeyValid = user.password_recovery_key === recovery_key;
    const isExpired = timeDifference(user.recovery_key_expire_date) >= 1;
    const isExhausted = user.recovery_key_retries >= 5;
    
    // Check if the recovery key is expired

    if(isExpired) 
        return res.status(400).json({success: false, message: "Invalid Recovery key"});

    // Check if the trial is exeded the limit

    if(isExhausted) 
        return res.status(400).json({success: false, message: "Please request a new key"});

    // Check if the recovery key is valid

    if(!isRecoveryKeyValid) {
        // increment the recovery key retry

        const inc = await User.findOneAndUpdate({email: user.email}, {$inc: {recovery_key_retries: 1}});

        return res.status(400).json({success: false, message: "Invalid Recovery key"});
    };

// If everything is fine, set the user email and move on to change password
    req.user_email = email;
    next();
}catch(error) {
    console.log(error);
    return res.status(500).json({success: false, message: "Internal Server error"});
}

}