const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        enum: ['liked', 'uploaded_music', 'uploaded_album', 'added_to_playlist'],
        required: true,
    },
    targetType: {
        type: String,
        enum: ['music', 'album', 'playlist'],
        required: true,
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    // Optional context for 'added_to_playlist': the (first) song that was added
    // and how many songs were added in that action.
    relatedMusic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Music',
        default: null,
    },
    relatedCount: {
        type: Number,
        default: 1,
    },
}, { timestamps: true });

// Index for efficient feed queries (newest first, per user)
activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

// Post-save hook to maintain a max of 100 records per user
activitySchema.post('save', async function (doc, next) {
    try {
        const Activity = this.constructor;
        const count = await Activity.countDocuments({ user: doc.user });
        
        if (count > 100) {
            // Find the oldest records exceeding 100
            const oldestRecords = await Activity.find({ user: doc.user })
                .sort({ createdAt: -1 })
                .skip(100)
                .select('_id');
            
            const idsToDelete = oldestRecords.map(record => record._id);
            if (idsToDelete.length > 0) {
                await Activity.deleteMany({ _id: { $in: idsToDelete } });
            }
        }
        next();
    } catch (error) {
        console.error("Error in Activity deque cleanup:", error);
        next(error);
    }
});

const activityModel = mongoose.model('Activity', activitySchema);

module.exports = activityModel;
