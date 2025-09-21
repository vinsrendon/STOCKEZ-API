const express = require("express")
const router = express.Router()
const {verifyToken} = require('./verify.js')

const  { addExpense ,getExpenses } = require('../database.js')

router.post("/addexpense" , async (req,res) => {
    const {biller,expense_description,expense_amount,expense_date} = req.body

    if (!biller || !expense_description || !expense_amount || !expense_date) {
        return res.status(400).json({ message: "Fill all necessary fields." })
    }

    try {
        verifyToken(req,res)

        await addExpense(biller,expense_description,expense_amount,expense_date)
        res.status(200).json({message: "EXPENSE ADDED SUCCESSFULLY"})
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

router.get("/getexpense" , async (req,res) => {
    try {
        verifyToken(req,res)

        const expenses = await getExpenses()
        return res.status(200).json(expenses);
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

module.exports = router