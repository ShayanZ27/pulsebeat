const userModel = require('../models/user.model');
const storageService = require('../services/storage.service');
const artistRequestModel = require('../models/artist-request.model');
const reportModel = require('../models/report.model');
const musicModel = require('../models/music.model');
const albumModel = require('../models/album.model');

async function updateProfile(req, res) {
    try {
        const userId = req.user.id;
        const { username, bio } = req.body || {};
        
        // 1. Check if the new username is taken by someone else
        if (username) {
            const existingUser = await userModel.findOne({ username, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Username is already taken" });
            }
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let newProfilePicUrl = user.profilePicture;

        // 2. Handle profile picture upload and delete old one
        if (req.file) {
            const uploadResult = await storageService.uploadImage(req.file.buffer);
            newProfilePicUrl = uploadResult.url;

            // Delete old picture if it exists
            if (user.profilePicture && user.profilePicture.includes('imagekit')) {
                await storageService.deleteImageByURL(user.profilePicture);
            }
        } else if (req.body.profilePicture === '' || req.body.deleteProfilePicture === 'true' || req.body.deleteProfilePicture === true) {
            // If they didn't upload a new file, but explicitly asked to delete the current one
            if (user.profilePicture && user.profilePicture.includes('imagekit')) {
                await storageService.deleteImageByURL(user.profilePicture);
            }
            newProfilePicUrl = ''; // Reset to default empty string
        }

        // 3. Update User fields
        user.username = username || user.username;
        if (bio !== undefined) {
            user.bio = bio; // Allow empty string to clear bio
        }
        user.profilePicture = newProfilePicUrl;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                username: user.username,
                bio: user.bio,
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function requestArtist(req, res) {
    try {
        const userId = req.user.id;
        const { statement } = req.body;

        if (!statement) {
            return res.status(400).json({ success: false, message: "Statement is required" });
        }

        if (statement.trim().length < 10 || statement.trim().length > 500) {
            return res.status(400).json({ success: false, message: "Statement is too short or too long. Minimum 10 and maximum 500 characters required." });
        }

        if (req.user.role === 'artist' || req.user.role === 'admin') {
            return res.status(400).json({ success: false, message: "You cannot request artist status because you are already an artist or admin." });
        }

        // 1. Rate limiting: 1 request per day
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentRequest = await artistRequestModel.findOne({
            user: userId,
            createdAt: { $gte: twentyFourHoursAgo }
        });

        if (recentRequest) {
            return res.status(429).json({ success: false, message: "You can only submit one artist request per day. Please try again later." });
        }

        // 2. If it's been more than 24 hours, delete any old pending requests to replace with the new one
        await artistRequestModel.deleteMany({ user: userId, status: 'pending' });

        const newRequest = new artistRequestModel({
            user: userId,
            statement: statement.trim(),
            status: 'pending'
        });

        await newRequest.save();

        res.status(200).json({
            success: true,
            message: "Request sent successfully!",
            data: newRequest
        });
    } catch (error) {
        console.error("Error in requestArtist:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function reportContent(req, res) {
    try {
        const userId = req.user.id;
        const { reportedContent, contentType, reason, description } = req.body || {};

        if (!reportedContent || !contentType || !reason) {
            return res.status(400).json({ success: false, message: "Content ID, Content Type and Reason are required" });
        }

        if (!['Music', 'Album', 'User'].includes(contentType)) {
            return res.status(400).json({ success: false, message: "Invalid content type" });
        }

        if (!['spam', 'abusive', 'inappropriate', 'copyright', 'other'].includes(reason)) {
            return res.status(400).json({ success: false, message: "Invalid reason" });
        }

        let modelToQuery;
        if (contentType === 'Music') modelToQuery = musicModel;
        else if (contentType === 'Album') modelToQuery = albumModel;
        else if (contentType === 'User') modelToQuery = userModel;

        const contentExists = await modelToQuery.findById(reportedContent);
        if (!contentExists) {
            return res.status(404).json({ success: false, message: "The content you are trying to report does not exist" });
        }

        const existingReport = await reportModel.findOne({
            reporter: userId,
            reportedContent,
            contentType,
            status: "pending"
        });

        if (existingReport) {
            return res.status(400).json({ success: false, message: "You have already reported this content" });
        }

        const newReport = new reportModel({
            reporter: userId,
            reportedContent,
            contentType,
            reason,
            description: description || "",
            status: "pending"
        });

        await newReport.save();

        res.status(200).json({
            success: true,
            message: "Report sent successfully!",
            data: newReport
        });
    } catch (error) {
        console.error("Error in reportContent:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    updateProfile,
    requestArtist,
    reportContent
};
