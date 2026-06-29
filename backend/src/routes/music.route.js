const express = require('express');
const multer = require('multer');
const musicController = require('../controllers/music.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload',
    authMiddleware.authenticateArtist,
    upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
    ]),
    musicController.createMusic
);

router.post('/create-album',
    authMiddleware.authenticateArtist,
    upload.single('coverImage'),
    musicController.createAlbum
);

router.get('/',
    authMiddleware.authenticateUser,
    musicController.getAllMusic
);

router.get('/albums',
    authMiddleware.authenticateUser,
    musicController.getAllAlbums
);

router.get('/albums/:id',
    authMiddleware.authenticateUser,
    musicController.getAlbumById
);

router.post('/play/:id',
    authMiddleware.authenticateUser,
    musicController.incrementPlayCount
);

router.get('/trending-music',
    authMiddleware.authenticateUser,
    musicController.getTrendingMusic
);

router.get('/trending-music/:limit',
    authMiddleware.authenticateUser,
    musicController.getTrendingMusic
);

router.get('/trending-albums',
    authMiddleware.authenticateUser,
    musicController.getTrendingAlbums
);

router.get('/trending-albums/:limit',
    authMiddleware.authenticateUser,
    musicController.getTrendingAlbums
);

router.get('/trending-artists',
    authMiddleware.authenticateUser,
    musicController.getTrendingArtists
);

router.get('/trending-artists/:limit',
    authMiddleware.authenticateUser,
    musicController.getTrendingArtists
);

router.get('/artist/:id/music',
    authMiddleware.authenticateUser,
    musicController.getArtistMusic
);

router.get('/artist/:id/albums',
    authMiddleware.authenticateUser,
    musicController.getArtistAlbums
);

module.exports = router;
