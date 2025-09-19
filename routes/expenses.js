const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')

dotenv.config()
const SECRET = process.env.ACCESS_TOKEN_SECRET;

const  { addExpense ,getExpenses } = require('../database.js')

router.post("/addexpense" , async (req,res) => {
    const {biller,expense_description,expense_amount,expense_date} = req.body

    if (!biller || !expense_description || !expense_amount || !expense_date) {
        return res.json({ message: "Fill all necessary fields." })
    }

    try {
        await addExpense(biller,expense_description,expense_amount,expense_date)
        res.json({message: "EXPENSE ADDED SUCCESSFULLY"})
    } catch (error) {
        console.log(error);
    }
})

router.get("/getexpense" , async (req,res) => {
    const token = req.cookies.token;
    
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        try {
            const decoded = jwt.verify(token, SECRET);
        } catch (error) {
            return res.status(401).json({ message: "Invalid token" });
        }
        const expenses = await getExpenses()
        return res.json(expenses);
    } catch (error) {
        return console.log(error);
    }
})

module.exports = router