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


//for payment--------------------------------
const crypto= require('crypto');
const {Cashfree} = require('cashfree-pg');
const Joi = require('joi');
//-----------------------------------------

app.use(cors({
    origin: 'https://leetcode-frontend-blkw.onrender.com',
    credentials: true
}))

app.use(express.json());

//for payment   ---------------------------------------------------------------------
app.use(express.static('.'));
app.use(express.urlencoded({extended:true}));

//for payment
const cashfree = new Cashfree(Cashfree.SANDBOX, process.env.CLIENT_ID, process.env.CLIENT_SECRET);


function generateOrderId() {
    const uniqueId= crypto.randomBytes(16).toString('hex');
    const hash= crypto.createHash('sha256');
    hash.update(uniqueId);
    const orderId= hash.digest('hex');

    return orderId.substr(0,12);
}

app.get('/payment', async(req,res)=> {
    try {
        //const { amount, customerId, customerName, customerEmail, customerPhone } = req.body;
        const request= {
            order_amount: 1.00,
            order_currency: "INR",
            order_id: generateOrderId(),
            customer_details: {
                customer_id: "USER123",
                customer_name: "joe",
                customer_email: "joe.s@cashfree.com",
                customer_phone: "+919876543210"
            },
        };

        // Cashfree.PGCreateOrder("2026-08-08", request).then(response => {
        //     console.log(response.data);
        //     res.json(response.data);
        // }).catch(error => {
        //     console.error(error.response.data.message);
        // })
console.log("hit");
        const response = await cashfree.PGCreateOrder(request);
        console.log("miss");
        
        console.log("Order created successfully:", response.data);
        res.json(response.data); // Send payment session data to frontend


    }
    catch(error) {
        console.error("❌ Cashfree Error:", error.message);
        return res.status(statusCode).json({
            success: false,
            error: errorMessage
        });
    }
});
app.post('/verify', async(req,res)=> {
    try {
        const { orderId } = req.body;
        cashfree.PGOrderFetchPayments(orderId).then ((response)=> {
            res.json(response.data);
        }). catch(error => {
            console.error(error.response.data.message);
        })
    }
    catch(error) {
        let statusCode;
        console.error("Cashfree Error:", error.message);
        return res.status(statusCode).json({
            success: false,
            error: errorMessage
        });
    }
});
//  ----------------------------------------------------------------------------------

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
