const express = require('express');
const likeController = require('../controllers/like.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/:id',
    authMiddleware.authenticateUser,
    likeController.addLike
);

router.delete('/:id',
    authMiddleware.authenticateUser,
    likeController.removeLike
);

router.get('/liked-music',
    authMiddleware.authenticateUser,
    likeController.getLikedMusic
);

router.get('/liked-album',
    authMiddleware.authenticateUser,
    likeController.getLikedAlbum
);

router.get('/liked-playlists',
    authMiddleware.authenticateUser,
    likeController.getLikedPlaylists
);

module.exports = router;