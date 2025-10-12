import express from 'express'
const app = express()
import dotenv from 'dotenv'
dotenv.config();
import cors from "cors"
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

import connectDB from './config/config.db.js';
import authroutes from './routes/authroutes.js';
import chatroutes from './routes/chatroutes.js';
import statusroutes from './routes/statusroutes.js';


// MongoDataBase connection
connectDB();


// Allow specific frontend to use backend
const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true, // allow cookie/auth headers
}

// Middlewares
app.use(cors(corsOptions))
// app.use(cors())
app.use(express.json()) // parse the body data
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }))



// routes
app.get('/', (req, res) => {
    res.send('Hello World!');
})


app.use("/api/auth", authroutes)

app.use("/api/chats", chatroutes)

app.use("/api/status", statusroutes)

export default app; 