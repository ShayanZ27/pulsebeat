const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

async function registerUser(req, res) {
    try {
        const { username, email, password, role = 'user' } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (role === 'admin') {
            return res.status(403).json({ message: "Cannot register as an admin via this endpoint" });
        }

        const isUserExist = await userModel.findOne(
            { $or: [{ username }, { email }] }
        );
        if (isUserExist) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password: hash,
            role,
        });

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
        );

        res.cookie("token", token)

        return res.status(201).json({
            message: "User created successfully", user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                bio: user.bio
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
}

async function loginUser(req, res) {
    try {
        const { username, email, password } = req.body;

        const user = await userModel.findOne(
            { $or: [{ username }, { email }] }
        );
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
        );

        res.cookie("token", token)

        return res.status(200).json({
            message: "User logged in successfully", user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                bio: user.bio
            }
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
}

async function logoutUser(req, res) {
    try {
        res.clearCookie("token");
        return res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
}

module.exports = { registerUser, loginUser, logoutUser };