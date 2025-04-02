import express from "express";
import { authenticate, deleteUser, getAllusers, getUserById, getUserProfile, login, logout, registerUser, updateUser } from "../controllers/userController.js";

const router = express.Router();

// Create User
router.post("/", authenticate, registerUser);

// Get All Users
router.post("/login", login);                           // 1. Specific: Login
router.post("/logout", logout);                         // 2. Specific: Logout
router.get("/profile", authenticate, getUserProfile);    // 3. Specific: Profile
router.get("/", authenticate, getAllusers);                           // 4. Generic: Get All Users

router.get("/:id", getUserById);                         // 5. Generic: Get User by ID
router.put("/:id", authenticate, updateUser);
router.delete("/:id", deleteUser);    


export default router;
