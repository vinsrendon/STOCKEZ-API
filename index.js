const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

app.listen(8080, ()=>{
    console.log("server running on port http://localhost:8080/");
});


app.get("/", (req, res)=>{      
    res.json(
        {
            message: "Welcome to StockEZ: Inventory Management and POS System"
        }
    );
});

const userRouter = require("./routes/users.js")
const expenseRouter = require("./routes/expenses.js")
const inventoryRouter = require("./routes/inventory.js")

app.use(userRouter , expenseRouter, inventoryRouter)
