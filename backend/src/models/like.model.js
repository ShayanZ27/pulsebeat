const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    targetType: {
        type: String,
        enum: ['music', 'album', 'artist', 'playlist'],
        required: true,
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },

}, { timestamps: true });

likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

const likeModel = mongoose.model('Like', likeSchema);
module.exports = likeModel;