const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    songs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Music'
    }],

    // v1.1
    coverImage: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        required: true,
    },

    plays: {
        type: Number,
        default: 0
    },

    likesCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const albumModel = mongoose.model('Album', albumSchema);

module.exports = albumModel;
