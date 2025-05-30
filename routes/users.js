const express = require("express")
const router = express.Router()

router.post("/login" , (req,res) => {
    res.json(
        {
            message: "LOGGED IN"
        }
    );
})

router.post("/register" , (req,res) => {
    res.json(
        {
            message: "REGISTERED"
        }
    );
})

module.exports = router