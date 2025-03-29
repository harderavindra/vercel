import express from "express";
import User from "../models/User.js";
import { getAllusers, registerUser } from "../controller/userController.js";

const router = express.Router();

// Create User
router.post("/", registerUser);

// Get All Users
router.get("/", getAllusers);

export default router;
