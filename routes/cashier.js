const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')

dotenv.config()

const  { addPurchaseHistory, addPurchaseHistoryItems, startCashierSession, endCashierSession} = require('../database.js')
const { verifyToken } = require("./verify.js")

router.post('/savepurchasehistory' , async (req,res) => {
    const {purchase_total,amount_tendered,amount_change,items} = req.body
    
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    try {
        verifyToken(req,res)
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const cashier = decoded.id
        
        const purchase_id = await addPurchaseHistory(cashier,purchase_total,amount_tendered,amount_change)

        if (Array.isArray(items)) {
            for (const item of items) {
                await addPurchaseHistoryItems(purchase_id, item.batch_id,item.quantity)
            }
        }

        res.status(200).json("PURCHASE HISTORY SAVED");
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})

router.post('/startCashierSession' , async (req,res) => {
    const {opening_balance} = req.body
    
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    try {
        verifyToken(req,res)
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const cashier = decoded.id
        
        const cashierSessionId = await startCashierSession(cashier, opening_balance)

        res.cookie("cashierSessionId", cashierSessionId, {
        httpOnly: true, 
        secure: true,    // set to true in production with HTTPS
        sameSite: "lax",
        maxAge: 60 * 60 * 12000 // 12 hour
        });

        res.status(200).json("CASHEIR SESSION STARTED SUCCESSFULLY");
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})

router.post('/endCashierSession' , async (req,res) => {
    const {closing_balance} = req.body
    
    const token = req.cookies.token;
    const cashierSessionId = req.cookies.cashierSessionId;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    try {
        verifyToken(req,res)
        
        await endCashierSession(cashierSessionId,closing_balance)

        res.status(200).json("CASHEIR SESSION ENDED SUCCESSFULLY");
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})



module.exports = router