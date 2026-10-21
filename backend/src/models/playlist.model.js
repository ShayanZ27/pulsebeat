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
    // Hero showcase: pinned by admin, lower featuredOrder shows first
    isFeatured: {
        type: Boolean,
        default: false,
        index: true
    },
    featuredOrder: {
        type: Number,
        default: 0
    },

}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Dynamic totalDuration on the fly (sums populated active songs)
playlistSchema.virtual('totalDuration').get(function() {
    if (!this.songs || !Array.isArray(this.songs)) return 0;
    return this.songs.reduce((acc, song) => {
        if (song && typeof song === 'object' && song.duration) {
            return acc + (song.duration || 0);
        }
        return acc;
    }, 0);
});

const playlistModel = mongoose.model('Playlist', playlistSchema);

module.exports = playlistModel;