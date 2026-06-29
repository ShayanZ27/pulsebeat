const mongoose = require('mongoose')

const musicSchema = new mongoose.Schema({
    uri: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // v1.1
    coverImage: {
        type: String,
        required: true
    },

    duration: {
        type: Number,
        required: true
    }, // seconds

    plays: {
        type: Number,
        default: 0
    },

    likesCount: {
        type: Number,
        default: 0
    },

    genre: {
        type: String,
        required: false,
        default: "Unknown"
    },

    album: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album',
        required: false,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const musicModel = mongoose.model('Music', musicSchema);

module.exports = musicModel;