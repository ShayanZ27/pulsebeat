const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['artist', 'user', 'admin'],
        default: 'user',
    },

    // v1.1
    profilePicture: {
        type: String,
        required: false,
        default: ''
    },
    bio: {
        type: String,
        required: false,
        default: ''
    },
    isSuspended: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const userModel = mongoose.model('User', UserSchema);

module.exports = userModel;