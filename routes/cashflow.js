const express = require("express")
const router = express.Router()
const {verifyToken} = require('./verify.js')
const PDFDocument = require('pdfkit')
const fs = require('fs')

const  { getCashflowRows, getCashflowSales, getCashflowExpenses} = require('../database.js')

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
        
        // console.log(sales ,expenses);
        
        // Calculate totals
        const totalIncome = sales.reduce((sum, s) => sum + parseFloat(s.purchase_total), 0);
        const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.expense_amount), 0);
        const netCashFlow = totalIncome - totalExpense;

        // Create PDF
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        doc.font('Helvetica')
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=cashflow_${from}_to_${to}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text("Cash Flow Statement", { align: "center" });
        doc.fontSize(12).text(`From: ${from}  To: ${to}`, { align: "center" });
        doc.moveDown();

        // Income Table
        doc.font('Helvetica-Bold')
        doc.fontSize(16).text("Income", { underline: true ,align:'center'});
        let y = doc.y + 10;

        doc.font('Helvetica')
        const incometableData = [
            [
                {text:"Receipt",align:'center'},
                {text:"Date",align:'center'},
                {text:"Amount",align:'center'}
            ],
            ...sales.map(s => ([
                {text:s.receipt_number,align:'center'},
                {text:s.date,align:'center'},
                {text: `Php. ${parseFloat(s.purchase_total).toFixed(2)}`,align:'center'}
            ]))
        ]
        doc.fontSize(12).table({
            rowStyles: (i) => {                
                return i < 1 ? { border: [0, 0, 1, 0] } : { border: false }
            },
            columnStyles: ["*","*","*"],
            data: incometableData
        })
        doc.moveDown(4)

        // Expenses Table
        doc.fontSize(16).text("Expenses", { underline: true, align:'center' });
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
            rowStyles: (i) => {                
                return i < 1 ? { border: [0, 0, 1, 0] } : { border: false }
            },
            columnStyles: ["*","*","*","*"],
            data: expenesetableData
        })

        doc.moveDown(2)

        // Totals
        doc.fontSize(14).text(`Total Income: Php.${totalIncome.toFixed(2)}`);
        doc.text(`Total Expenses: Php. ${totalExpense.toFixed(2)}`);
        doc.text(`Net Cash Flow: Php. ${netCashFlow.toFixed(2)}`, { underline: true });

        doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating cash flow PDF");
  }
})

module.exports = router