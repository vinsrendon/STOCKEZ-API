const express = require("express")
const router = express.Router()

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
    try {
        const expenses = await getExpenses()
        res.json(expenses);
    } catch (error) {
        console.log(error);
    }
})

module.exports = router