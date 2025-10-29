const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')

dotenv.config()

function verifyToken(req,res){
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } 
    catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

module.exports = {verifyToken};