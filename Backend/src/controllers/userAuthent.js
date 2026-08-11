const redisClient = require('../config/redis');
const User= require('../models/user');
const validate= require('../utils/validator');
const bcrypt= require('bcrypt');
const jwt= require('jsonwebtoken');
const Submission= require('../models/submission');

const register = async (req,res)=> {
    try {
        validate(req.body);
        const {firstName,emailId,password} = req.body;
        req.body.password= await bcrypt.hash(password,10);
        req.body.role='user';

        const user= await User.create(req.body);
        const token= jwt.sign({_id:user._id, emailId: emailId, role:'user'}, process.env.JWT_KEY, {expiresIn: 60*60});
        const reply= {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role
        }
        res.cookie('token',token,{maxAge: 60*60*1000},{secure: true, sameSite: 'none'});
        res.status(201).json({
            user: reply,
            message: "User Registered Successfully"
        });

    }
    catch(err) {
        res.status(400).send("Error: "+err);
    }
}

const login= async(req,res)=> {
    try {
        const {emailId,password}= req.body;
        if(!emailId) throw new Error('invalid credentials');
        if(!password) throw new Error('invalid credentials');

        const user= await User.findOne({emailId});
        const match= await bcrypt.compare(password,user.password);
        if(!match) throw new Error("invalid credentials");

        const reply= {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role
        }

        const token= jwt.sign({_id:user._id, emailId: emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
        res.cookie('token',token,{maxAge: 60*60*1000},{secure: true, sameSite: 'none'});
        res.status(201).json ({
            user: reply,
            message:"Login Successfully"
        });
    }
    catch(err) {
        res.status(401).send("Error: "+err);
    }
}

const logout= async(req,res)=> {
    try{
        const {token} = req.cookies;
        const payload= jwt.decode(token);
        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`, payload.exp);

        res.cookie("token",null,{expires: new Date(Date.now())},{secure: true, sameSite: 'none'});
        res.send("Logged out successfully");
    }
    catch(err) {
        res.status(503).send("Error: "+err);
    }
}

const adminRegister= async(req,res)=> {
    try {
        validate(req.body);
        const {firstName,emailId,password} = req.body;
        req.body.password= await bcrypt.hash(password,10);

        const user= await User.create(req.body);
        const token= jwt.sign({_id:user._id, emailId: emailId, role:user.role}, process.env.JWT_KEY, {expiresIn: 60*60});
        res.cookie('token',token,{maxAge: 60*60*1000},{secure: true, sameSite: 'none'});
        res.status(201).send('user registered Successfully');

    }
    catch(err) {
        res.status(400).send("Error: "+err);
    }
}

const deleteProfile= async(req,res)=> {
    try {
        const userId= req.result._id;

        await User.findByIdAndDelete(userId);   //delete from userSchema
        await Submission.deleteMany({userId});  //delete from submissions

        res.status(200).send("Deleted Successfully");

    }
    catch(err) {
        res.status(500).send("Internal server error");
    }
}

module.exports= {register, login,logout, adminRegister, deleteProfile};
