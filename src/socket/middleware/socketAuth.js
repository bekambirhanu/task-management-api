const { JWT_SECRET_TOKEN } = require('../../../envVars');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

// id, email, first_name, role

exports.socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.headers.authorization || socket.handshake.auth.token || socket.query.token || null;
        if (!token || !token.startsWith("Bearer ")) return next(new Error('Authentication error: Token Missing'));
        
        // validate the token
        const decode = jwt.verify(token.split(' ')[1], JWT_SECRET_TOKEN);
        
        const user = await User.findById(decode.id, {_id: 1});
        // Check if the user exists
        if(!user) return next(new Error('Authentication error: user not found!'));

        socket.userId = user._id;
        socket.userEmail = decode.email;
        socket.first_name = decode.first_name;
        socket.userRole = decode.role;

        console.log(`Socket authenticated for user: ${socket.userEmail}, (${socket.userId})`);

        next();
            
    } catch(err) {
        // err: {name, message}
        console.log(`Socket auth error: ${err}`)

        if(err.name === 'TokenExpiredError') {
            return next(new Error('Authentication error: Token-expired'));
        }else if (err.name === 'JwonWebTokenError') {
            return next(new Error('Authentication error: Invalid Token'));
        } else {
            return next(new Error(`Authentication error: \n ${err}`));
        }
    }

}