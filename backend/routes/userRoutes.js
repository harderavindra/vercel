import express from "express";
import { authenticate, getAllusers, getUserProfile, login, registerUser } from "../controllers/userController.js";

const router = express.Router();

// Create User
router.post("/", registerUser);

// Get All Users
router.get("/", getAllusers);
router.post("/login", login);
router.get('/profile', authenticate, getUserProfile); // Profile route, protected by authentication middleware


export default router;
