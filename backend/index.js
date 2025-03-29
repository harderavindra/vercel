import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import signedUrlRoutes from "./routes/signedUrlRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
    // origin: 'https://vercel-frontend-henna.vercel.app', // Replace with your frontend domain
    origin: 'http://localhost:5173', // Replace with your frontend domain
    
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

mongoose.connect(process.env.MONGODB_URL)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/users", userRoutes);
app.use('/api/files', signedUrlRoutes);

app.get('/', (req, res) => {
    res.send('working');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
