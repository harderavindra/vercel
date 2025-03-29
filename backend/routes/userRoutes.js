import express from "express";
import { getAllusers, registerUser } from "../controllers/userController.js";

const router = express.Router();

// Create User
router.post("/", registerUser);

// Get All Users
router.get("/", getAllusers);

export default router;
