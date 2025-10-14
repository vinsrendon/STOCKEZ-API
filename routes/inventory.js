const express = require("express")
const router = express.Router()

const  { addProduct, getProducts,addBatch,getBatch} = require('../database.js')
const { verifyToken } = require("./verify.js")

router.post("/addproduct" , async (req,res) => {
    const {barcode,description} = req.body

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    if (!barcode || !description) {
        return res.json({ message: "Fill all necessary fields." })        
    }       

    try {
        verifyToken(req,res)

        await addProduct(barcode,description)        
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

        await addBatch(pid,dDate,mDate,eDate,qty,uom,bp,sp)
        res.status(200).json("BATCH ADDED SUCCESSFULLY");
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})

router.post('/getbatch' , async (req,res) => {
    const {pid} = req.body

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    try {
        verifyToken(req,res)

        const batch = await getBatch(pid)
        res.status(200).json(batch);
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})

module.exports = router