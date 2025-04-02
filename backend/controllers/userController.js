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

        //  
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
    console.log("Incoming request body:", req.body); // 🟢 Log request body before validation

    const user = new User({...req.body,lastUpdatedAt: new Date(),});
    console.log("User instance before saving:", user); // 🟢 Check what is stored before saving

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(400).json({ message: error.message });
  }
}


// Middleware to verify JWT token
export const authenticate = (req, res, next) => {
    const token = req.cookies?.authToken;

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
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: No user found in request' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

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

        // Check if the user has a profile picture URL stored
       

        res.status(200).json(user);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: err.message });
    }
};


export const logout = async (req, res) => {
    try {
        // Clear the cookie storing the authToken
        res.clearCookie('authToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',  // Only send over HTTPS in production
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            path: '/',  // Specify the path for which the cookie is valid
        });

        // Optionally, invalidate the user session or token if stored server-side (if applicable)
        // For example, you might want to invalidate a session if you're storing sessions on the server

        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout failed:', err);
        return res.status(500).json({ message: 'Failed to log out' });
    }
};



export const getUserById = async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
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
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  };
  
  
export const deleteUser = async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  };