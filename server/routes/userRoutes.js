import express from "express";
import { v4 as uuidv4 } from 'uuid';

const userRouter = express.Router();

// Input validation helpers
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    return password && password.length >= 6;
};

const validateName = (name) => {
    return name && name.trim().length >= 2 && name.trim().length <= 50;
};

// Sanitize input to prevent injection attacks
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
};

// Async wrapper to catch errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Database operation wrapper with retry logic
const safeDBOperation = async (operation, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await operation();
            return true;
        } catch (error) {
            console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
            if (attempt === maxRetries) {
                throw new Error('Database operation failed after multiple attempts');
            }
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
    }
};

userRouter.post("/register", asyncHandler(async (req, res) => {
    try {
        //db
        let db = req.db;
        let users = db.collection("users")
        let folders = db.collection("folders")
        // Input validation
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                msg: "Missing required fields",
                required: ["name", "email", "password"]
            });
        }

        // Sanitize inputs
        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email).toLowerCase();
        const sanitizedPassword = sanitizeInput(password);

        // Validate inputs
        if (!validateName(sanitizedName)) {
            return res.status(400).json({
                msg: "Name must be between 2-50 characters and contain no special characters"
            });
        }

        if (!validateEmail(sanitizedEmail)) {
            return res.status(400).json({
                msg: "Please provide a valid email address"
            });
        }

        if (!validatePassword(sanitizedPassword)) {
            return res.status(400).json({
                msg: "Password must be at least 6 characters long"
            });
        }


        // Check for existing user (case-insensitive)
        // const existingUser = users.find(user =>
        //     user && user.email && user.email.toLowerCase() === sanitizedEmail
        // );
        const existingUser = await  users.findOne({ email: sanitizedEmail});

        if (existingUser) {
            return res.status(409).json({
                msg: "User with this email already exists"
            });
        }

        // Generate UUIDs with validation
        let userId, rootDirId;
        try {
            userId = uuidv4();
            rootDirId = uuidv4();
        } catch (error) {
            console.error('UUID generation failed:', error);
            return res.status(500).json({
                msg: "Failed to generate user identifiers"
            });
        }

        // Create folder and user objects
        await folders.insertOne({
            name: "root",
            dirID: rootDirId,
            parentDir: null,
            content: {
                files: [],
                folders: []
            },
            createdAt: new Date().toISOString(),
            userId: userId
        })

        let newUser = await users.insertOne({
            id: userId,
            name: sanitizedName,
            email: sanitizedEmail,
            password: sanitizedPassword, // In production, hash this!
            rootDirId,
            createdAt: new Date().toISOString(),
            lastLogin: null
        })

        // Set secure cookie
        try {
            res.cookie("id", userId, {
                sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
                maxAge: 1000 * 60 * 60 * 24, // 24 hours
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true
            });
        } catch (error) {
            console.error('Failed to set cookie:', error);
            // Don't fail the request for cookie issues
        }

        return res.status(201).json({
            msg: "User created successfully",
            id: userId,
            user: {
                id: userId,
                name: sanitizedName,
                email: sanitizedEmail
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            msg: "Registration failed. Please try again later.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

userRouter.post("/login", asyncHandler(async (req, res) => {
    try {
        let db = req.db;
        let users = db.collection("users")
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                msg: "Email and password are required"
            });
        }

        // Sanitize inputs
        const sanitizedEmail = sanitizeInput(email).toLowerCase();
        const sanitizedPassword = sanitizeInput(password);

        // Validate email format
        if (!validateEmail(sanitizedEmail)) {
            return res.status(400).json({
                msg: "Please provide a valid email address"
            });
        }

        const user = await users.findOne({ email: sanitizedEmail });
        if (!user) {
            return res.status(404).json({
                msg: "User with this email does not exist. Please register first."
            });
        }

        // Validate password (in production, use bcrypt.compare)
        if (!user.password || user.password !== sanitizedPassword) {
            return res.status(401).json({
                msg: "Invalid password"
            });
        }

        // Update last login
        try {
            await users.updateOne({ id: user.id },{$set: {lastLogin: new Date().toISOString()}})

        } catch (error) {
            console.error('Failed to update last login:', error);
            // Don't fail login for this
        }

        // Set secure cookie
        try {
            res.cookie("id", user.id, {
                sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
                maxAge: 1000 * 60 * 60 * 24, // 24 hours
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true
            });
        } catch (error) {
            console.error('Failed to set cookie:', error);
            return res.status(500).json({
                msg: "Login failed due to session management error"
            });
        }

        return res.status(200).json({
            msg: "User logged in successfully",
            id: user.id,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                lastLogin: user.lastLogin,
                rootDirId: user.rootDirId
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            msg: "Login failed. Please try again later.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

userRouter.get("/profile", asyncHandler(async (req, res) => {
    try {
        let db = req.db;
        let users = await db.collection("users")
        // Check for user ID in cookies
        const { id: userId } = req.cookies || {};

        if (!userId) {
            return res.status(401).json({
                msg: "Authentication required. Please login first."
            });
        }

        // Validate userId format (should be UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
            return res.status(400).json({
                msg: "Invalid user ID format"
            });
        }

        // Find user safely
        const user = await users.findOne({ id: userId });

        if (!user) {
            // Clear invalid cookie
            res.clearCookie('id');
            return res.status(404).json({
                msg: "User not found. Please login again."
            });
        }

        // Return user profile (exclude sensitive data)
        const userProfile = {
            id: user.id,
            name: user.name,
            email: user.email,
            rootDirId: user.rootDirId,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        };

        return res.status(200).json({
            msg: "Profile retrieved successfully",
            data: userProfile
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        return res.status(500).json({
            msg: "Failed to retrieve profile. Please try again later.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

userRouter.post("/logout", asyncHandler(async (req, res) => {
    try {
        // Clear the authentication cookie
        res.cookie('id', '', {
            expires: new Date(0),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax"
        });

        return res.status(200).json({
            msg: "Logged out successfully"
        });

    } catch (error) {
        console.error('Logout error:', error);
        // Even if logout fails, clear the cookie
        try {
            res.clearCookie('id');
        } catch (clearError) {
            console.error('Failed to clear cookie:', clearError);
        }

        return res.status(500).json({
            msg: "Logout completed with warnings",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

// Global error handler for this router
userRouter.use((error, req, res, next) => {
    console.error('Unhandled error in user router:', error);

    if (!res.headersSent) {
        return res.status(500).json({
            msg: "An unexpected error occurred",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }

    next(error);
});

export default userRouter;