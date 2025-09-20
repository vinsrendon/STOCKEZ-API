const express = require("express")
const bcrypt = require("bcrypt")
const router = express.Router()
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')
const {verifyToken} = require('./verify.js')

dotenv.config()
const SECRET = process.env.ACCESS_TOKEN_SECRET;

const  { getUsers , registerUser, loginUser } = require('../database.js')

router.get('/users' , async (req,res) => {
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    try {
        verifyToken(req,res);
        
        const users = await getUsers()
        return res.status(200).json(users);
    } 
    catch (err) {
        console.log(err);        
        return res.status(500).json({ message: "Unexpected Error occurred",error:err });
    }    
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

            if(isValid){
                const token = jwt.sign({ user: user[0].username,role:user[0].role }, SECRET, { expiresIn: "12h" });

                res.cookie("token", token, {
                httpOnly: true, 
                secure: false,    // set to true in production with HTTPS
                sameSite: "strict",
                maxAge: 60 * 60 * 12000 // 12 hour
                });

                return res.status(200).json({message: "LOGGED IN", username:user[0].username, role:user[0].role})
            }
            else
                return res.status(401).json({message: "WRONG USER OR PASS"})

        } else {
            return res.status(401).json({message: "NO USER FOUND"})
        }

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Unexpected Error occurred",error:err });
    }
})

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out" });
});

router.post("/register" , async (req,res) => {
    const {username,password,role,flag,fname,mname,lname,pnumber,address} = req.body   

    if (!username || !password || !role || !flag|| !fname || !lname|| !pnumber|| !address) {
        return res.status(200).json({message: "Fill all necessary fields." })
    }       

    try {
        verifyToken(req,res)

        const hash = await bcrypt.hash(password,13) 

        await registerUser(username,hash,role,flag,fname,mname,lname,pnumber,address)
        
        return res.status(200).json({message: "REGISTERED SUCCESSFULLY"})
    } catch (error) {
        return console.log(error)
    }
})

router.get("/verify", (req, res) => {
    const token = req.cookies.token;
  
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, SECRET);        
        return res.status(200).json({message: "user verified", user: decoded});
    } 
    catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
});



module.exports = router