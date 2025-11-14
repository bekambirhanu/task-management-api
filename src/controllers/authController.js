const User = require('../models/User');
const { validationResult } = require('express-validator');
const { generate_token } = require('../utils/jwt')
require('dotenv').config({path: '../../.env'});


// User registration
const JWT_SECRET_TOKEN = process.env.JWT_SECRET_TOKEN;

exports.register = async (req, res) => {
    try{
        // check if there are validation errors
        const error = validationResult(req);
        if (!error.isEmpty()) return res.json({success: false ,errors: error.array()});


        const { email, password, first_name, last_name, sex, role } = req.body;
        // check if the user already exists
        const existingUser = await User.findOne({email: email}, {_id: 0, email: 1, password: 1}).exec();
        if(existingUser) return res.status(403).json({success: false, message: "E-mail already exists"})
        
        // if the user is new, proceed to register
        const user = new User({ email: email,
                            password: password,
                            first_name: first_name,
                            last_name: last_name,
                            sex: sex,
                            role: role || 'user'
        });
        await user.save();

        const token = generate_token(
            user._id,
            user.email,
            user.first_name,
            user.role,
            JWT_SECRET_TOKEN,
            '24h'
        )

        res.status(201).json({
            success: true,
            message: "User created Successfully",
            token: token,
            user: {
                id: user._id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            }
        });

    } catch(error) {
        console.log(error);
        res.status(500).json({success: false, message: "internal Server Error. Registration failed"});

    }
};


// User Login

exports.login = async (req, res) => {
    const error = validationResult(req);
    if(!error.isEmpty()) return res.status(400).json({success: false, error: error.array()});



try{
    const { email, password } = req.body;

    const user = await User.findOne({email: email}, {tasks: 0, sex: 0});

    if (!user) return res.status(401).json({success: false, message: 'Login failed: invalid email or password'});

    const isPasswordValid = await user.correctPassword(password);

    if(!isPasswordValid) return res.status(401).json({success: false, message: 'Login failed: invalid email or password'});

    const token= generate_token(
        user._id, 
        user.email, 
        user.first_name,
        user.role,
        JWT_SECRET_TOKEN, 
        '24h'
    );

    return res.status(201).json({
        sucess: true,
        message: "Login Successfull",
        token: token,
        user:{
            id: user._id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
        }
    });

} catch(error) {
    console.log(error);
    res.status(500).json({success: false, error: "Internal Server Error, Login Failed"});
}
};