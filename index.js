const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const dotenv = require('dotenv')

dotenv.config()
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

const app = express()

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || origin.match(/^http?:\/\/.*:5173$/) || origin.match(/^http?:\/\/.*:4173$/)) {
        callback(null, true);
      } 
      else if(origin.includes(allowedOrigins)){
        callback(null, true);
      }
      else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json())
app.use(cookieParser());



const PORT = 8080;

app.listen(PORT, ()=>{
    console.log(`SERVER IS RUNNING`);
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
const cashierRouter = require("./routes/cashier.js")

app.use(userRouter , expenseRouter, inventoryRouter, maintenanceRouter,cashierRouter)
