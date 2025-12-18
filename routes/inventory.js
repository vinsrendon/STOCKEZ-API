const express = require("express")
const jwt = require("jsonwebtoken")
const router = express.Router()
const dotenv = require('dotenv')

dotenv.config()

const  { getStockMovement, addProduct, getProducts, addBatch, getBatch, getItem, mostSoldToday, mostSoldMonth, lowStockAlert, getCategories, addCategory, dltCategory, getUOM, addUOM, dltUOM, itemsSold, countSoldToday, countSoldWeek} = require('../database.js')
const { verifyToken } = require("./verify.js")

router.get('/countsoldtoday',verifyToken, async (req,res) =>{
    try {
        const count = await countSoldToday()     
        if (!count || count.length === 0) {
            return res.status(203).json({
                message: "NO COUNT TODAY"
            });
        }
        return res.status(200).json(count);
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})
router.get('/countsoldweek',verifyToken, async (req,res) =>{
    try {
        const count = await countSoldWeek()     
        if (!count || count.length === 0) {
            return res.status(203).json({
                message: "NO COUNT TODAY"
            });
        }
        return res.status(200).json(count);
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

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
    const {barcode,description,category,uom} = req.body
    
    if (!barcode || !description || !category) {
        return res.status(422).json({ message: "Fill all necessary fields." })        
    }       

    try {
        await addProduct(barcode,description.toUpperCase(),category,uom)
        res.status(200).json({message: "PRODUCT ADDED SUCCESSFULLY"})
    } catch (err) {
        res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

router.get('/getproducts' ,verifyToken, async (req,res) => {    
    try {
        const products = await getProducts()
        if (!products || products.length === 0) {
            return res.status(404).json({message: "NO PRODUCTS FOUND"})
        }
        return res.status(200).json(products)
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }    
})

router.post('/addbatch' ,verifyToken, async (req,res) => {
    const {pid,dDate,eDate,qty,bp,sp} = req.body

    const token = req.cookies.token

    if (!pid || !dDate || !qty || !bp || !sp) {
        return res.status(422).json({ message: "Fill all necessary fields." })        
    } 
    else if (qty <= 0 || bp <= 0 || sp <= 0) {
        return res.status(422).json({ message: "Invalid numeric values." })
    }

    
    try {      
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)    
        const uid = decoded.id

        await addBatch(pid,dDate,eDate,qty,bp,sp,uid)

        return res.status(200).json({message: "BATCH ADDED SUCCESSFULLY"})
    } catch (err) {
        return res.status(500).json({message: "CANNOT ADDED BATCH", error:err})
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
    
    if(!category_id){
        return res.status(422).json({ message: "Fill all necessary fields." })
    }
    try {
        const row = await dltCategory(category_id)

        if (!row || row === 0) {
            return res.status(404).json({ message: "CATEGORY NOT FOUND" })
        }

        return res.status(200).json({message: "CATEGORY DELETED SUCCESSFULLY"})
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})
router.get('/getuom',verifyToken, async (req,res) =>{
    try {
        const uom = await getUOM()
        if (!uom || uom.length === 0) {
            return res.status(404).json({message: "NO UOM FOUND"})
        }
        return res.status(200).json(uom)
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})
router.post('/adduom',verifyToken, async (req,res) =>{
    const {uom_name} = req.body
    if(!uom_name){
        return res.status(422).json({ message: "Fill all necessary fields." })
    }
    try {
        await addUOM(uom_name.toUpperCase())
        return res.status(200).json({message: "UOM ADDED SUCCESSFULLY"})
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})
router.delete('/dltuom',verifyToken, async (req,res) =>{
    const {uom_id} = req.query
    
    if(!uom_id){
        return res.status(422).json({ message: "Fill all necessary fields." })
    }
    try {
        const row = await dltUOM(uom_id)

        if (!row || row === 0) {
            return res.status(404).json({ message: "UOM NOT FOUND" })
        }

        return res.status(200).json({message: "UOM DELETED SUCCESSFULLY"})
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})
router.get('/itemssold',verifyToken, async (req,res) =>{
    try {
        const items = await itemsSold()
        if (!items || items.length === 0) {
            return res.status(404).json({message: "NO ITEMS FOUND"})
        }
        return res.status(200).json(items)
    } catch (err) {
        return res.status(500).json({message: "UNEXPECTED ERROR OCCURED", error:err})
    }
})

module.exports = router