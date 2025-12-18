const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const dotenv = require('dotenv')
const { Server } = require('socket.io')
const http = require('http')

dotenv.config()
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

const app = express()

app.use(
  cors({
    origin: function (origin, callback) {
      console.log(origin);
      
      if (!origin || origin.match(/^http?:\/\/.*:5173$/) || origin.match(/^http?:\/\/.*:4173$/)) {
        callback(null, true);
      } 
      else if(allowedOrigins.includes(origin)){
        callback(null, true);
      }
      else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/paymongo/webhook')) {
    return next()
  }
  express.json()(req, res, next)
})

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || origin.match(/^http?:\/\/.*:5173$/) || origin.match(/^http?:\/\/.*:4173$/)) {
        callback(null, true);
      } 
      else if(allowedOrigins.includes(origin)){
        callback(null, true);
      }
      else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ['GET', 'POST'],
    credentials:true,
  }
})
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET","POST"],
//     credentials: true,
//   }
// })

io.on('connection', (socket) => {
  // console.log('🟢 Client connected:', socket.id)

  socket.on('join-checkout', (checkoutSessionId) => {
    socket.join(checkoutSessionId)
    // console.log(`Client joined room: ${checkoutSessionId}`)
  })

  socket.on('disconnect', () => {
    // console.log('🔴 Client disconnected:', socket.id)
  })
})
app.set('io', io)

app.use(cookieParser());

const PORT = 8080;

server.listen(PORT, ()=>{
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
const cashflowRouter = require("./routes/cashflow.js")
const paymentsRouter = require("./routes/payment.js")

app.use(userRouter , expenseRouter, inventoryRouter, maintenanceRouter,cashierRouter,cashflowRouter,paymentsRouter)
