import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Create User
router.post("/", async (req, res) => {
    try {
        const { name, email, password } = req.body; // Include password here
        console.log(name, email, password); // Log the actual password from request
        
        // Create user with all required fields
        const user = new User({ name, email, password }); // Use proper password field
        
        await user.save();
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get All Users
router.get("/", async (req, res) => {
    try {
        const users = await User.find();
        console.log(users,"API CALL")
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
