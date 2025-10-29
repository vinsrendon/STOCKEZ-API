const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")


const app = express()

app.use(cors({
    // origin:'http://localhost:5173',
    origin: function (origin, callback) {
    // Allow any origin that ends with :5173
    if (!origin || origin.match(/^http:\/\/.*:5173$/ || origin == 'https://stockez-frontend.netlify.app/')) {
      callback(null, true);
    } 
    
    else {
      callback(new Error("Not allowed by CORS"));
    }
  },
    credentials:true
}))
app.use(express.json())
app.use(cookieParser());



const PORT = 8080;

app.listen(PORT, ()=>{
    console.log(`server running on port http://localhost:${PORT}/`);
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
const maintenanceRouter = require("./routes/maintenance.js")

app.use(userRouter , expenseRouter, inventoryRouter, maintenanceRouter)
