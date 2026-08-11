const jwt= require('jsonwebtoken');
const User = require('../models/user');
const redisClient= require('../config/redis');
const userMiddleware= async(req,res,next) => {
    try {
        const {token}= req.cookies;
        if(!token) throw new Error("token not exist");
        const payload= jwt.verify(token,process.env.JWT_KEY);
        const {_id} = payload;
        if(!_id) throw new error("invalid token");
        const result = await User.findById(_id);
        if(!result) throw new Error("user don't exist");

        //whether that token present in blocklist in redis
        const IsBlocked= await redisClient.exists(`token:${token}`);
        if (IsBlocked) throw new Error("Invalid Token");
        req.result= result;
        next();
    }
    catch(err) {
        res.status(401).send("Error: "+err.message); 
    }
}

module.exports= userMiddleware;