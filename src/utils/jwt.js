const jwt = require('jsonwebtoken');

// To generate new token

exports.generate_token = function(userId, userEmail, userName,userRole, jwt_secret_token, expiresIn='1h'){
    const token = jwt.sign(
        {
            id: userId,
            email: userEmail,
            first_name: userName,
            role: userRole
        },
        jwt_secret_token,
        {
            expiresIn:expiresIn
        }
    );
    return token;

}