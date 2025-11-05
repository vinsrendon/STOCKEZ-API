const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')

dotenv.config()

const  { addPurchaseHistory, addPurchaseHistoryItems} = require('../database.js')
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

module.exports = router