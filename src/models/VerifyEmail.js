const mongoose = require('mongoose');
const { Schema } = mongoose;

// Store email verification data for registration

const emailVerifySchema = new Schema({
    email: {
        type: String,
        require: true,
        unique: true
    },
    verify_key: {
        type: String,
        require: true
    }
},
    {
        timestamps: true
    }
);


const VerifyEmail = mongoose.model('VerifyEmail', emailVerifySchema);
module.exports = VerifyEmail;