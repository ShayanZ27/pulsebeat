const mongoose = require("mongoose");

const recentlyPlayedSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    history: {
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "history.contentType",
            required: true
        },
        contentType: {
            type: String,
            enum: ["Music", "Album"],
            required: true
        },
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
})

const recentlyPlayedModel = mongoose.model("RecentlyPlayed", recentlyPlayedSchema);

module.exports = recentlyPlayedModel;
