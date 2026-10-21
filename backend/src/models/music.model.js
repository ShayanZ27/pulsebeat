const mongoose = require('mongoose')

const GENRES = [
  "Bollywood", "Pop", "Rock", "Hip-Hop", "Rap", 
  "EDM", "Jazz", "Classical", "Indie", "Instrumental"
];

const MOODS = [
  "Happy", "Sad", "Romantic", "Chill", "Party", 
  "Energetic", "Focus", "Sleep", "Nostalgic", "Calm"
];

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
        enum: GENRES,
        required: true
    },
    mood: {
        type: String,
        enum: MOODS,
        required: true
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
    },
    isSuspended: {
        type: Boolean,
        default: false,
        index: true
    },
    // Hero showcase: pinned by admin, lower featuredOrder shows first
    isFeatured: {
        type: Boolean,
        default: false,
        index: true
    },
    featuredOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const musicModel = mongoose.model('Music', musicSchema);

module.exports = musicModel;