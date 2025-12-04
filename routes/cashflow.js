const express = require("express")
const router = express.Router()
const {verifyToken} = require('./verify.js')
const PDFDocument = require('pdfkit')
const fs = require('fs')

const  { getCashflowRows} = require('../database.js')

router.get("/cashflow" ,verifyToken, async (req,res) => {   
    const { from,to } = req.query;

    if(!from || !to){
        return res.status(422).json({ message: "Missing require fields" });
    }
    
    try {
        const result = await getCashflowRows(from,to)
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

module.exports = router