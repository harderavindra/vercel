import User from "../models/User.js";

export const getAllusers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body; // Include password here
        
        // Create user with all required fields
        const user = new User({ name, email, password }); // Use proper password field
        
        await user.save();
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}