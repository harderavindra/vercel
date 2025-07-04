import { bucket } from "../config/storage.js";
import User from "../models/User.js";
import jwt from 'jsonwebtoken';

import bcrypt from 'bcryptjs';
import { DESIGNATIONS, ROLES } from "../constants/enums.js";
import { sendEmail } from "../utils/emailService.js";
const JWT_SECRET = process.env.JWT_SECRET;
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Find the user
  const user = await User.findOne({ email });
  // Log passwords for debugging
  // console.log("Entered password:", password);
  // console.log("Stored hashed password:", user.password);
  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  console.log("Stored hashed isMatch:", isMatch);

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
    const { page = 1, limit = 10, role, designation, search } = req.query;

    let filter = {};

    if (role) filter.role = role;
    if (designation) filter.designation = designation;

    // Search by first name or last name
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const updatedUsers = await Promise.all(users.map(async (user) => {
      if (user.profilePic) {
        try {
          // Extract the file path from the GCS URL
          const decodedUrl = decodeURIComponent(user.profilePic);
          const baseUrl = "https://storage.googleapis.com/mahindra_adbee_strg/";
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

    const totalUsers = await User.countDocuments(filter);

    res.json({
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
export const registerUser = async (req, res) => {

  try {
    console.log("Incoming request body:", req.body); // 🟢 Log request body before validation

    const user = new User({ ...req.body, lastUpdatedAt: new Date(), });
    console.log("User instance before saving:", user); // 🟢 Check what is stored before saving

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(400).json({ message: error.message });
  }
}


// Middleware to verify JWT token
export const authenticate = async (req, res, next) => {
  const token = req.cookies?.authToken;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("email role firstName lastName"); // ✅ now includes role

    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: `${user.firstName} ${user.lastName}`,
    };


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

    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.profilePic) {
      try {
        // Extract the file path from the GCS URL
        const decodedUrl = decodeURIComponent(user.profilePic);
        const baseUrl = "https://storage.googleapis.com/mahindra_adbee_strg/";
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
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.profilePic) {
      try {
        // Extract the file path from the GCS URL
        const decodedUrl = decodeURIComponent(user.profilePic);
        const baseUrl = "https://storage.googleapis.com/mahindra_adbee_strg/";
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


export const updateUser = async (req, res) => {

  try {
    const userId = req.params.id;
    const { firstName, lastName, contactNumber, userType, designation, role, status, location, profilePic } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (contactNumber) updateData.contactNumber = contactNumber;
    if (userType) {
      if (!["internal", "vendor"].includes(userType.toLowerCase())) {
        return res.status(400).json({ message: "Invalid userType" });
      }
      updateData.userType = userType;
    }
    if (designation) {
      const allDesignations = [...DESIGNATIONS.INTERNAL, ...DESIGNATIONS.VENDOR];
      if (!allDesignations.includes(designation)) {
        return res.status(400).json({ message: "Invalid designation" });
      }
      updateData.designation = designation;
    }
    if (role) {
      if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      updateData.role = role;
    }
    if (status) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      updateData.status = status;
    }
    if (location) {
      if (typeof location !== "object") {
        return res.status(400).json({ message: "Invalid location format" });
      }
      console.log(location)
      updateData.location = {};
      if (location.city) updateData.location.city = location.city;
      if (location.state) updateData.location.state = location.state;
      if (location.country) updateData.location.country = location.country;
    }

    if (profilePic) {
      updateData.profilePic = profilePic;
    }


    updateData.lastUpdatedAt = new Date();

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password"); // Exclude password from response

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    console.error("Error updating user:", error); // Log actual error in console
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const adminId = req.user.id; // Admin ID from token
    const { id } = req.params; // Target User ID
    const { newPassword } = req.body;
    // Ensure admin is authorized
    const adminUser = await User.findById(adminId);
    // if (!adminUser || adminUser.role.toLowerCase() !== "admin") {
    //   return res.status(403).json({ message: "Access denied. Only admins can reset passwords." });
    // }

    // Find the target user
    const user = await User.findById(id).select("+password"); // Ensure password is accessible
    if (!user) return res.status(404).json({ message: "User not found" });

    // // Validate password strength
    // if (!validatePassword(newPassword)) {
    //   return res.status(400).json({
    //     message: "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character."
    //   });
    // }

    // Hash new password
    user.password = newPassword;
    user.lastUpdatedBy = adminId; // Track who updated it
    await user.save();

    res.status(200).json({ message: "User password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    // Return a generic message if user does not exist
    if (!user) {
      return res.json({
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Generate JWT token for password reset (expires in 1 hour)
    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create the reset link with the token
    const resetLink = `${process.env.FRONTEND_URL}reset-password/${token}`;

    // Email content
    const subject = 'Reset Your Password';
    const html = `
        <p>Hi ${user.name || 'there'},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
      `;

    // Send reset email
    await sendEmail({ to: email, subject, html });

    return res.json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params; // Extract the token from URL params
  const { newPassword } = req.body;

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find the user by ID from the decoded token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }



    // Update the user's password
    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Error during password reset:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProfilePic = async (req, res) => {
  try {
    const { currentProfilePic } = req.body;
    const userId = req.user.userId; // Admin ID from token
    console.log(currentProfilePic)

    if (!userId || !currentProfilePic) {
      return res.status(400).json({
        success: false,
        message: "userId and profilePic are required",
      });
    }

    // Decode and strip the profilePic URL
    const decodedUrl = decodeURIComponent(currentProfilePic);
    const baseUrl = "https://storage.googleapis.com/mahindra_adbee_strg/";
    const filePath = decodedUrl.replace(baseUrl, "").split("?")[0];

    // Attempt to delete from GCS
    const file = bucket.file(filePath);
    await file.delete().catch((err) => {
      console.warn(`Error deleting file from GCS: ${filePath}`, err.message);
    });

    // Update user profilePic field to empty string
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: "" },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Profile picture deleted successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error deleting user profile pic:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};