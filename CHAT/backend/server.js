const express= require("express");
const dotenv= require("dotenv");
const mongoose= require("mongoose");
const http= require("http");
const {Server}= require("socket.io");
const userRouter=require("./routes/userRoutes");
const groupRouter= require("./routes/groupRoutes");


const socketIo = require("./socket");
const cors= require("cors");
const messageRouter = require("./routes/messageRoutes");
dotenv.config();


const app=express();
const server= http.createServer(app);
const io=new Server(server,{
    cors:{
        origin:["https://groupdesk.netlify.app"],
        methods:["GET","POST"],
        credentials:true
    }
});

// Middlewares

app.use(cors());
app.use(express.json());

// Connect to DB
mongoose.connect(process.env.MONGO_URL)
.then(()=> console.log("MongoDB Connected Successfully !!!!"))
.catch((err)=> console.log("MongoDB connection failed",err))

// Initialize
socketIo(io);

// Our routes
app.use("/api/users",userRouter);
app.use("/api/groups",groupRouter);
app.use("/api/messages",messageRouter);

// Start the server
const PORT= process.env.PORT || 5000;
server.listen(PORT,()=>console.log(`Server is up and running http://localhost:${PORT}`));

