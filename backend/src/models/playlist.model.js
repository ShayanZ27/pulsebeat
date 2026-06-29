const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    description: {
        type: String,
        maxlength: 50,
        trim: true
    },
    coverImage: {
        type: String,
        default: ''
    },
    isPublic: {
        type: Boolean,
        default: false,
    },
    songs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Music',
        },
    ],
    likesCount: {
        type: Number,
        default: 0,
    },
    totalDuration: {
        type: Number,
        default: 0,
    },

}, { timestamps: true })

const playlistModel = mongoose.model('Playlist', playlistSchema);

module.exports = playlistModel;