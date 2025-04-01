import express from "express";
import { authenticate, getAllusers, getUserProfile, login, logout, registerUser } from "../controllers/userController.js";

const router = express.Router();

// Create User
router.post("/", registerUser);

// Get All Users
router.get("/", getAllusers);
router.post("/login", login);
router.get('/profile', authenticate, getUserProfile); // Profile route, protected by authentication middleware
router.post('/logout', logout);


export default router;
