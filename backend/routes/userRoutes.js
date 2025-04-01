import express from "express";
import { getAllusers, login, registerUser } from "../controllers/userController.js";

const router = express.Router();

// Create User
router.post("/", registerUser);

// Get All Users
router.get("/", getAllusers);
router.post("/login", login);

export default router;
