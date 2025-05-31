const express = require("express")
const router = express.Router()

const  { addSKU , getSKU} = require('../database.js')

router.post("/addSKU" , async (req,res) => {
    const {product_name,manufacturer} = req.body

    if (!product_name || !manufacturer) {
        return res.json({ message: "Fill all necessary fields." })        
    }       

    try {
        await addSKU(product_name,manufacturer)
        
        res.json({message: "SKU ADDED SUCCESSFULLY"})
    } catch (error) {
        console.log(error)
    }
})

router.get('/getSKU' , async (req,res) => {
    const sku = await getSKU()
    res.json(sku);
})

module.exports = router