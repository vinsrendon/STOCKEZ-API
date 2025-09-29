const express = require("express")
const router = express.Router()

const  { addSKU , getSKU} = require('../database.js')
const { verifyToken } = require("./verify.js")

router.post("/addSKU" , async (req,res) => {
    const {product_name,manufacturer} = req.body
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    if (!product_name || !manufacturer) {
        return res.json({ message: "Fill all necessary fields." })        
    }       

    try {
        verifyToken(req,res)

        await addSKU(product_name,manufacturer)        
        res.status(200).json({message: "SKU ADDED SUCCESSFULLY"})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

router.get('/getSKU' , async (req,res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
        verifyToken(req,res)

        const sku = await getSKU()
        res.status(200).json(sku);
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})

module.exports = router