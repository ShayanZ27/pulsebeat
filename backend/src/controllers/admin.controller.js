const artistRequestModel = require('../models/artist-request.model');
const userModel = require('../models/user.model');
const musicModel = require('../models/music.model');
const albumModel = require('../models/album.model');
const reportModel = require('../models/report.model');

async function getAllArtistRequests(req, res) {
    try {
        const requests = await artistRequestModel.find({ status: 'pending' })
            .populate('user', 'username email profilePicture')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            message: "Artist requests fetched successfully",
            data: requests
        });
    } catch (error) {
        console.error("Error in getAllArtistRequests:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function approveArtist(req, res) {
    const { requestId } = req.params;

    try{
        const request = await artistRequestModel.findById(requestId);
        if(!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        const user = await userModel.findById(request.user);
        if(!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if(user.role === 'admin') {
            return res.status(400).json({ success: false, message: "User is already an admin" });
        }

        if(user.role === 'artist') {
            return res.status(400).json({ success: false, message: "User is already an artist" });
        }

        if(request.status === 'approved') {
            return res.status(400).json({ success: false, message: "Request is already approved" });
        }

        if(request.status === 'rejected') {
            return res.status(400).json({ success: false, message: "Request is already rejected" });
        }

        user.role = 'artist';
        await user.save();

        request.status = 'approved';
        request.reviewedBy = req.user.id;
        await request.save();

        res.status(200).json({
            success: true,
            message: "Request approved successfully",
            data: user
        });
    } catch(error){
        console.error("Error in approveArtist:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function rejectArtist(req, res) {
    try {
        const { requestId } = req.params;
        const request = await artistRequestModel.findById(requestId);

        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        const user = await userModel.findById(request.user);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if(user.role === 'admin') {
            return res.status(400).json({ success: false, message: "User is already an admin" });
        }

        if(user.role === 'artist') {
            return res.status(400).json({ success: false, message: "User is already an artist" });
        }

        if(request.status !== 'pending') {
            return res.status(400).json({ success: false, message: "Cannot reject request because it is already approved or rejected" });
        }

        user.role = 'user';
        await user.save();

        request.status = 'rejected';
        request.reviewedBy = req.user.id;
        request.rejectionReason = req.body.reason;
        await request.save();

        res.status(200).json({
            success: true,
            message: "Request rejected successfully",
            data: user
        });
    } catch (error) {
        console.error("Error in rejectArtistRequest:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function suspendUser(req, res) {
    try {
        const { userId } = req.params;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if(user.role === 'admin') {
            return res.status(400).json({ success: false, message: "User is an admin" });
        }

        if(user.isSuspended) {
            return res.status(400).json({ success: false, message: "User is already suspended" });
        }

        user.isSuspended = true;
        await user.save();

        res.status(200).json({
            success: true,
            message: "User suspended successfully",
            data: user
        });
    } catch (error) {
        console.error("Error in suspendUser:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function unsuspendUser(req, res) {
    try {
        const { userId } = req.params;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if(!user.isSuspended) {
            return res.status(400).json({ success: false, message: "User is not suspended" });
        }

        user.isSuspended = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: "User unsuspended successfully",
            data: user
        });
    } catch (error) {
        console.error("Error in unsuspendUser:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function hideContent(req, res) {
    try {
        const { contentId } = req.params;
        const { type } = req.query;

        if (!type || (type !== 'music' && type !== 'album')) {
            return res.status(400).json({ success: false, message: "Invalid type in query. Must be 'music' or 'album'" });
        }

        const model = type === 'music' ? musicModel : albumModel;
        const content = await model.findById(contentId);

        if (!content) {
            return res.status(404).json({ success: false, message: `${type} not found` });
        }

        if (!content.isActive) {
            return res.status(400).json({ success: false, message: `${type} is already hidden` });
        }

        content.isActive = false;
        await content.save();

        res.status(200).json({ success: true, message: `${type} successfully hidden`, data: content });
    } catch (error) {
        console.error("Error in hideContent:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function restoreContent(req, res) {
    try {
        const { contentId } = req.params;
        const { type } = req.query;

        if (!type || (type !== 'music' && type !== 'album')) {
            return res.status(400).json({ success: false, message: "Invalid type in query. Must be 'music' or 'album'" });
        }

        const model = type === 'music' ? musicModel : albumModel;
        const content = await model.findById(contentId);

        if (!content) {
            return res.status(404).json({ success: false, message: `${type} not found` });
        }

        if (content.isActive) {
            return res.status(400).json({ success: false, message: `${type} is already active` });
        }

        content.isActive = true;
        await content.save();

        res.status(200).json({ success: true, message: `${type} successfully restored`, data: content });
    } catch (error) {
        console.error("Error in restoreContent:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function fetchReports(req, res) {
    try {
        const { status, type } = req.query;
        let query = {};

        // 1. Handle Status Query
        if (status) {
            if (status.toLowerCase() === 'open') {
                query.status = 'pending';
            } else {
                query.status = status.toLowerCase(); // 'resolved' or 'dismissed'
            }
        }

        // 2. Handle Type Query
        if (type && type.toLowerCase() !== 'all') {
            // Capitalize to match the Schema Enums ('Music', 'Album', 'User')
            query.contentType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        }

        const reports = await reportModel.find(query)
            .populate('reporter', 'username email profilePicture')
            .populate('reportedContent') // Polymorphic populate!
            .sort({ createdAt: 1 });

        res.status(200).json({ success: true, data: reports });
    } catch (error) {
        console.error("Error in fetchReports:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function resolveReport(req, res) {
    try {
        const { reportId } = req.params;
        const { status, comments } = req.body || {};

        if (!status || (status !== 'resolved' && status !== 'dismissed')) {
            return res.status(400).json({ success: false, message: "Valid status ('resolved' or 'dismissed') is required in the request body" });
        }

        const report = await reportModel.findById(reportId);

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        if (report.status === 'resolved' || report.status === 'dismissed') {
            return res.status(400).json({ success: false, message: `Report is already ${report.status}` });
        }

        report.status = status;
        if (comments) {
            report.actionTaken = comments;
        }
        
        report.reviewedBy = req.user.id;
        report.reviewedAt = Date.now();
        await report.save();

        res.status(200).json({ success: true, message: `Report ${status} successfully`, data: report });
    } catch (error) {
        console.error("Error in resolveReport:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    getAllArtistRequests,
    approveArtist,
    rejectArtist,
    suspendUser,
    unsuspendUser,
    hideContent,
    restoreContent,
    fetchReports,
    resolveReport
};