const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoute = require('./routes/auth.route');
const musicRoute = require('./routes/music.route');
const likeRoute = require('./routes/like.route');
const userRoute = require('./routes/user.route');
const playlistRoute = require('./routes/playlist.route');
const searchRoute = require('./routes/search.route');
const adminRoute = require('./routes/admin.route');

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoute);
app.use('/api/music', musicRoute);
app.use('/api/like', likeRoute);
app.use('/api/user', userRoute);
app.use('/api/playlist', playlistRoute);
app.use('/api/search', searchRoute);
app.use('/api/admin', adminRoute);

module.exports = app;