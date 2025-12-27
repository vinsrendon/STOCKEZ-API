const express = require("express")
const bcrypt = require("bcrypt")
const router = express.Router()
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')
const {verifyToken} = require('./verify.js')

dotenv.config()

const  { getUsers , registerUser, loginUser, getUserById, changeUserStatus, resetUserPassword} = require('../database.js')

router.get('/users' ,verifyToken, async (req,res) => {
    const token = req.cookies.token;
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const users = await getUsers()
        const filteredUsers = users.filter(user => user.uid !== decoded.id);
        return res.status(200).json(filteredUsers);
    } 
    catch (err) {      
        return res.status(500).json({ message: "Unexpected Error occurred",error:err });
    }    
})

router.get('/userbyid' ,verifyToken, async (req,res) => {
    const {uid} = req.body

    try {        
        const user = await getUserById(uid)
        return res.status(200).json(user);
    } 
    catch (err) {   
        return res.status(500).json({ message: "Unexpected Error occurred",error:err });
    }    
})

router.post('/changeuserstatus' ,verifyToken, async (req,res) => {
    const {uid} = req.body

    try {        
        await changeUserStatus(uid)
        return res.status(200).json({message:"User Status Successfully Changed"});
    } 
    catch (err) {
        return res.status(500).json({ message: "Unexpected Error occurred",error:err });
    }    
})



router.post("/login" , async (req,res) => {
    const {username,password} = req.body    

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    try {
        const user = await loginUser(username)              
        
        if (user[0]) {
            const userbyid = await getUserById(user[0].uid)
            const isValid = await bcrypt.compare(password,user[0].password)

            if(user[0].status === 0) return res.status(404).json({message: "NO USER FOUND"})

            if(isValid){
                const fname = userbyid[0].firstname;
                const lname = userbyid[0].lastname;
                const name = lname.charAt(0).toUpperCase() + "." + fname.charAt(0).toUpperCase() + fname.slice(1).toLowerCase();
                const token = jwt.sign({ id: user[0].uid, user: user[0].username,name:name,role:user[0].role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "12h" });

                const isDev = process.env.MODE === 'DEV'
                
                res.cookie("token", token, {
                httpOnly: true, 
                secure: !isDev,
                sameSite: isDev ? "lax" : "none",
                maxAge: 60 * 60 * 12000, 
                partitioned: !isDev,
                });

                return res.status(200).json({message: "LOGGED IN", username:user[0].username,name:name, role:user[0].role})
            }
            else
                return res.status(403).json({message: "WRONG USER OR PASS"})
        } 
        else {
            return res.status(404).json({message: "NO USER FOUND"})
        }

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Unexpected Error occurred",error:err });
    }
})

router.post("/logout", (req, res) => {
    const cookiesToClear = ["token", "cashierSessionId"];

    clearCookies(res, cookiesToClear);
    
    return res.status(200).json({ message: "Logged out" });
});

function clearCookies(res, cookieNames) {
    const isDev = process.env.MODE === 'DEV'    
    
    const cookieOptions = {
        httpOnly: true,
        secure: !isDev,
        sameSite: isDev ? "lax" : "none",
        partitioned: !isDev,        
    };

    cookieNames.forEach(name => {
        res.clearCookie(name, cookieOptions);
    });
}

router.post("/register" ,verifyToken, async (req,res) => {
    const {username,password,role,flag,fname,mname,lname,pnumber,address} = req.body   

    if (!username || !password || !role || !flag|| !fname || !lname|| !pnumber|| !address) {
        return res.status(422).json({message: "Fill all necessary fields." })
    }       

    try {
        const hash = await bcrypt.hash(password,13) 

        await registerUser(username,hash,role,flag,fname,mname,lname,pnumber,address)
        
        return res.status(200).json({message: "REGISTERED SUCCESSFULLY"})
    } catch (error) {
        if(error.code === "ER_DUP_ENTRY") return res.status(409).json({message: "USERNAME ALREADY EXIST"})
        
        else return res.status(500).json({message: "ERROR", error})        
    }
})

router.post("/resetpassword" ,verifyToken, async (req,res) => {
    const password = "password1"   
    const {uid} = req.body  

    try {
        const hash = await bcrypt.hash(password,13) 

        await resetUserPassword(uid,hash)
        
        return res.status(200).json({message: "PASSWORD RESET SUCCESSFULLY"})
    } catch (error) {
        return res.status(500).json({message: "ERROR", error})        
    }
})

router.get("/verify",verifyToken, (req, res) => {
    const token = req.cookies.token;
    
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
    return res.status(200).json({message: "user verified", user: decoded});
});

module.exports = router