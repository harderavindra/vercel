import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import signedUrlRoutes from "./routes/signedUrlRoutes.js";
import masterDataRoutes from "./routes/masterDataRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import brandTreasuryRoutes from "./routes/brandTreasuryRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js"
import directShortenRoutes from "./routes/directShortenRoutes.js";

import cookieParser from 'cookie-parser';
import { bucket, uuidv4 } from './config/storage.js';

dotenv.config();

const app = express();

app.use(express.json());

app.use(cookieParser());



app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://vercel-frontend-henna.vercel.app',
    'https://www.adbee.in', 'https://adbee.in'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH','DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // Allows sending cookies with requests
}));



mongoose.connect(process.env.MONGODB_URL)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/users", userRoutes);
app.use('/api/files', signedUrlRoutes);
app.use("/api/master", masterDataRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/brand-treasury", brandTreasuryRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use("/d", directShortenRoutes);

app.get('/', (req, res) => {
    res.send('working');
});

app.get('/health', async (req, res) => {
  try {
    // List files in the bucket as a simple connectivity check
    const [files] = await bucket.getFiles();
    res.status(200).json({ message: 'Connection successful', files: files.map(f => f.name) });
  } catch (error) {
    console.error('Connection failed:', error.message);
    res.status(500).json({ message: 'Connection failed', error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
