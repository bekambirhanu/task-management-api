const User = require("../models/User");

exports.getAllUsers = async (req, res) => {
    try{
        const query = await User.find(true);
        return res.status(200).json({success: true, users: query});
    } catch (error) {
        res.status(500).json({success: false, message: "Internal Error"})
    }
}

exports.deleteUser = async (req, res) => {
    try{
        const user_id = req.param.id;
        if(!user_id) {
            return res.status(400).json({success: false, message: "User not provided!"});
        }
        const query = User.findByIdAndDelete(user_id);
        if (!query) return res.status(400).json({success: false, message: "user not found"});

        return res.status(200).json({success: true, users: query});
    } catch (error) {
        res.status(500).json({success: false, message: "Internal Error"})
    }
}



// For Recovery
exports.recoverUser = async(req, res) => {
    return null
}