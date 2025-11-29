const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')
const paymongo = require('@api/paymongo');


dotenv.config()

const  { addPurchaseHistory, addPurchaseHistoryItems, startCashierSession, endCashierSession, getLastReceiptNumber, getSalesHistory,getSalesHistories, getCashierProducts} = require('../database.js')
const { verifyToken } = require("./verify.js")

router.post('/savepurchasehistory' ,verifyToken, async (req,res) => {
    const {purchase_total,amount_tendered,amount_change,items,paymentMethod} = req.body
    
    const token = req.cookies.token;

    if(!purchase_total || !amount_tendered || amount_change === undefined || !items)    
        return res.status(422).json({ message: "Missing require fields" });
    
    if(isNaN(purchase_total) || isNaN(amount_tendered) || isNaN(amount_change))  
        return res.status(400).json({ message: "purchase_total, amount_tendered and amount_change must be valid numbers" });
    
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const cashier = decoded.id

        const receiptNumber = await generateReceiptNumber()            
        
        const purchase_id = await addPurchaseHistory(receiptNumber,cashier,purchase_total,amount_tendered,amount_change,paymentMethod)

        if (Array.isArray(items)) {
            for (const item of items) {
                await addPurchaseHistoryItems(purchase_id, item.batch_id,item.quantity)
            }
        }

        return res.status(200).json({ message: "PURCHASE HISTORY SAVED" ,receiptNumber:receiptNumber});
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})

async function generateReceiptNumber(){
    const now = new Date();

    const year = now.getFullYear();                            // 2025
    const month = String(now.getMonth() + 1).padStart(2, "0"); // 11 → "11"

    const prefix = `${year}${month}`; // "202511"
    let rows = [];

    // Get last receipt code for the same year+month
    rows = await getLastReceiptNumber(prefix)

    let newIncrement = 1;

    if (rows.length > 0) {
        const lastCode = rows[0].receipt_number.toString(); // e.g. 2025110042
        let lastIncrement = parseInt(lastCode.slice(-4));// get "0042" → 42
        newIncrement = lastIncrement + 1;        
    }

    const receiptCode = `${prefix}${String(newIncrement).padStart(4, "0")}`;
    
    return receiptCode; // Example: "2025110043"    
}

router.post('/startCashierSession' ,verifyToken, async (req,res) => {
    const {opening_balance} = req.body
    
    const token = req.cookies.token;

    if(!opening_balance)    return res.status(400).json({ message: "Missing opening balance" });
    
    if(isNaN(opening_balance))  return res.status(400).json({ message: "opening balance must be a valid number" });
    
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const cashier = decoded.id
        
        const cashierSessionId = await startCashierSession(cashier, opening_balance)

        const isDev = process.env.MODE === 'DEV'

        res.cookie("cashierSessionId", cashierSessionId, {
        httpOnly: true, 
        secure: !isDev, 
        sameSite: isDev ? "lax" : "none",
        maxAge: 60 * 60 * 12000,
        partitioned: !isDev,
        });
        

        return res.status(200).json({ message: "CASHIER SESSION STARTED SUCCESSFULLY" })
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})

router.post('/endCashierSession' ,verifyToken, async (req,res) => {
    const {closing_balance} = req.body
    
    const token = req.cookies.token;
    const cashierSessionId = req.cookies.cashierSessionId;

    if(!closing_balance)    return res.status(400).json({ message: "Missing closing balance" });

    if(isNaN(closing_balance))  return res.status(400).json({ message: "closing balance must be a valid number" });    
    
    try {        
        await endCashierSession(cashierSessionId,closing_balance)

        return res.status(200).json({ message: "CASHIER SESSION ENDED SUCCESSFULLY" });
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})

router.get('/getSalesHistories' ,verifyToken, async (req,res) => {
    const { from, to } = req.query

    try {
        const history = await getSalesHistories(from,to)

        return res.status(200).json(history)
    } 
    catch (err) {      
        return res.status(500).json({ message: "Unexpected Error occurred",error:err })
    }    
})

router.get('/getSalesHistory' ,verifyToken, async (req,res) => {
    const { hId } = req.query;

    try {
        const history = await getSalesHistory(hId)

        return res.status(200).json(history)
    } 
    catch (err) {      
        return res.status(500).json({ message: "Unexpected Error occurred",error:err })
    }    
})

router.get('/getcashierproducts' ,verifyToken, async (req,res) => {    
    try {
        const products = await getCashierProducts()

        return res.status(200).json(products)
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }    
})


module.exports = router