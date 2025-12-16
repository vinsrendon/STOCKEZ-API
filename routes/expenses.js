const express = require("express")
const router = express.Router()
const {verifyToken} = require('./verify.js')

const  { addExpense ,getExpenses,expenses } = require('../database.js')

router.post("/addexpense" ,verifyToken, async (req,res) => {
    const {biller,expense_description,expense_amount,expense_date} = req.body

    if (!biller || !expense_description || !expense_amount || !expense_date) {
        return res.status(422).json({ message: "Fill all necessary fields." })
    }

    try {
        await addExpense(biller,expense_description,expense_amount,expense_date)
        return res.status(200).json({message: "EXPENSE ADDED SUCCESSFULLY"})
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

router.get("/getexpense" ,verifyToken, async (req,res) => {    
    try {
        const expenses = await getExpenses()
        if (!expenses || expenses === 0) {
            return res.status(404).json({ message: "EXPENSES NOT FOUND" })
        }
        return res.status(200).json(expenses);
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

router.get("/expenses" ,verifyToken, async (req,res) => {    
    try {
        const expensesList = await expenses()
        if (!expensesList || expensesList === 0) {
            return res.status(404).json({ message: "EXPENSES NOT FOUND" })
        }
        return res.status(200).json(expensesList);
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

module.exports = router