const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^@]+@[^@]+\.[^@]+$/, "Invalid Email address"]
    },

    password: {
        type: String,
        required: true,
        select: false
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

    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],

    // fields for recovery key
    password_recovery_key: String,
    recovery_key_expire_date: Date,
    recovery_key_retries: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true
});


// ---------------------EXCLUDE THE PASSWORD-----------------
userSchema.set('toJSON', {
    transform: (doc, ret, options) => {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

//-----------------------PRE-HOOKS----------------------------

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        return next();
    } catch (error) { console.log(error) }
});

userSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    if (!update.password) { return next() };

    try {
        const saltRounds = 12;
        update.password = await bcrypt.hash(update.password, saltRounds);
        return next();

    } catch (error) {
        console.log(error)
    }
})

//--------------------------METHODS-----------------------------

//password validation

userSchema.methods.correctPassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
}

// model the schema after defining middleware

const User = mongoose.model('User', userSchema);
module.exports = User;