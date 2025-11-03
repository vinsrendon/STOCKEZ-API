const express = require("express")
const router = express.Router()

const  { addPurchaseHistory, addPurchaseHistoryItems} = require('../database.js')
const { verifyToken } = require("./verify.js")

router.post('/addpurchasehistory' , async (req,res) => {
    const {purchase_amount,purchase_total,amount_tendered,amount_change} = req.body
    
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    try {
        verifyToken(req,res)

        await addPurchaseHistory(purchase_amount,cashier,purchase_total,amount_tendered,amount_change)
        res.status(200).json("PURCHASE HISTORY SAVED");
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})

module.exports = router