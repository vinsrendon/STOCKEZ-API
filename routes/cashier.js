const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')


dotenv.config()

const  { startCashierSession, endCashierSession, getLastReceiptNumber, getSalesHistory,getSalesHistories, getCashierProducts, savePurchase, getCashiesSessionSummary, getCashiesSessionInfo} = require('../database.js')
const { verifyToken } = require("./verify.js")

router.post('/savepurchasehistory' ,verifyToken, async (req,res) => {
    const {purchase_total,amount_tendered,amount_change,items,paymentMethod,pi} = req.body
    
    const token = req.cookies.token

    const cashierSessionId = req.cookies.cashierSessionId    

    if(!purchase_total || !amount_tendered || amount_change === undefined || !items)    
        return res.status(422).json({ message: "Missing require fields" })
    
    if(isNaN(purchase_total) || isNaN(amount_tendered) || isNaN(amount_change))  
        return res.status(400).json({ message: "purchase_total, amount_tendered and amount_change must be valid numbers" })
    
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const cashier = decoded.id

        const receiptNumber = await generateReceiptNumber()            

        await savePurchase(cashierSessionId,receiptNumber,cashier,purchase_total,amount_tendered,amount_change,paymentMethod,items,pi)

        return res.status(200).json({ message: "PURCHASE HISTORY SAVED" ,receiptNumber:receiptNumber})
    } catch (err) {
        if (err.code === "INSUFFICIENT_STOCK") {
            return res.status(422).json({message: "NOT ENOUGH STOCK"})
        } else {
            return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
        }
    }
    
})

async function generateReceiptNumber(){
    const now = new Date()

    const year = now.getFullYear()                           
    const month = String(now.getMonth() + 1).padStart(2, "0") 

    const prefix = `${year}${month}`
    let rows = []

    rows = await getLastReceiptNumber(prefix)

    let newIncrement = 1

    if (rows.length > 0) {
        const lastCode = rows[0].receipt_number.toString()
        let lastIncrement = parseInt(lastCode.slice(-4))
        newIncrement = lastIncrement + 1        
    }

    const receiptCode = `${prefix}${String(newIncrement).padStart(4, "0")}`
    
    return receiptCode 
}

router.post('/startCashierSession' ,verifyToken, async (req,res) => {
    const {opening_balance} = req.body
    
    const token = req.cookies.token

    if(!opening_balance)    return res.status(400).json({ message: "Missing opening balance" })
    
    if(isNaN(opening_balance))  return res.status(400).json({ message: "opening balance must be a valid number" })
    
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const cashier = decoded.id
        
        const cashierSessionId = await startCashierSession(cashier, opening_balance)

        const isDev = process.env.MODE === 'DEV'

        res.cookie("cashierSessionId", cashierSessionId, {
        httpOnly: true, 
        secure: !isDev, 
        sameSite: isDev ? "lax" : "none",
        maxAge: 60 * 60 * 12000,
        partitioned: !isDev,
        })        

        return res.status(200).json({ message: "CASHIER SESSION STARTED SUCCESSFULLY" })
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})

router.post('/endCashierSession' ,verifyToken, async (req,res) => {
    const {closing_balance} = req.body
    
    const cashierSessionId = req.cookies.cashierSessionId    

    if(!closing_balance) return res.status(400).json({ message: "Missing closing balance" })

    if(isNaN(closing_balance)) return res.status(400).json({ message: "closing balance must be a valid number" })    
    
    try {        
        await endCashierSession(cashierSessionId,closing_balance)

        return res.status(200).json({ message: "CASHIER SESSION ENDED SUCCESSFULLY" })
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})

router.get('/getSalesHistories', verifyToken, async (req, res) => {
    const token = req.cookies.token
    try {
        const {from = null,to = null,page = 1,limit = 10,search = ""} = req.query
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        let cashierId = null
        if(decoded.role){
            cashierId = decoded.id
        }
        else if(!decoded.role){
            cashierId = null
        }
        else{
            return res.status(401).json({ message: "Unauthorized" })
        }
        
        const history = await getSalesHistories({from,to,page: Number(page),limit: Number(limit),search,cashierId})

        return res.status(200).json(history)
    } 
    catch (err) {      
        console.error(err)
        return res.status(500).json({message: "Unexpected Error occurred",error: err})
    }    
})

router.get('/getSalesHistory' ,verifyToken, async (req,res) => {
    const { hId } = req.query
    
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

router.get('/cashiersessionsummary' ,verifyToken, async (req,res) => {    
    const cs_id = req.cookies.cashierSessionId    
    try {
        const result = await getCashiesSessionSummary(cs_id)
        if (!result || result.length === 0) {
            return res.status(404).json({message: "NO SUMMARY FOUND"})
        }
        return res.status(200).json(result)
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }    
})

router.get('/cashiersessioninfo' ,verifyToken, async (req,res) => {    
    const cs_id = req.cookies.cashierSessionId    
    try {
        const result = await getCashiesSessionInfo(cs_id)
        if (!result || result.length === 0) {
            return res.status(404).json({message: "NO SESSION FOUND"})
        }
        return res.status(200).json(result)
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }    
})


module.exports = router