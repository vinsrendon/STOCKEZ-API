const express = require("express")
const jwt = require("jsonwebtoken")
const router = express.Router()
const dotenv = require('dotenv')

dotenv.config()

const  { getStockMovement, addProduct, getProducts, addBatch, getBatch, getItem, stock_history, mostSoldToday, mostSoldMonth, lowStockAlert, getCategories, addCategory, dltCategory} = require('../database.js')
const { verifyToken } = require("./verify.js")

router.get('/stockMovement',verifyToken, async (req,res) =>{
    const {pid} = req.query       

    if (!pid) {
        return res.status(422).json({ message: "Fill all necessary fields." })     
    }
      
    try {
        const items = await getStockMovement(pid)     
        if (!items || items.length === 0) {
            return res.status(203).json({
                message: "NO STOCK MOVEMENT FOUND"
            });
        }
        return res.status(200).json(items);
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

router.post("/addproduct" ,verifyToken, async (req,res) => {
    const {barcode,description,category} = req.body

    if (!barcode || !description || !category) {
        return res.status(422).json({ message: "Fill all necessary fields." })        
    }       

    try {
        await addProduct(barcode,description.toUpperCase(),category)        
        res.status(200).json({message: "PRODUCT ADDED SUCCESSFULLY"})
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

router.get('/getproducts' ,verifyToken, async (req,res) => {    
    try {
        const products = await getProducts()
        return res.status(200).json(products)
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }    
})

router.post('/addbatch' ,verifyToken, async (req,res) => {
    const {pid,dDate,eDate,qty,uom,bp,sp} = req.body
    const token = req.cookies.token;
    try {
        let decoded
        try {
             decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)                  
        } catch (error) {
            return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:error})
        }
        const uid = decoded.id

        const bid = await addBatch(pid,dDate,eDate,qty,uom,bp,sp)
        
        try {
            await stock_history(uid,pid,bid,qty)
        } catch (error) {            
            return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:error})
        }

        return res.status(200).json({message: "BATCH ADDED SUCCESSFULLY"})
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
        if (!batch || batch.length === 0) {
            return res.status(404).json({message: "NO BATCH FOUND FOR THIS ITEM"})
        }
        return res.status(200).json(batch)
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
    
})

router.get('/getitem/:barcode',verifyToken, async (req,res) =>{
    const {barcode} = req.params

    if (!barcode) {
        return res.status(422).json({message: "missing argument." })
    }   

    try {
        const item = await getItem(barcode)
        if (!item || item.length === 0) {
            return res.status(404).json({message: "NO BATCH FOUND FOR THIS ITEM"})
        }
        return res.status(200).json(item)
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

router.get('/mostsoldtoday',verifyToken, async (req,res) =>{
    try {
        const items = await mostSoldToday()     
        if (!items || items.length === 0) {
            return res.status(203).json({
                message: "NO SALES FOUND ON THIS DAY"
            });
        }
        return res.status(200).json(items);
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

router.get('/mostsoldmonth',verifyToken, async (req,res) =>{
    try {
        const items = await mostSoldMonth()
        if (!items || items.length === 0) {
            return res.status(203).json({message: "NO SALES FOUND FOR THIS MONTH"})
        }
        return res.status(200).json(items)
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})
router.get('/lowstockalert',verifyToken, async (req,res) =>{
    try {
        const items = await lowStockAlert()
        if (!items || items.length === 0) {
            return res.status(203).json({message: "STOCK ON NORMAL LEVEL"})
        }
        return res.status(200).json(items)
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})
router.get('/getcategories',verifyToken, async (req,res) =>{
    try {
        const categories = await getCategories()
        if (!categories || categories.length === 0) {
            return res.status(404).json({message: "NO CATEGORIES FOUND"})
        }
        return res.status(200).json(categories)
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})
router.post('/addcategory',verifyToken, async (req,res) =>{
    const {category_name, has_expiration } = req.body
    if(!category_name){
        return res.status(422).json({ message: "Fill all necessary fields." })
    }
    try {
        await addCategory(category_name.toUpperCase(), has_expiration)
        return res.status(200).json({message: "CATEGORY ADDED SUCCESSFULLY"})
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})
router.delete('/dltcategory',verifyToken, async (req,res) =>{
    const {category_id} = req.query
    console.log(category_id);
    
    if(!category_id){
        return res.status(422).json({ message: "Fill all necessary fields." })
    }
    try {
        const row = await dltCategory(category_id)

        if (!row || row === 0) {
            return res.status(404).json({ message: "CATEGORY NOT FOUND" });
        }

        return res.status(200).json({message: "CATEGORY DELETED SUCCESSFULLY"})
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

module.exports = router