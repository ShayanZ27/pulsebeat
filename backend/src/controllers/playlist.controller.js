const playlistModel = require('../models/playlist.model');
const musicModel = require('../models/music.model');
const storageService = require('../services/storage.service');
const activityModel = require('../models/activity.model');

async function createPlaylist(req, res) {
    try {
        const { name, description, isPublic } = req.body || {};

        if (!name) {
            return res.status(400).json({ success: false, message: "Playlist name is required" });
        }

        const owner = req.user.id;
        const playlist = await playlistModel.create({
            name,
            description,
            isPublic,
            owner,
        });
        res.status(201).json({ success: true, data: playlist });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function addSong(req, res) {
    try {
        const { id } = req.params;
        const { songId, songIds } = req.body || {};

        const targetIds = Array.isArray(songIds) && songIds.length > 0
            ? songIds
            : (songId ? [songId] : []);

        if (!targetIds.length) {
            return res.status(400).json({ success: false, message: "Song ID is required" });
        }

        const playlist = await playlistModel.findById(id);

        if (!playlist) {
            return res.status(404).json({ success: false, message: "Playlist not found" });
        }

        if (playlist.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "You are not the owner of this playlist" });
        }

        const existingSet = new Set((playlist.songs || []).map(s => (s._id || s).toString()));
        const songsToAdd = await musicModel.find({ _id: { $in: targetIds } });
        const newSongs = songsToAdd.filter(s => !existingSet.has(s._id.toString()));

        if (newSongs.length === 0) {
            return res.status(400).json({
                success: false,
                message: targetIds.length === 1 ? "Song already exists in playlist" : "All songs from this album already exist in this playlist"
            });
        }

        for (const s of newSongs) {
            playlist.songs.push(s._id);
            playlist.totalDuration = (playlist.totalDuration || 0) + (s.duration || 0);
        }

        await playlist.save();

        // Log activity
        try {
            // Only log if the playlist is public, so private playlist additions don't leak to friends
            if (playlist.isPublic) {
                await activityModel.create({
                    user: req.user.id,
                    action: 'added_to_playlist',
                    targetType: 'playlist',
                    targetId: playlist._id
                });
            }
        } catch (actErr) {
            console.error("Activity log error:", actErr);
        }

        res.status(200).json({ success: true, data: playlist });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function removeSong(req, res) {
    try {
        const { id } = req.params;
        const { songId } = req.body || {};

        if (!songId) {
            return res.status(400).json({ success: false, message: "Song ID is required" });
        }

        const playlist = await playlistModel.findById(id);

        if (!playlist) {
            return res.status(404).json({ success: false, message: "Playlist not found" });
        }

        if (playlist.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "You are not the owner of this playlist" });
        }

        const song = await musicModel.findById(songId);
        if (!song) {
            return res.status(404).json({ success: false, message: "Song not found" });
        }

        const songIsInPlaylist = await playlistModel.exists({ _id: id, songs: songId });
        if (!songIsInPlaylist) {
            return res.status(400).json({ success: false, message: "Song not found in playlist" });
        }

        playlist.songs.pull(songId);
        playlist.totalDuration -= song.duration;

        await playlist.save();

        res.status(200).json({ success: true, data: playlist });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getUserPlaylists(req, res) {
    try {
        const playlists = await playlistModel.find({ owner: req.user.id })
            .sort({ createdAt: -1 })
            .populate({
                path: 'songs',
                match: { isActive: { $ne: false } },
                populate: { path: 'artist', select: 'username firstName lastName profilePicture' }
            });

        res.status(200).json({ success: true, data: playlists });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getPlaylistById(req, res) {
    try {
        const { id } = req.params;
        
        // Populate the owner details, and deeply populate the songs and their associated artists
        const playlist = await playlistModel.findById(id)
            .populate('owner', 'username profilePicture')
            .populate({
                path: 'songs',
                match: { isActive: true }, // Ensure hidden songs are not visible
                populate: {
                    path: 'artist',
                    select: 'username profilePicture'
                }
            });

        if (!playlist) {
            return res.status(404).json({ success: false, message: "Playlist not found" });
        }

        // Privacy check: If the playlist is private, only the owner can view it
        if (!playlist.isPublic && playlist.owner._id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "This playlist is private" });
        }

        res.status(200).json({ success: true, data: playlist });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function updatePlaylist(req, res) {
    try {
        const { id } = req.params;
        const { name, description, isPublic, deleteCoverImage } = req.body || {};

        const playlist = await playlistModel.findById(id);

        if (!playlist) {
            return res.status(404).json({ success: false, message: "Playlist not found" });
        }

        // Only the owner can update the playlist
        if (playlist.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "You are not the owner of this playlist" });
        }

        let newCoverImageUrl = playlist.coverImage;

        // Handle cover image upload or deletion
        if (req.file) {
            const uploadResult = await storageService.uploadImage(req.file.buffer);
            newCoverImageUrl = uploadResult.url;

            if (playlist.coverImage && playlist.coverImage.includes('imagekit')) {
                await storageService.deleteImageByURL(playlist.coverImage);
            }
        } else if (deleteCoverImage === 'true' || deleteCoverImage === true) {
            if (playlist.coverImage && playlist.coverImage.includes('imagekit')) {
                await storageService.deleteImageByURL(playlist.coverImage);
            }
            newCoverImageUrl = ''; // Reset to empty
        }

        // Dynamically update fields
        playlist.name = name || playlist.name; // Cannot clear name
        if (description !== undefined) {
            playlist.description = description; // Allow clearing description
        }
        if (isPublic !== undefined) {
            playlist.isPublic = isPublic === 'true' || isPublic === true; // Support form-data string "true"
        }
        playlist.coverImage = newCoverImageUrl;

        await playlist.save();

        res.status(200).json({ success: true, data: playlist });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getCommunityPlaylists(req, res) {
    try {
        let limit = parseInt(req.query.limit);
        if (isNaN(limit) || limit <= 0 || limit > 50) {
            limit = 20;
        }

        const playlists = await playlistModel.find({ isPublic: true })
            .sort({ likesCount: -1, createdAt: -1 })
            .limit(limit)
            .populate('owner', 'username profilePicture')
            .populate({
                path: 'songs',
                match: { isActive: { $ne: false } },
                populate: { path: 'artist', select: 'username firstName lastName profilePicture' }
            });

        res.status(200).json({
            success: true,
            message: "Community playlists fetched successfully",
            data: playlists,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    createPlaylist,
    addSong,
    removeSong,
    getUserPlaylists,
    getPlaylistById,
    updatePlaylist,
    getCommunityPlaylists
};
