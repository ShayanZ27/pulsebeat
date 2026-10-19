const likeModel = require('../models/like.model');
const musicModel = require('../models/music.model');
const albumModel = require('../models/album.model');
const playlistModel = require('../models/playlist.model');
const activityModel = require('../models/activity.model');

async function addLike(req, res) {
    const { id } = req.params;
    const targetType = req.body?.targetType;

    // 1. Validate targetType
    if (!targetType || !['music', 'album', 'playlist'].includes(targetType)) {
        return res.status(400).json({ success: false, error: 'Invalid or missing targetType. Must be "music", "album", or "playlist".' });
    }

    try {
        // 2. Validate that the target item actually exists in the database
        let targetExists = false;
        if (targetType === 'music') {
            targetExists = await musicModel.exists({ _id: id });
        } else if (targetType === 'album') {
            targetExists = await albumModel.exists({ _id: id });
        } else if (targetType === 'playlist') {
            targetExists = await playlistModel.exists({ _id: id });
        }

        if (!targetExists) {
            return res.status(404).json({ success: false, message: `${targetType} not found` });
        }
        // 2. Try to create the like FIRST. 
        // If the user already liked it, your compound index will throw a duplicate key error (11000)
        // This prevents us from accidentally incrementing the likesCount if they already liked it!
        const like = await likeModel.create({
            user: req.user.id,
            targetId: id,
            targetType,
        });

        // Log activity
        try {
            await activityModel.create({
                user: req.user.id,
                action: 'liked',
                targetType,
                targetId: id
            });
        } catch (actErr) {
            console.error("Activity log error:", actErr);
        }

        // 3. If creation succeeded, increment the actual count (the field is called 'likesCount', not 'likes')
        switch (targetType) {
            case 'music':
                await musicModel.findByIdAndUpdate(id, { $inc: { likesCount: 1 } });
                break;
            case 'album':
                await albumModel.findByIdAndUpdate(id, { $inc: { likesCount: 1 } });
                break;
            case 'playlist':
                await playlistModel.findByIdAndUpdate(id, { $inc: { likesCount: 1 } });
                break;
        }

        res.status(200).json({
            success: true,
            message: "Like added successfully",
            data: like
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "User has already liked this" });
        }
        res.status(500).json({ success: false, error: error.message });
    }
}

async function removeLike(req, res) {
    const { id } = req.params;
    const targetType = req.body?.targetType || req.query?.targetType;

    // 1. Validate targetType
    if (!targetType || !['music', 'album', 'playlist'].includes(targetType)) {
        return res.status(400).json({ success: false, error: 'Invalid or missing targetType. Must be "music", "album", or "playlist".' });
    }

    try {
        // 2. Try to delete the like FIRST.
        const like = await likeModel.findOneAndDelete({
            user: req.user.id,
            targetId: id,
            targetType,
        });

        if (!like) {
            return res.status(404).json({ success: false, message: "Like not found" });
        }

        // 3. If the like existed and was deleted, decrement the count
        switch (targetType) {
            case 'music':
                await musicModel.findByIdAndUpdate(id, { $inc: { likesCount: -1 } });
                break;
            case 'album':
                await albumModel.findByIdAndUpdate(id, { $inc: { likesCount: -1 } });
                break;
            case 'playlist':
                await playlistModel.findByIdAndUpdate(id, { $inc: { likesCount: -1 } });
                break;
        }

        res.status(200).json({
            success: true,
            message: "Like removed successfully",
            data: like
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getLikedMusic(req, res) {
    try {
        const likes = await likeModel.find({ user: req.user.id, targetType: 'music' }).lean();
        const musicIds = likes.map(l => l.targetId);
        const musics = await musicModel.find({ _id: { $in: musicIds }, isActive: { $ne: false } })
            .populate('artist', 'username firstName lastName profilePicture')
            .lean();
        const musicMap = new Map(musics.map(m => [String(m._id), m]));
        const data = likes
            .map(l => ({ ...l, targetId: musicMap.get(String(l.targetId)) }))
            .filter(l => l.targetId);

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getLikedAlbum(req, res) {
    try {
        const likes = await likeModel.find({ user: req.user.id, targetType: 'album' }).lean();
        const albumIds = likes.map(l => l.targetId);
        const albums = await albumModel.find({ _id: { $in: albumIds }, isActive: { $ne: false } })
            .populate('artist', 'username firstName lastName profilePicture')
            .populate({
                path: 'songs',
                match: { isActive: { $ne: false } },
                populate: { path: 'artist', select: 'username firstName lastName profilePicture' }
            })
            .lean();
        const albumMap = new Map(albums.map(a => [String(a._id), a]));
        const data = likes
            .map(l => ({ ...l, targetId: albumMap.get(String(l.targetId)) }))
            .filter(l => l.targetId);

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getLikedPlaylists(req, res) {
    try {
        const likes = await likeModel.find({ user: req.user.id, targetType: 'playlist' }).lean();
        const playlistIds = likes.map(l => l.targetId);
        const playlists = await playlistModel.find({ _id: { $in: playlistIds } })
            .populate('owner', 'username firstName lastName profilePicture')
            .lean();
        const playlistMap = new Map(playlists.map(p => [String(p._id), p]));
        const data = likes
            .map(l => ({ ...l, targetId: playlistMap.get(String(l.targetId)) }))
            .filter(l => l.targetId);

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    addLike,
    removeLike,
    getLikedMusic,
    getLikedAlbum,
    getLikedPlaylists
};