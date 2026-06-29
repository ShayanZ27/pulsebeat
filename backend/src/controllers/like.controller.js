const likeModel = require('../models/like.model');
const musicModel = require('../models/music.model');
const albumModel = require('../models/album.model');
const playlistModel = require('../models/playlist.model');

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
    const targetType = req.body?.targetType;

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
        const likes = await likeModel.find({ user: req.user.id, targetType: 'music' })
            .populate('targetId');

        res.status(200).json({ success: true, data: likes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getLikedAlbum(req, res) {
    try {
        const likes = await likeModel.find({ user: req.user.id, targetType: 'album' })
            .populate('targetId');

        res.status(200).json({ success: true, data: likes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getLikedPlaylists(req, res) {
    try {
        const likes = await likeModel.find({ user: req.user.id, targetType: 'playlist' })
            .populate('targetId');

        res.status(200).json({ success: true, data: likes });
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