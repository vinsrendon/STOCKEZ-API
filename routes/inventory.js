const express = require("express")
const jwt = require("jsonwebtoken")
const router = express.Router()

const  { addProduct, getProducts, addBatch, getBatch, getItem, stock_history} = require('../database.js')
const { verifyToken } = require("./verify.js")

router.post("/addproduct" ,verifyToken, async (req,res) => {
    const {barcode,description,category} = req.body

    if (!barcode || !description || !category) {
        return res.status(422).json({ message: "Fill all necessary fields." })        
    }       

    try {
        await addProduct(barcode,description,category)        
        res.status(200).json({message: "PRODUCT ADDED SUCCESSFULLY"})
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

router.get('/getproducts' ,verifyToken, async (req,res) => {    
    try {
        const products = await getProducts()
        return res.status(200).json(products);
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }    
})

router.post('/addbatch' ,verifyToken, async (req,res) => {
    const {pid,dDate,mDate,eDate,qty,uom,bp,sp} = req.body
    
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const uid = decoded.id

        const bid = await addBatch(pid,dDate,mDate,eDate,qty,uom,bp,sp)
        
        await stock_history(uid,pid,bid)

        return res.status(200).json("BATCH ADDED SUCCESSFULLY");
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }    
})

router.get('/getbatch/:bid' ,verifyToken, async (req,res) => {
    const {bid} = req.params        

    if (!bid) {
        return res.status(422).json({message: "missing argument." })
    }

    try {
        const batch = await getBatch(bid)
        return res.status(200).json(batch);
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err});
    }
    
})

router.get('/getitem/:barcode',verifyToken, async (req,res) =>{
    const {barcode} = req.params; 

    if (!barcode) {
        return res.status(422).json({message: "missing argument." })
    }   

    try {
        const item = await getItem(barcode)
        return res.status(200).json(item);
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

module.exports = router