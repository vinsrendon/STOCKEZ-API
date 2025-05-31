const express = require("express")
const bcrypt = require("bcrypt")
const router = express.Router()

const  { getUsers , registerUser, loginUser } = require('../database.js')

router.get('/users' , async (req,res) => {
    const users = await getUsers()
    res.json(users);
})

router.post("/login" , async (req,res) => {
    const {username,password} = req.body

    if (!username || !password) {
        return res.json({ message: "Username and password are required." });
    }

    try {
        const user = await loginUser(username)

        if (user[0]) {            
            const isValid = await bcrypt.compare(password,user[0].password)

            if(isValid)
                res.json({message: "LOGGED IN"})

            else
                res.json({message: "WRONG USER OR PASS"})

        } else {
            res.json({message: "NO USER FOUND"})
        }        

    } catch (error) {
        console.log(error);        
    }
})

router.post("/register" , async (req,res) => {
    const {username,password,role,flag,fname,mname,lname,pnumber,address} = req.body

    if (!username || !password || !role || !flag|| !fname|| !mname|| !lname|| !pnumber|| !address) {
        return res.json({ message: "Fill all necessary fields." })
    }       

    try {
        const hash= await bcrypt.hash(password,13) 

        await registerUser(username,hash,role,flag,fname,mname,lname,pnumber,address)
        
        res.json({message: "REGISTERED SUCCESSFULLY"})
    } catch (error) {
        console.log(error)
    }
})

module.exports = router