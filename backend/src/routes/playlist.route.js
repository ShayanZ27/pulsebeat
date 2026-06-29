const express = require('express');
const multer = require('multer');
const playlistController = require('../controllers/playlist.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/create',
    authMiddleware.authenticateUser,
    playlistController.createPlaylist
);

router.post('/:id/add-song',
    authMiddleware.authenticateUser,
    playlistController.addSong
);

router.patch('/:id/remove-song',
    authMiddleware.authenticateUser,
    playlistController.removeSong
);

router.get('/',
    authMiddleware.authenticateUser,
    playlistController.getUserPlaylists
);

router.get('/:id',
    authMiddleware.authenticateUser,
    playlistController.getPlaylistById
);

router.patch('/:id',
    authMiddleware.authenticateUser,
    upload.single('coverImage'),
    playlistController.updatePlaylist
);

module.exports = router;