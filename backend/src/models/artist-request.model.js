const mongoose = require('mongoose');

const artistRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    statement: {
        type: String,
        required: true,
        maxLength: 500
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        maxLength: 500
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, { timestamps: true });

const artistRequestModel = mongoose.model('ArtistRequest', artistRequestSchema);

module.exports = artistRequestModel;