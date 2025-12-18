const express = require("express")
const router = express.Router()
const {verifyToken} = require('./verify.js')
const PDFDocument = require('pdfkit')
const fs = require('fs')

const  { getItemsSold, getCashflowSales, getCashflowExpenses} = require('../database.js')

router.get("/getitemssold" ,verifyToken, async (req,res) => {  
    const { from, to } = req.query;  
    try {
        const items = await getItemsSold(from,to)
        if (!items || items === 0) {
            return res.status(404).json({ message: "SOLD ITEMS NOT FOUND" })
        }
        return res.status(200).json(items);
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})
router.get("/getcashflowexpense" ,verifyToken, async (req,res) => {  
    const { from, to } = req.query;  
    try {
        const expense = await getCashflowExpenses(from,to)
        if (!expense || expense === 0) {
            return res.status(404).json({ message: "EXPENSE ITEMS NOT FOUND" })
        }
        return res.status(200).json(expense);
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

router.get("/cashflow/pdf" ,verifyToken, async (req,res) => { 
    try {
        const { from, to } = req.query;

        if (!from || !to) {
        return res.status(400).send("Please provide 'from' and 'to' dates in YYYY-MM-DD format");
        }

        // Fetch sales within date range
        const sales = await getCashflowSales(from, to)    

        // Fetch expenses within date range
        const expenses = await getCashflowExpenses(from, to)
        const items = await getItemsSold(from,to)
        // console.log(items);
        
        // console.log(sales ,expenses);
        
        // Calculate totals
        // const totalIncome = sales.reduce((sum, s) => sum + parseFloat(s.purchase_total), 0);
        const totalSales = items.reduce((sum, i) => sum + parseFloat(i.sold_price*i.total_quantity), 0);
        const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.expense_amount), 0);
        const netCashFlow = totalSales - totalExpense;

        // Create PDF
        const doc = new PDFDocument({ margin: 36, size: "A4" });
        doc.font('Helvetica')
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=cashflow_${from}_to_${to}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text("Cash Flow Statement", { align: "center" });
        doc.fontSize(12).text(`From: ${from}  To: ${to}`, { align: "center" });
        doc.moveDown();

        // Income Table
        doc.font('Helvetica-Bold')
        doc.fontSize(16).text("Inflow", { underline: true ,align:'center'});
        let y = doc.y + 10;

        doc.font('Helvetica')
        // const incometableData = [
        //     [
        //         {text:"Receipt",align:'center'},
        //         {text:"Date",align:'center'},
        //         {text:"Amount",align:'center'}
        //     ],
        //     ...sales.map(s => ([
        //         {text:s.receipt_number,align:'center'},
        //         {text:s.date,align:'center'},
        //         {text: `Php. ${parseFloat(s.purchase_total).toFixed(2)}`,align:'center'}
        //     ]))
        // ]
        // doc.fontSize(12).table({
        //     rowStyles: (i) => {                
        //         return i < 1 ? { border: [0, 0, 1, 0] } : { border: false }
        //     },
        //     columnStyles: ["*","*","*"],
        //     data: incometableData
        // })
        const itemsTableData = [
            [
                {text:"Barcode",align:'center'},
                {text:"Description",align:'center'},
                {text:"Price",align:'center'},
                {text:"Amount",align:'center'},
                {text:"Total",align:'center'},
            ],
            ...items.map(i => ([
                {text:i.barcode,align:'center'},
                {text:i.description,align:'left'},
                {text: `Php. ${parseFloat(i.sold_price).toFixed(2)}`,align:'center'},
                {text:i.total_quantity,align:'center'},
                {text: `Php. ${parseFloat(Number(i.sold_price*i.total_quantity)).toFixed(2)}`,align:'left'}
            ]))
        ]
        doc.fontSize(12).table({
            
            columnStyles: ["*","*","*",50,"*"],
            data: itemsTableData
        })
        doc.moveDown(4)

        // Expenses Table
        doc.fontSize(16).text("Outflow", { underline: true, align:'center' });
        y = doc.y + 10;
        const expenesetableData = [
            [
                {text:"Biller",align:'center'},
                {text:"Description",align:'center'},
                {text:"Date",align:'center'},
                {text:"Amount",align:'center'}
            ],
            ...expenses.map(e => ([
                {text:e.biller,align:'center'},
                {text:e.expense_decs,align:'center'},
                {text:e.date,align:'center'},
                {text: `Php. ${parseFloat(e.expense_amount).toFixed(2)}`,align:'center'}
            ]))
        ]
        doc.fontSize(12).table({
            // rowStyles: (i) => {                
            //     return i < 1 ? { border: [0, 0, 1, 0] } : { border: false }
            // },
            columnStyles: ["*","*",70,"*"],
            data: expenesetableData
        })

        doc.moveDown(2)

        // Totals
        doc.fontSize(14).text(`Total Sales: Php.${totalSales.toFixed(2)}`);
        doc.text(`Total Expenses: Php. ${totalExpense.toFixed(2)}`);
        doc.text(`Cash Flow: Php. ${netCashFlow.toFixed(2)}`, { underline: true });

        doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating cash flow PDF");
  }
})

module.exports = router