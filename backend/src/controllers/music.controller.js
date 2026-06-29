const musicModel = require("../models/music.model");
const albumModel = require("../models/album.model");
const userModel = require("../models/user.model");
const storageService = require("../services/storage.service");
const mm = require("music-metadata");
const recentlyPlayedModel = require("../models/recently-played.model");

async function createMusic(req, res) {
    try {
        const { title, genre } = req.body;

        // Grab both files from req.files
        const file = req.files && req.files.file ? req.files.file[0] : null;
        const coverImageFile = req.files && req.files.coverImage ? req.files.coverImage[0] : null;

        if (!title || !file || !coverImageFile) {
            return res.status(400).json({ success: false, message: "Title, audio file, and cover image are required" });
        }

        // Calculate duration directly from the audio file buffer
        const metadata = await mm.parseBuffer(file.buffer, file.mimetype);
        const calculatedDuration = Math.round(metadata.format.duration || 0);

        // Upload Audio
        const storageResult = await storageService.uploadFile(file.buffer);

        if (!storageResult || !storageResult.url) {
            return res.status(500).json({ success: false, message: "Failed to upload audio file" });
        }

        // Upload Cover Image (pass the buffer directly to imagekit)
        const imageResult = await storageService.uploadImage(coverImageFile.buffer);

        if (!imageResult || !imageResult.url) {
            return res.status(500).json({ success: false, message: "Failed to upload cover image" });
        }

        const musicData = {
            uri: storageResult.url,
            title: title,
            artist: req.user.id,
            coverImage: imageResult.url,
            duration: calculatedDuration
        };

        if (genre) {
            musicData.genre = genre;
        }

        const music = new musicModel(musicData);

        await music.save();
        res.status(201).json({ success: true, message: "Music created successfully", data: music });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function createAlbum(req, res) {
    try {
        const { title, description, songs } = req.body;
        const coverImageFile = req.file;

        if (!title || !description || !songs || !coverImageFile) {
            return res.status(400).json({ success: false, message: "Title, description, songs, and cover image are required" });
        }

        // Handle songs sent as JSON string or comma-separated string from form-data
        let parsedSongs = [];
        if (typeof songs === 'string') {
            try {
                parsedSongs = JSON.parse(songs);
            } catch (e) {
                parsedSongs = songs.split(',').map(s => s.trim());
            }
        } else if (Array.isArray(songs)) {
            parsedSongs = songs;
        }

        // Clean up whitespace and ensure uniqueness
        parsedSongs = [...new Set(parsedSongs.map(s => String(s).trim()))];

        // Validate that all IDs are properly formatted MongoDB ObjectIds
        const mongoose = require('mongoose');
        const invalidIds = parsedSongs.filter(id => !mongoose.isValidObjectId(id));

        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: "One or more song IDs are invalid format."
            });
        }

        if (parsedSongs.length === 0) {
            return res.status(400).json({ success: false, message: "At least one song is required" });
        }

        // Verify that all selected songs belong to the authenticated artist
        const validSongsCount = await musicModel.countDocuments({
            _id: { $in: parsedSongs },
            artist: req.user.id
        });

        if (validSongsCount !== parsedSongs.length) {
            return res.status(403).json({ success: false, message: "One or more songs do not belong to you or do not exist." });
        }

        // Upload Cover Image
        const imageResult = await storageService.uploadImage(coverImageFile.buffer);

        if (!imageResult || !imageResult.url) {
            return res.status(500).json({ success: false, message: "Failed to upload cover image" });
        }

        const album = new albumModel({
            title: title,
            description: description,
            artist: req.user.id,
            coverImage: imageResult.url,
            songs: parsedSongs,
        });

        await album.save();

        // Update all the associated songs to link them back to this new album
        await musicModel.updateMany(
            { _id: { $in: parsedSongs } },
            { $set: { album: album._id } }
        );

        res.status(201).json({ success: true, message: "Album created successfully", data: album });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getAllMusic(req, res) {
    try {
        // Fetch active music, including older records that don't have the isActive field yet
        const musics = await musicModel.find({ isActive: { $ne: false } }).populate('artist', 'username email');
        res.status(200).json({
            success: true,
            message: "All active music fetched successfully",
            data: musics,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getAllAlbums(req, res) {
    try {
        // Fetch active albums, including older records that don't have the isActive field yet
        const albums = await albumModel.find({ isActive: { $ne: false } }).select('title artist').populate('artist');
        res.status(200).json({
            success: true,
            message: "All active albums fetched successfully",
            data: albums,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getAlbumById(req, res) {
    const id = req.params.id;
    try {
        const album = await albumModel.findById(id).populate('artist', 'username email').populate('songs');
        res.status(200).json({
            success: true,
            message: "Album fetched successfully",
            data: album,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function incrementPlayCount(req, res) {
    const { id } = req.params;
    try {
        const music = await musicModel.findByIdAndUpdate(
            id,
            { $inc: { plays: 1 } },
            { returnDocument: 'after' }
        );

        if (!music) {
            return res.status(404).json({
                success: false,
                message: "Music not found"
            });
        }

        if (music.album) {
            const album = await albumModel.findById(music.album);
            if (album) {
                album.plays = (album.plays || 0) + 1;
                await album.save();
            }
        }

        // --- RECENTLY PLAYED DEQUE LOGIC ---
        // 1. Delete existing record for this song to prevent duplicates (brings it to the top)
        await recentlyPlayedModel.deleteMany({ 
            userId: req.user.id, 
            'history.contentId': music._id 
        });

        // 2. Add the new record to the top of the history
        const newRecord = new recentlyPlayedModel({
            userId: req.user.id,
            history: {
                contentId: music._id,
                contentType: 'Music'
            }
        });
        await newRecord.save();

        // 3. Enforce max 10 records per user (Deque cleanup)
        const userRecords = await recentlyPlayedModel.find({ userId: req.user.id })
            .sort({ timestamp: -1 })
            .select('_id');

        if (userRecords.length > 10) {
            const recordsToDelete = userRecords.slice(10).map(record => record._id);
            await recentlyPlayedModel.deleteMany({ _id: { $in: recordsToDelete } });
        }
        // -----------------------------------

        res.status(200).json({
            success: true,
            message: "Play count incremented successfully",
            data: music,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getTrendingMusic(req, res) {
    try {
        let limit = parseInt(req.params.limit);
        if (isNaN(limit) || limit <= 0 || limit > 50) {
            limit = 20;
        }

        const musics = await musicModel.find({ isActive: { $ne: false } }).sort({ plays: -1, likesCount: -1 }).limit(limit);
        res.status(200).json({
            success: true,
            message: "Trending music fetched successfully",
            data: musics,
        }); 
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getTrendingAlbums(req, res) {
    try {
        let limit = parseInt(req.params.limit);
        if (isNaN(limit) || limit <= 0 || limit > 50) {
            limit = 20;
        }

        const albums = await albumModel.find({ isActive: { $ne: false } }).sort({ plays: -1, likesCount: -1 }).limit(limit);
        res.status(200).json({
            success: true,
            message: "Trending albums fetched successfully",
            data: albums,
        }); 
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getTrendingArtists(req, res) {
    try {
        let limit = parseInt(req.params.limit);
        if (isNaN(limit) || limit <= 0 || limit > 50) {
            limit = 20;
        }

        const trendingArtists = await musicModel.aggregate([
            // 1. Only look at active music
            { $match: { isActive: { $ne: false } } },

            // 2. Group all songs by the artist, and sum up their total plays and likes
            { 
                $group: { 
                    _id: "$artist",
                    totalPlays: { $sum: "$plays" }, 
                    totalLikes: { $sum: "$likesCount" } 
                } 
            },

            // 3. Sort by totalPlays (and then totalLikes) descending
            { $sort: { totalPlays: -1, totalLikes: -1 } },

            // 4. JOIN the User collection to get the artist's profile info
            { 
                $lookup: {
                    from: "users", // The exact name of the MongoDB collection in the database
                    localField: "_id",
                    foreignField: "_id",
                    as: "artistDetails"
                } 
            },

            // 5. Unwind the joined array so it's a single object
            { $unwind: "$artistDetails" },

            // 6. FILTER OUT suspended users (Crucial step!)
            { $match: { "artistDetails.isSuspended": { $ne: true } } },

            // 7. Limit the results AFTER filtering out suspended users
            { $limit: limit },

            // 8. Format the final output to hide passwords and clean up the data
            { 
                $project: {
                    _id: 1,
                    totalPlays: 1,
                    totalLikes: 1,
                    "artistDetails._id": 1,
                    "artistDetails.username": 1,
                    "artistDetails.profilePicture": 1,
                    "artistDetails.bio": 1
                } 
            }
        ]);

        res.status(200).json({
            success: true,
            message: "Trending artists fetched successfully",
            data: trendingArtists,
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getArtistMusic(req, res) {
    try {
        const artistId = req.params.id;

        const artist = await userModel.findById(artistId);
        if (!artist || artist.isSuspended) {
            return res.status(403).json({ success: false, message: "Artist is unavailable or suspended" });
        }
        // 1. Filter out inactive tracks
        // 2. Removed .select('title artist') because the frontend needs uri, coverImage, etc., to play the song!
        // 3. Populate specifically selected safe fields to avoid sending the artist's password/email to the frontend
        const musics = await musicModel.find({ artist: artistId, isActive: { $ne: false } })
            .populate('artist', 'username profilePicture');
        res.status(200).json({
            success: true,
            message: "Artist music fetched successfully",
            data: musics,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getArtistAlbums(req, res) {
    try {
        const artistId = req.params.id;

        const artist = await userModel.findById(artistId);
        if (!artist || artist.isSuspended) {
            return res.status(403).json({ success: false, message: "Artist is unavailable or suspended" });
        }
        // Same fixes here: check isActive, remove overly strict select, and secure populate
        const albums = await albumModel.find({ artist: artistId, isActive: { $ne: false } })
            .populate('artist', 'username profilePicture');
        res.status(200).json({
            success: true,
            message: "Artist albums fetched successfully",
            data: albums,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    createMusic,
    createAlbum,
    getAllMusic,
    getAllAlbums,
    getAlbumById,
    incrementPlayCount,
    getTrendingMusic,
    getTrendingAlbums,
    getArtistMusic,
    getArtistAlbums,
    getTrendingArtists
};