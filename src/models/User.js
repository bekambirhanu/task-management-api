const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true,
    },

    first_name: {
        type: String,
        required: true,
        trim: true
    },

    last_name: {
        type: String,
        required: true,
        trim: true
    },

    sex: {
        type: String,
        enum: ['male', 'female'],
        required: true
    },

    role: {
        type: String,
        enum: ['user', 'manager', 'admin'],
        default: 'user'
    },

    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task'}],

}, {
    timestamps: true
});

//--------------------------METHODS-----------------------------

//password validation

userSchema.methods.correctPassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}


//-----------------------PRE-HOOKS----------------------------

userSchema.pre('save', async function(next) {
    try {
        if(!this.isModified('password')) {return next()};

        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        return next();
    } catch(error) { console.log(error) }
});


// compile the model after defining middleware

 const User = mongoose.model('User', userSchema);
module.exports = User;