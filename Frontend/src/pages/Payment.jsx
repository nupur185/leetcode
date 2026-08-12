import { useState } from "react";
import axios from "axios";
import {load} from '@cashfreepayments/cashfree-js';


function Payment() {

    let cashfree;
    let initializeSDK= async function () {
        cashfree= await load({
            mode: "sandbox",
        })
    }
    initializeSDK();
    const [orderId, setorderId] = useState("");


    const getSessionId= async() => {
        try {
            let res=await axios.get("https://leetcode-iqt3.onrender.com/payment");
            if(res.data && res.data.payment_session_id) {
                console.log(res.data);
                setorderId(res.data.order_id)
                return res.data.payment_session_id
            }
        }
        catch(error) {console.log(error);}
    }

    const verifyPayment= async() => {
        try {
            let res= await axios.post("https://leetcode-iqt3.onrender.com/verify", {
            orderId: orderId
        });
        if(res && res.data) {
            alert("payment verified");
        }
    }
        catch(error) {console.log(error);}
    }

    const handleClick= async (e)=> {
        e.preventDefault();
        try {
            let sessionId= await getSessionId();

            let checkoutOptions= {
                paymentSessionId: sessionId,
                redirectTarget: "_modal",
            }
            cashfree.checkout(checkoutOptions).then((res)=> {
                console.log("payment initiated");

                verifyPayment(orderId);
            })

        }
        catch(error) {console.log(error);}
    }

    return (
        <>
        <h1>Cashfree Payment Gateway</h1>
        <div className="card flex justify-center items-center">
            <button onClick={handleClick} className="border-2 rounded-2xl w-[30%] mt-5">
                Pay Now
            </button>
        </div>
        </>
    )
}

export default Payment;
