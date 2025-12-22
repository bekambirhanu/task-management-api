const User = require('../models/User');
const VerifyEmail = require('../models/VerifyEmail');
const { validationResult } = require('express-validator');
const { generate_token } = require('../utils/jwt');
const KeyGenerator = require('../utils/key_generator');
const EmailService = require('../services/emailServices');
const { JWT_SECRET_TOKEN } = require('../../envVars');
const { timeDifference } = require('../utils/time_difference');


exports.emailVerify = async (req, res) => {
    try{
        // check if there are validation errors
        const error = validationResult(req);
        if(!error.isEmpty())
            return res.json({success: false ,errors: error.array()});

        const email = req.body.email;

        // check if the user already registered

        const existingUser = await User.findOne({email: email});

        if(existingUser)
            return res.status(400).json({success: false, message: "email already exists"});

        // generate the key
        const verify_key = KeyGenerator.generateRandomString();

        await EmailService.verifyEmail(email,verify_key).then(async (result) => {
            if(result.accepted[0] !== email)
                return res.status(400).json({success: false, message: "Email Unsuccessful. please try again"});

            // Check if the user already queued before
            const queueExists = await VerifyEmail.findOne({email: email})
            if(queueExists) {
                await VerifyEmail.findOneAndUpdate({email: email}, {verify_key: verify_key}).exec();
            }
            else{
            const new_candidate = new VerifyEmail({
                email: email,
                verify_key: verify_key
            });
            await new_candidate.save();
        }
        });
        return res.status(200).json({success: true, message: "Verification Key Sent Successfully. please check your Email"});
    } catch(error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Internal Server Error!"});
    }


}
// User registration
exports.register = async (req, res) => {
    try{
        // check if there are validation errors
        const error = validationResult(req);
        if (!error.isEmpty()) 
            return res.json({success: false ,errors: error.array()});


        const { email, password, verify_key, first_name, last_name, sex, role } = req.body;

        // check if the user already exists
        const existingUser = await User.findOne({email: email}, {_id: 0, email: 1}).exec();

        if(existingUser) 
            return res.status(403).json({success: false, message: "E-mail already exists"});

        // Check if the user is the candidate person (the one that sent the key request)
        const candidateUser = await VerifyEmail.findOne({email: email});
        if(!candidateUser)
            return res.status(400).json({success: false, message: "Unknown Email. Please use the email which the key has been sent to"});
        
        // Check if the key is valid
        const isVerified = candidateUser.verify_key.toString() === verify_key;

        if(!isVerified)
            return res.status(400).json({success: false, message: "Invalid Token. Please provide a valid token or request a new one"});

        // Check if the key is not pass the time
        const isNotExpired = timeDifference(candidateUser.updatedAt)<1;
            console.log(isNotExpired);
        if(!isNotExpired) {
            // Delete the queue data
            //await VerifyEmail.findByIdAndDelete(candidateUser._id);

            return res.status(400).json({success: false, message: "This Key has expired. Please request a new key"});
        }


        console.log({candidateUser:candidateUser, isNotExpired: isNotExpired, isVerified: isVerified})

        // if the user is new and verified, proceed to register

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
        // clear the verification data
        await VerifyEmail.findByIdAndDelete(candidateUser._id);

        return res.status(201).json({
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

// password recovery

exports.sendRecoveryPassword = async (req, res) => {
    const email = req.body.email;
    try{
        const existingUser = await User.findOne({email: email}, {_id: 1, email: 1, first_name: 1}).exec();

        if(!existingUser) return res.status(403).json({success: false, message: "User with provided email doesn't exist"});
        
        const recoveryKey = KeyGenerator.generateRandomString();

        await EmailService.sendPasswordReset(email, existingUser.first_name, recoveryKey);

        await User.findOneAndUpdate({_id: existingUser._id} ,{
                    password_recovery_key: recoveryKey, 
                    recovery_key_expire_date: Date.now(),
                     recovery_key_retries: 0 });


        return res.status(200).json({success: true, message: `Recovery key is sent to ${email}. Please check your email`});

    } catch(error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Internal server error!"});
    }
}

exports.changePassword = async (req, res) => {
    const error = validationResult(req)
    if(!error.isEmpty()) return res.status(400).json({success: false, message: error});

    const new_password = req.body.new_password;
    const email = req.user_email;
    try {
        const user = await User.findOne({email: req.user_email}, {password: 1})
        const isOldPassword = await user.correctPassword(new_password);
        if(isOldPassword) return res.status(400).json({success: false, message: "New password is the same as old password. please provide a new password"});
        await User.findOneAndUpdate({email: email}, {
                                    password: new_password,
                                    password_recovery_key: null,
                                    recovery_key_expire_date: null,
                                    recovery_key_retries: 0
                                });
        return res.status(200).json({success: true, message: "Password is reset successfully"});

    } catch(error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Internal Server error!"});
    }
}