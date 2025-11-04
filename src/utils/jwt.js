const jwt = require('jsonwebtoken');

// To generate new token

exports.generate_token = function(userId, userEmail, userName, userSex, jwt_secret_token, expiresIn='1h'){
    const token = jwt.sign(
        {
            userId: userId,
            userEmail: userEmail,
            userName: userName,
            userSex: userSex
        },
        jwt_secret_token,
        {
            expiresIn:expiresIn
        }
    );
    return token;

}