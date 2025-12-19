const mongoose = require('mongoose');
const { Schema } = mongoose;

const rateLimiterSchema = new Schema({

    ip_address: {
        type: String,
        required: true,
        maxlength: 39,
        minlength: 2
    },

    rate_reached: {
        type: Number,
        required: true,
        default: 0,
        max: [30, 'limit reached']
    }

},
{
    timestamps: {
        createdAt: false,
        updatedAt: true
    }
});


const RateCounter = mongoose.model('RateCounter', rateLimiterSchema);

module.exports = RateCounter;