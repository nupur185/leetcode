const express= require('express');
const submitRouter= express.Router();
const userMiddleware= require('../middleware/userMiddleware');
const {submitCode, runCode}= require('../controllers/userSubmission');
const {submitRatelimiter} = require('../middleware/submitRatelimiter');

submitRouter.post("/submit/:id",userMiddleware, submitRatelimiter, submitCode);
submitRouter.post("/run/:id",userMiddleware, runCode);

module.exports= submitRouter;