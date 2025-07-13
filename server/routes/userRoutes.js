import express from "express";
import { ObjectId } from "mongodb";
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
            userId = new ObjectId();
            rootDirId = new ObjectId();
        } catch (error) {
            console.error('UUID generation failed:', error);
            return res.status(500).json({
                msg: "Failed to generate user identifiers"
            });
        }
        //create the user
        let newUser = await users.insertOne({
            _id: new ObjectId(userId),
            name: sanitizedName,
            email: sanitizedEmail,
            password: sanitizedPassword, // In production, hash this!
            rootDirId,
        })
        console.log(newUser)

        // Create folder and user objects
        await folders.insertOne({
            _id: new ObjectId(rootDirId),
            name: "root",
            parentDir: null,
            content: {
                files: [],
                folders: []
            },
            userId: new ObjectId(userId)
        })


        // Set secure cookie
        try {
            res.cookie("id", userId.toString(), {
                // sameSite: "lax",
                maxAge: 1000 * 60 * 60 * 24, // 24 hours
                // secure: false,
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
        console.log('Registration error:', error.errInfo.details.schemaRulesNotSatisfied[0].propertiesNotSatisfied);
        return res.status(500).json({
            msg: "Registration failed. Please try again later.",
            error: error.message
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
        // Set secure cookie
        // console.log("setting the cookie", isProduction)
        res.cookie("id", user._id.toString(), {
            httpOnly: true,
            // secure: false,
            // sameSite: isProduction ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
            // path: "/"
        });

        return res.status(200).json({
            msg: "User logged in successfully",
            id: user._id,
            user: {
                id: user._id,
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
            error:error.message 
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
        // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        // if (!uuidRegex.test(userId)) {
        //     return res.status(400).json({
        //         msg: "Invalid user ID format"
        //     });
        // }

        // Find user safely
        const user = await users.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            // Clear invalid cookie
            res.clearCookie('id');
            return res.status(404).json({
                msg: "User not found. Please login again."
            });
        }

        // Return user profile (exclude sensitive data)
        const userProfile = {
            id: user._id,
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
            error: error.message
        });
    }
}));

userRouter.post("/logout", asyncHandler(async (req, res) => {
    try {
        // Clear the authentication cookie
        res.cookie('id', '', {
            expires: new Date(0),
            httpOnly: true,
            // secure: false,
            // sameSite: "lax"
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
            error: error.message 
        });
    }
}));

// Global error handler for this router
userRouter.use((error, req, res, next) => {
    console.error('Unhandled error in user router:', error);

    if (!res.headersSent) {
        return res.status(500).json({
            msg: "An unexpected error occurred",
            error: error.message
        });
    }

    next(error);
});

export default userRouter;