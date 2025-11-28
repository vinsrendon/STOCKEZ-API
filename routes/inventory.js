const express = require("express")
const jwt = require("jsonwebtoken")
const router = express.Router()

const  { addProduct, getProducts, addBatch, getBatch, getItem, stock_history} = require('../database.js')
const { verifyToken } = require("./verify.js")

router.post("/addproduct" , async (req,res) => {
    const {barcode,description,category} = req.body

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    if (!barcode || !description || !category) {
        return res.json({ message: "Fill all necessary fields." })        
    }       

    try {
        verifyToken(req,res)

        await addProduct(barcode,description,category)        
        res.status(200).json({message: "PRODUCT ADDED SUCCESSFULLY"})
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

router.get('/getproducts' , async (req,res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    try {
        verifyToken(req,res)

        const products = await getProducts()
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})

router.post('/addbatch' , async (req,res) => {
    const {pid,dDate,mDate,eDate,qty,uom,bp,sp} = req.body
    
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    try {
        verifyToken(req,res)

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const uid = decoded.id

        const bid = await addBatch(pid,dDate,mDate,eDate,qty,uom,bp,sp)
        
        await stock_history(uid,pid,bid)

        res.status(200).json("BATCH ADDED SUCCESSFULLY");
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})

router.get('/getbatch/:bid' , async (req,res) => {
    const {bid} = req.params

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    try {
        verifyToken(req,res)

        const batch = await getBatch(bid)
        res.status(200).json(batch);
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err});
    }
    
})

router.get('/getitem/:barcode',async (req,res) =>{
    const {barcode} = req.params;

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    try {
        verifyToken(req,res)

        const item = await getItem(barcode)
        res.status(200).json(item);
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

module.exports = router