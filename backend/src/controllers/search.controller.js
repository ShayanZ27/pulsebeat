const userModel = require('../models/user.model');
const musicModel = require('../models/music.model');
const albumModel = require('../models/album.model');
const playlistModel = require('../models/playlist.model');

async function search(req, res) {
    try {
        const { q, type = 'all' } = req.query;

        if (!q) {
            return res.status(400).json({ success: false, message: "Search query 'q' is required" });
        }

        // 'i' makes the regex case-insensitive (e.g. 'drake' matches 'Drake')
        const regex = new RegExp(q, 'i');
        
        // This object will hold the final results
        let results = {
            artists: [],
            music: [],
            albums: [],
            playlists: []
        };

        const promises = [];

        // 1. Search Artists
        if (type === 'all' || type === 'artist') {
            promises.push(
                userModel.find({ role: 'artist', username: { $regex: regex }, isSuspended: { $ne: true } })
                    .select('username profilePicture')
                    .limit(10)
                    .then(data => results.artists = data)
            );
        }

        // 2. Search Music
        if (type === 'all' || type === 'music') {
            promises.push(
                musicModel.find({ title: { $regex: regex }, isActive: true })
                    .populate('artist', 'username profilePicture')
                    .limit(15)
                    .then(data => results.music = data)
            );
        }

        // 3. Search Albums
        if (type === 'all' || type === 'album') {
            promises.push(
                albumModel.find({ title: { $regex: regex }, isActive: true })
                    .populate('artist', 'username profilePicture')
                    .limit(10)
                    .then(data => results.albums = data)
            );
        }

        // 4. Search Playlists
        if (type === 'all' || type === 'playlist') {
            promises.push(
                playlistModel.find({ name: { $regex: regex }, isPublic: true })
                    .populate('owner', 'username profilePicture')
                    .limit(10)
                    .then(data => results.playlists = data)
            );
        }

        // Execute all active queries in parallel
        await Promise.all(promises);

        res.status(200).json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    search
};
