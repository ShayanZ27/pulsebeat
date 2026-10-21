const mongoose = require("mongoose");
const musicModel = require("../models/music.model");
const albumModel = require("../models/album.model");
const userModel = require("../models/user.model");
const storageService = require("../services/storage.service");
const mm = require("music-metadata");
const recentlyPlayedModel = require("../models/recently-played.model");
const activityModel = require('../models/activity.model');

const VALID_GENRES = [
  "Bollywood", "Pop", "Rock", "Hip-Hop", "Rap", 
  "EDM", "Jazz", "Classical", "Indie", "Instrumental"
];

const VALID_MOODS = [
  "Happy", "Sad", "Romantic", "Chill", "Party", 
  "Energetic", "Focus", "Sleep", "Nostalgic", "Calm"
];


async function createMusic(req, res) {
    try {
        const { title, genre, mood } = req.body;


        // Grab both files from req.files
        const file = req.files && req.files.file ? req.files.file[0] : null;
        const coverImageFile = req.files && req.files.coverImage ? req.files.coverImage[0] : null;

        if (!title || !file || !coverImageFile || !genre || !mood) {
            return res.status(400).json({ success: false, message: "Title, audio file, cover image, genre, and mood are required" });
        }

        if (!VALID_GENRES.includes(genre)) {
            return res.status(400).json({ success: false, message: "Invalid genre provided" });
        }
        
        if (!VALID_MOODS.includes(mood)) {
            return res.status(400).json({ success: false, message: "Invalid mood provided" });
        }


        // Calculate duration directly from the audio file buffer.
        // Allow auto-detection of audio container/codec from magic bytes first,
        // with duration: true enabled so VBR/EOF streams calculate accurately.
        let metadata = await mm.parseBuffer(file.buffer, undefined, { duration: true }).catch(() => null);
        if (!metadata || !metadata.format || !metadata.format.duration) {
            metadata = await mm.parseBuffer(file.buffer, file.mimetype, { duration: true }).catch(() => null);
        }
        const calculatedDuration = Math.round(metadata?.format?.duration || 0);

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
            duration: calculatedDuration,
            genre: genre,
            mood: mood
        };

        const music = new musicModel(musicData);

        await music.save();
        
        // Log activity
        try {
            await activityModel.create({
                user: req.user.id,
                action: 'uploaded_music',
                targetType: 'music',
                targetId: music._id
            });
        } catch (actErr) {
            console.error("Activity log error:", actErr);
        }

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

        // Log activity
        try {
            await activityModel.create({
                user: req.user.id,
                action: 'uploaded_album',
                targetType: 'album',
                targetId: album._id
            });
        } catch (actErr) {
            console.error("Activity log error:", actErr);
        }

        res.status(201).json({ success: true, message: "Album created successfully", data: album });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getAllMusic(req, res) {
    try {
        const { mood, genre } = req.query;
        
        // Base query for active and not suspended music
        let query = { isActive: { $ne: false }, isSuspended: { $ne: true } };

        // Add case-insensitive filters if provided
        if (mood) query.mood = new RegExp(`^${mood}$`, 'i');
        if (genre) query.genre = new RegExp(`^${genre}$`, 'i');

        // Fetch music based on query, limit to 40
        const musics = await musicModel.find(query)
            .populate('artist', 'username firstName lastName profilePicture')
            .limit(40);

        res.status(200).json({
            success: true,
            message: "Music fetched successfully",
            data: musics,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getAllAlbums(req, res) {
    try {
        // Fetch active, non-suspended albums
        const albums = await albumModel.find({ isActive: { $ne: false }, isSuspended: { $ne: true } }).select('title artist').populate('artist');
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
    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ success: false, message: "Album not found or unavailable" });
    }
    try {
        const album = await albumModel.findOne({ _id: id, isSuspended: { $ne: true } })
            .populate('artist', 'username firstName lastName profilePicture')
            .populate({
                path: 'songs',
                match: { isActive: { $ne: false }, isSuspended: { $ne: true } },
                populate: { path: 'artist', select: 'username firstName lastName profilePicture' }
            });

        if (!album) {
            return res.status(404).json({ success: false, message: "Album not found or unavailable" });
        }

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
        // 1. Atomically upsert record for this song with latest timestamp (guarantees uniqueness)
        await recentlyPlayedModel.findOneAndUpdate(
            { 
                userId: req.user.id, 
                'history.contentType': 'Music',
                'history.contentId': music._id 
            },
            {
                userId: req.user.id,
                history: {
                    contentId: music._id,
                    contentType: 'Music'
                },
                timestamp: new Date()
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );

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
        const page = parseInt(req.query.page);
        let limit = parseInt(req.query.limit) || parseInt(req.params.limit) || 20;
        if (isNaN(limit) || limit <= 0 || limit > 100) {
            limit = 20;
        }

        const filter = { isActive: { $ne: false }, isSuspended: { $ne: true } };

        if (!isNaN(page) && page > 0) {
            const skip = (page - 1) * limit;
            const [total, musics] = await Promise.all([
                musicModel.countDocuments(filter),
                musicModel.find(filter)
                    .sort({ plays: -1, likesCount: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('artist', 'username firstName lastName profilePicture')
            ]);
            return res.status(200).json({
                success: true,
                message: "Trending music fetched successfully",
                data: musics,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit) || 1
                }
            });
        }

        const musics = await musicModel.find(filter)
            .sort({ plays: -1, likesCount: -1 })
            .limit(limit)
            .populate('artist', 'username firstName lastName profilePicture');
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
        const page = parseInt(req.query.page);
        let limit = parseInt(req.query.limit) || parseInt(req.params.limit) || 20;
        if (isNaN(limit) || limit <= 0 || limit > 100) {
            limit = 20;
        }

        const filter = { isActive: { $ne: false }, isSuspended: { $ne: true } };

        if (!isNaN(page) && page > 0) {
            const skip = (page - 1) * limit;
            const [total, albums] = await Promise.all([
                albumModel.countDocuments(filter),
                albumModel.find(filter)
                    .sort({ plays: -1, likesCount: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('artist', 'username firstName lastName profilePicture')
                    .populate({
                        path: 'songs',
                        match: { isActive: { $ne: false }, isSuspended: { $ne: true } },
                        populate: { path: 'artist', select: 'username firstName lastName profilePicture' }
                    })
            ]);
            return res.status(200).json({
                success: true,
                message: "Trending albums fetched successfully",
                data: albums,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit) || 1
                }
            });
        }

        const albums = await albumModel.find(filter)
            .sort({ plays: -1, likesCount: -1 })
            .limit(limit)
            .populate('artist', 'username firstName lastName profilePicture')
            .populate({
                path: 'songs',
                match: { isActive: { $ne: false }, isSuspended: { $ne: true } },
                populate: { path: 'artist', select: 'username firstName lastName profilePicture' }
            });
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
        const page = parseInt(req.query.page);
        let limit = parseInt(req.query.limit) || parseInt(req.params.limit) || 20;
        if (isNaN(limit) || limit <= 0 || limit > 100) {
            limit = 20;
        }

        const basePipeline = [
            // 1. Only look at active, non-suspended music
            { $match: { isActive: { $ne: false }, isSuspended: { $ne: true } } },

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
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "artistDetails"
                } 
            },

            // 5. Unwind the joined array so it's a single object
            { $unwind: "$artistDetails" },

            // 6. FILTER OUT suspended users
            { $match: { "artistDetails.isSuspended": { $ne: true } } }
        ];

        if (!isNaN(page) && page > 0) {
            const skip = (page - 1) * limit;
            const [facetResult] = await musicModel.aggregate([
                ...basePipeline,
                {
                    $facet: {
                        data: [
                            { $skip: skip },
                            { $limit: limit },
                            { 
                                $project: {
                                    _id: 1,
                                    totalPlays: 1,
                                    totalLikes: 1,
                                    "artistDetails._id": 1,
                                    "artistDetails.username": 1,
                                    "artistDetails.firstName": 1,
                                    "artistDetails.lastName": 1,
                                    "artistDetails.profilePicture": 1,
                                    "artistDetails.bio": 1
                                } 
                            }
                        ],
                        totalCount: [{ $count: "count" }]
                    }
                }
            ]);

            const total = facetResult?.totalCount?.[0]?.count || 0;
            const trendingArtists = facetResult?.data || [];

            return res.status(200).json({
                success: true,
                message: "Trending artists fetched successfully",
                data: trendingArtists,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit) || 1
                }
            });
        }

        const trendingArtists = await musicModel.aggregate([
            ...basePipeline,
            { $limit: limit },
            { 
                $project: {
                    _id: 1,
                    totalPlays: 1,
                    totalLikes: 1,
                    "artistDetails._id": 1,
                    "artistDetails.username": 1,
                    "artistDetails.firstName": 1,
                    "artistDetails.lastName": 1,
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
        
        const isOwner = req.user && String(req.user.id) === String(artistId);
        const filter = { artist: artistId };
        if (!isOwner) {
            filter.isActive = { $ne: false };
            filter.isSuspended = { $ne: true };
        }

        const musics = await musicModel.find(filter)
            .sort({ createdAt: -1 })
            .populate('artist', 'username firstName lastName profilePicture');
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
        
        const isOwner = req.user && String(req.user.id) === String(artistId);
        const filter = { artist: artistId };
        if (!isOwner) {
            filter.isActive = { $ne: false };
            filter.isSuspended = { $ne: true };
        }

        const albums = await albumModel.find(filter)
            .sort({ createdAt: -1 })
            .populate('artist', 'username firstName lastName profilePicture')
            .populate({
                path: 'songs',
                match: isOwner ? {} : { isActive: { $ne: false }, isSuspended: { $ne: true } }
            });
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

async function getRecentlyPlayed(req, res) {
    try {
        const records = await recentlyPlayedModel.find({ userId: req.user.id })
            .sort({ timestamp: -1 })
            .populate({
                path: 'history.contentId',
                populate: {
                    path: 'artist',
                    select: 'username firstName lastName profilePicture'
                }
            });

        // Deduplicate and filter out inactive/missing tracks
        const seen = new Set();
        const uniqueRecords = records.filter(r => {
            const content = r.history?.contentId;
            if (!content || !content._id) return false;
            const idStr = content._id.toString();
            if (seen.has(idStr)) return false;
            seen.add(idStr);
            return true;
        });

        res.status(200).json({
            success: true,
            message: "Recently played fetched successfully",
            data: uniqueRecords,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getLatestReleases(req, res) {
    try {
        const page = parseInt(req.query.page);
        let limit = parseInt(req.query.limit) || parseInt(req.params.limit) || 10;
        if (isNaN(limit) || limit <= 0 || limit > 50) {
            limit = 10;
        }

        const musicFilter = { isActive: { $ne: false }, isSuspended: { $ne: true } };
        const albumFilter = { isActive: { $ne: false }, isSuspended: { $ne: true } };

        if (!isNaN(page) && page > 0) {
            const skip = (page - 1) * limit;
            const needCount = skip + limit;

            const [totalMusic, totalAlbums, latestMusic, latestAlbums] = await Promise.all([
                musicModel.countDocuments(musicFilter),
                albumModel.countDocuments(albumFilter),
                musicModel.find(musicFilter)
                    .sort({ createdAt: -1 })
                    .limit(needCount)
                    .populate('artist', 'username firstName lastName profilePicture'),
                albumModel.find(albumFilter)
                    .sort({ createdAt: -1 })
                    .limit(needCount)
                    .populate('artist', 'username firstName lastName profilePicture')
                    .populate({
                        path: 'songs',
                        match: { isActive: { $ne: false }, isSuspended: { $ne: true } },
                        populate: { path: 'artist', select: 'username firstName lastName profilePicture' }
                    }),
            ]);

            const combined = [
                ...latestMusic.map(m => ({ ...m.toObject(), releaseType: 'music' })),
                ...latestAlbums.map(a => ({ ...a.toObject(), releaseType: 'album' })),
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
             .slice(skip, skip + limit);

            const total = totalMusic + totalAlbums;

            return res.status(200).json({
                success: true,
                message: "Latest releases fetched successfully",
                data: combined,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit) || 1
                }
            });
        }

        // Fetch latest music and albums in parallel (excluding suspended and inactive)
        const [latestMusic, latestAlbums] = await Promise.all([
            musicModel.find(musicFilter)
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('artist', 'username firstName lastName profilePicture'),
            albumModel.find(albumFilter)
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('artist', 'username firstName lastName profilePicture')
                .populate({
                    path: 'songs',
                    match: { isActive: { $ne: false }, isSuspended: { $ne: true } },
                    populate: { path: 'artist', select: 'username firstName lastName profilePicture' }
                }),
        ]);

        // Merge, tag with type, and sort by createdAt descending
        const combined = [
            ...latestMusic.map(m => ({ ...m.toObject(), releaseType: 'music' })),
            ...latestAlbums.map(a => ({ ...a.toObject(), releaseType: 'album' })),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
         .slice(0, limit);

        res.status(200).json({
            success: true,
            message: "Latest releases fetched successfully",
            data: combined,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function toggleMusicVisibility(req, res) {
    try {
        const musicId = req.params.id;
        const music = await musicModel.findById(musicId);
        if (!music) {
            return res.status(404).json({ success: false, message: "Music not found" });
        }
        if (music.artist.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized: You do not own this track" });
        }
        if (music.isSuspended) {
            return res.status(403).json({
                success: false,
                message: "This track has been suspended by administration and cannot be modified."
            });
        }
        music.isActive = !music.isActive;
        await music.save();
        res.status(200).json({
            success: true,
            message: `Track is now ${music.isActive ? 'public' : 'hidden'}`,
            data: music
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function toggleAlbumVisibility(req, res) {
    try {
        const albumId = req.params.id;
        const album = await albumModel.findById(albumId);
        if (!album) {
            return res.status(404).json({ success: false, message: "Album not found" });
        }
        if (album.artist.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized: You do not own this album" });
        }
        if (album.isSuspended) {
            return res.status(403).json({
                success: false,
                message: "This album has been suspended by administration and cannot be modified."
            });
        }
        album.isActive = !album.isActive;
        await album.save();
        res.status(200).json({
            success: true,
            message: `Album is now ${album.isActive ? 'public' : 'hidden'}`,
            data: album
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function deleteMusic(req, res) {
    return res.status(400).json({
        success: false,
        message: "Permanent deletion is disabled. Please toggle visibility to hide your track instead."
    });
}

async function deleteAlbum(req, res) {
    return res.status(400).json({
        success: false,
        message: "Permanent deletion is disabled. Please toggle visibility to hide your album instead."
    });
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
    getTrendingArtists,
    getRecentlyPlayed,
    getLatestReleases,
    toggleMusicVisibility,
    toggleAlbumVisibility,
    deleteMusic,
    deleteAlbum
};