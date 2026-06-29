const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedContent: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'contentType'
    },
    contentType: {
        type: String,
        enum: ['Music', 'Album', 'User'],
        required: true
    },
    reason: {
        type: String,
        enum: ['spam', 'abusive', 'inappropriate', 'copyright', 'other'],
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    },
    actionTaken: {
        type: String,
        default: ""
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    }
}, { timestamps: true });

reportSchema.index({ reporter: 1, reportedContent: 1, contentType: 1, status: 1 });

const reportModel = mongoose.model('Report', reportSchema);

module.exports = reportModel;
