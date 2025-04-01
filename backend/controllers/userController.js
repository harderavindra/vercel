import { bucket } from "../config/storage.js";
import User from "../models/User.js";
import jwt from 'jsonwebtoken';

import bcrypt from 'bcryptjs';
const JWT_SECRET = process.env.JWT_SECRET; 
export const login = async (req, res) => {
    const { email, password } = req.body;
  
    // Find the user
    const user = await User.findOne({ email });
  
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
  
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
  
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  
    // Create JWT token
    const payload = {
      userId: user._id,
      email: user.email,
    };
  
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
  
    // Set JWT token in a cookie
    res.cookie('authToken', token, { 
      httpOnly: true,  // Prevents JavaScript access
      secure: process.env.NODE_ENV === 'production',  // Only send over HTTPS in production
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', 
            maxAge: 60 * 60 * 1000, // 1 hour
      path: '/',
    });
  
    res.status(200).json({ message: 'Logged in successfully' });
  };

export const getAllusers = async (req, res) => {
    try {
        const users = await User.find();

        // Generate signed URLs for each user's profile picture
        const updatedUsers = await Promise.all(users.map(async (user) => {
            if (user.profilePic) {
                try {
                    // Extract the file path from the GCS URL
                    const decodedUrl = decodeURIComponent(user.profilePic);
                    const baseUrl = "https://storage.googleapis.com/brand-treasury/";
                    const filePath = decodedUrl.replace(baseUrl, "").split('?')[0];  // Extract the file path part before the query string

                    // Get the file reference from GCS
                    const file = bucket.file(filePath);

                    // Generate a signed URL for the file
                    const [signedUrl] = await file.getSignedUrl({
                        action: 'read',
                        expires: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
                    });

                    // Update the user's profilePic field with the signed URL
                    user.profilePic = signedUrl;
                } catch (err) {
                    console.error(`Error generating signed URL for user ${user._id}:`, err);
                }
            }
            return user;
        }));

        // Send the response with the updated user data
        res.status(200).json(updatedUsers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, profilePic } = req.body; // Include password here

        // Create user with all required fields
        const user = new User({ name, email, password, profilePic }); // Use proper password field

        await user.save();
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}


// Middleware to verify JWT token
export const authenticate = (req, res, next) => {
    const token = req.cookies?.authToken; 
    console.log('Token from cookies:', token);
  
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // Add the decoded user info to the request
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
  

  export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If profilePic exists, generate a signed URL for it
        if (user.profilePic) {
            const filePath = user.profilePic.replace('https://storage.googleapis.com/your-bucket-name/', '');
            const file = bucket.file(filePath);
            const [signedUrl] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
            });
            user.profilePic = signedUrl;
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};