const express= require('express');
const app=express();
require('dotenv').config();
const main= require('./config/db');
const cookieparser= require('cookie-parser');
const authRouter= require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter= require('./routes/problemcreator');
const submitRouter= require("./routes/submit");
const aiRouter= require("./routes/aiChatting");
const cors= require('cors');
const videoRouter = require('./routes/videoCreator');

app.use(cors({
    origin: 'https://leetcode-frontend-blkw.onrender.com',
    credentials: true
}))

app.use(express.json());
app.use(cookieparser());

app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submitRouter);
app.use('/ai',aiRouter);
app.use("/video",videoRouter);

const initializeConnection= async()=> {
    try {
        await Promise.all([main(),redisClient.connect()]);
        console.log("DB Connected");
        app.listen((process.env.PORT || 3000),()=>{
        console.log('listening at port ');
        })
    }
    catch(err) {
        console.log("Error: "+err);
    }
}

initializeConnection();
