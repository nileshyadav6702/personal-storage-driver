import express from "express";
import { folders, users } from "../readDB.js";
import { writeFolders, writeUsers } from "../writeDB.js";
import { v4 as uuidv4 } from 'uuid';


const userRouter = express.Router();

userRouter.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        let existingUser = users.find(el => el.email == email)
        if (existingUser) throw new Error('User already exists!')
        let userId = uuidv4()
        let rootDirId = uuidv4()
        folders.push({
            name: "root",
            dirID: rootDirId,
            parentDir: null,
            content: {
                "files": [],
                "folders": []
            }
        })
        users.push({
            id: userId,
            name,
            email,
            password,
            rootDirId
        })
        res.cookie("id", userId, {
            sameSite: "none", // Only use "none" for cross-origin requests
            maxAge: 1000 * 60 * 60 * 24, // 24 hours (your current is only 2 seconds!)
            secure: true,
            httpOnly: true
        });
        writeUsers(users)
        writeFolders(folders)
        return res.status(200).json({ msg: "user Created successfully", id: userId })
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({ msg: "Error occured in creating the user" })
    }
})
userRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = users.find(el => el.email == email)
        if (!user) {
            return res.status(404).json({ msg: "User with this email does not exits please Resigster First" })
        }
        if (user.password != password) {
            return res.status(400).json({ msg: "Password is Incorrect" })
        }
        res.cookie("id", user.id, {
            sameSite: "none", // Only use "none" for cross-origin requests
            maxAge: 1000 * 60 * 60 * 24, // 24 hours (your current is only 2 seconds!)
            secure: true,
            httpOnly: true
        });
        return res.status(200).json({ msg: "User loged in Successfully", id: user.id })
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({ msg: "Error occured in creating the user" })
    }
})

userRouter.get("/profile", async (req, res) => {
    try {
        let { id: userId } = req.cookies;
        if(!userId) {
            return res.status(404).json({msg: "id not found please login"})
        }
        let user = users.find(el => el.id == userId)
        if (!user) {
            return res.status(404).json({ msg: "User doesnt found with this id" })
        }
        return res.status(200).json({ msg: "Successfully got the profile information", data: user })
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({ msg: "Something went Wrong", error: error.message })
    }
})

userRouter.post("/logout", (req, res) => {
    try {
        res.cookie('id', '', {
            expires: new Date(0), // Set to past date
            httpOnly: true,
            secure: true
        });
        return res.status(200).json({ msg: "Logout successfully" })
    }
    catch (error) {
        return res.status(500).json({ msg: "Error occured in logging out the user" })
    }
})


export default userRouter