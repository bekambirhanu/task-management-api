const RateCounter = require('../models/Rate');
const { timeDifference } = require('../utils/time_difference');

exports.rateLimiter = async (req, res, next) => {
    const ip_address = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if(!ip_address) return res.status(400).json({message: "ip not found!"});

    const user_count = await RateCounter.findOne({ip_address: ip_address});

    if (user_count) {
        const reached_limit = user_count.rate_reached >= 30;
        const is_pass_time = timeDifference(user_count.updatedAt) >= 1;
        if(reached_limit) {
            if(is_pass_time) {
                user_count.rate_reached = 0;
                await user_count.save();
                return next();
            }
            else {
                return res.status(429).json({message: `too many requests. please try again in ${timeDifference(user_count.updatedAt)} hour`});
            }
        }
        else {
            user_count.rate_reached += 1;
            await user_count.save();
            return next();
        }
    }
    else {
        const new_user_count = new RateCounter({
            ip_address: ip_address,
            rate_reached: 0
        });
        await new_user_count.save();
        return next();
    }
}