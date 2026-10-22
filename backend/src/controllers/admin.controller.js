const artistRequestModel = require('../models/artist-request.model');
const userModel = require('../models/user.model');
const musicModel = require('../models/music.model');
const albumModel = require('../models/album.model');
const reportModel = require('../models/report.model');
const playlistModel = require('../models/playlist.model');

async function getAllArtistRequests(req, res) {
    try {
        const { status } = req.query;
        let query = {};
        if (status && status !== 'all') {
            query.status = status.toLowerCase();
        } else if (!status) {
            query.status = 'pending';
        }

        const requests = await artistRequestModel.find(query)
            .populate('user', 'username email profilePicture firstName lastName')
            .populate('reviewedBy', 'username email profilePicture firstName lastName')
            .sort({ createdAt: -1 });

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
        const contentId = req.params.contentId?.replace(/['"]/g, '').trim();
        const type = typeof req.query.type === 'string' ? req.query.type.trim().toLowerCase() : req.query.type;

        if (!type || (type !== 'music' && type !== 'album')) {
            return res.status(400).json({ success: false, message: "Invalid type in query. Must be 'music' or 'album'" });
        }

        const mongoose = require('mongoose');
        if (!mongoose.isValidObjectId(contentId)) {
            return res.status(404).json({ success: false, message: `${type} not found` });
        }

        const model = type === 'music' ? musicModel : albumModel;
        const content = await model.findById(contentId);

        if (!content) {
            return res.status(404).json({ success: false, message: `${type} not found` });
        }

        if (content.isSuspended) {
            return res.status(400).json({ success: false, message: `${type} is already suspended` });
        }

        content.isSuspended = true;
        await content.save();

        res.status(200).json({ success: true, message: `${type} successfully suspended`, data: content });
    } catch (error) {
        console.error("Error in hideContent:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function restoreContent(req, res) {
    try {
        const contentId = req.params.contentId?.replace(/['"]/g, '').trim();
        const type = typeof req.query.type === 'string' ? req.query.type.trim().toLowerCase() : req.query.type;

        if (!type || (type !== 'music' && type !== 'album')) {
            return res.status(400).json({ success: false, message: "Invalid type in query. Must be 'music' or 'album'" });
        }

        const mongoose = require('mongoose');
        if (!mongoose.isValidObjectId(contentId)) {
            return res.status(404).json({ success: false, message: `${type} not found` });
        }

        const model = type === 'music' ? musicModel : albumModel;
        const content = await model.findById(contentId);

        if (!content) {
            return res.status(404).json({ success: false, message: `${type} not found` });
        }

        if (!content.isSuspended) {
            return res.status(400).json({ success: false, message: `${type} is not suspended` });
        }

        content.isSuspended = false;
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
            } else if (status.toLowerCase() !== 'all') {
                query.status = status.toLowerCase(); // 'resolved' or 'dismissed'
            }
        }

        // 2. Handle Type Query
        if (type && type.toLowerCase() !== 'all') {
            // Capitalize to match the Schema Enums ('Music', 'Album', 'User')
            query.contentType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        }

        const reports = await reportModel.find(query)
            .populate('reporter', 'username email profilePicture firstName lastName')
            .populate('reviewedBy', 'username email profilePicture firstName lastName')
            .populate({
                path: 'reportedContent',
                options: { strictPopulate: false },
                populate: {
                    path: 'artist',
                    select: 'username firstName lastName profilePicture',
                    options: { strictPopulate: false }
                }
            })
            .sort({ createdAt: -1 });

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

async function getFeaturedContent(req, res) {
    try {
        const [tracks, albums, playlists] = await Promise.all([
            musicModel.find({ isFeatured: true })
                .populate('artist', 'username firstName lastName profilePicture')
                .lean(),
            albumModel.find({ isFeatured: true })
                .populate('artist', 'username firstName lastName profilePicture')
                .lean(),
            playlistModel.find({ isFeatured: true })
                .populate('owner', 'username firstName lastName profilePicture')
                .lean(),
        ]);

        const items = [
            ...tracks.map(t => ({ ...t, contentType: 'music' })),
            ...albums.map(a => ({ ...a, contentType: 'album' })),
            ...playlists.map(p => ({ ...p, contentType: 'playlist' })),
        ].sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));

        res.status(200).json({ success: true, data: items });
    } catch (error) {
        console.error("Error in getFeaturedContent:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function addFeaturedContent(req, res) {
    try {
        const { contentId, contentType } = req.body;
        if (!contentId || !contentType) {
            return res.status(400).json({ success: false, message: "contentId and contentType are required" });
        }

        let model;
        if (contentType === 'music') model = musicModel;
        else if (contentType === 'album') model = albumModel;
        else if (contentType === 'playlist') model = playlistModel;
        else return res.status(400).json({ success: false, message: "Invalid contentType. Must be 'music', 'album', or 'playlist'" });

        const item = await model.findById(contentId);
        if (!item) {
            return res.status(404).json({ success: false, message: `${contentType} not found` });
        }

        const [c1, c2, c3] = await Promise.all([
            musicModel.countDocuments({ isFeatured: true }),
            albumModel.countDocuments({ isFeatured: true }),
            playlistModel.countDocuments({ isFeatured: true })
        ]);

        item.isFeatured = true;
        item.featuredOrder = c1 + c2 + c3;
        await item.save();

        res.status(200).json({ success: true, message: `${contentType} pinned to featured showcase`, data: item });
    } catch (error) {
        console.error("Error in addFeaturedContent:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function removeFeaturedContent(req, res) {
    try {
        const { contentId } = req.params;
        const type = (req.query.type || req.body?.contentType || '').toLowerCase();

        let model;
        if (type === 'music') model = musicModel;
        else if (type === 'album') model = albumModel;
        else if (type === 'playlist') model = playlistModel;
        else return res.status(400).json({ success: false, message: "Invalid type. Must be 'music', 'album', or 'playlist'" });

        const item = await model.findById(contentId);
        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        item.isFeatured = false;
        item.featuredOrder = 0;
        await item.save();

        res.status(200).json({ success: true, message: "Item unpinned from featured", data: item });
    } catch (error) {
        console.error("Error in removeFeaturedContent:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function reorderFeaturedContent(req, res) {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ success: false, message: "Items array is required" });
        }

        const updates = items.map(({ id, contentType, featuredOrder }) => {
            let model;
            if (contentType === 'music') model = musicModel;
            else if (contentType === 'album') model = albumModel;
            else if (contentType === 'playlist') model = playlistModel;
            if (!model || !id) return null;
            return model.findByIdAndUpdate(id, { featuredOrder: Number(featuredOrder) || 0 });
        }).filter(Boolean);

        await Promise.all(updates);

        res.status(200).json({ success: true, message: "Featured order updated successfully" });
    } catch (error) {
        console.error("Error in reorderFeaturedContent:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getSuspendedContent(req, res) {
    try {
        const type = req.query.type?.toLowerCase() || 'all';

        const result = {
            tracks: [],
            albums: [],
            artists: []
        };

        if (type === 'all' || type === 'tracks' || type === 'track' || type === 'music') {
            result.tracks = await musicModel.find({ isSuspended: true })
                .populate('artist', 'username firstName lastName profilePicture')
                .sort({ updatedAt: -1 });
        }

        if (type === 'all' || type === 'albums' || type === 'album') {
            result.albums = await albumModel.find({ isSuspended: true })
                .populate('artist', 'username firstName lastName profilePicture')
                .populate('songs', 'title duration')
                .sort({ updatedAt: -1 });
        }

        if (type === 'all' || type === 'artists' || type === 'artist') {
            result.artists = await userModel.find({ isSuspended: true, role: 'artist' })
                .select('-password')
                .sort({ updatedAt: -1 });
        }

        res.status(200).json({
            success: true,
            message: "Suspended content fetched successfully",
            data: result
        });
    } catch (error) {
        console.error("Error in getSuspendedContent:", error);
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
    resolveReport,
    getFeaturedContent,
    addFeaturedContent,
    removeFeaturedContent,
    reorderFeaturedContent,
    getSuspendedContent
};