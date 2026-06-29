const express = require('express');
const multer = require('multer');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.put('/profile',
    authMiddleware.authenticateUser,
    upload.single('profilePicture'),
    userController.updateProfile
);

router.put('/request-artist',
    authMiddleware.authenticateUser,
    userController.requestArtist
);

router.post('/report', 
    authMiddleware.authenticateUser,
    userController.reportContent
);

module.exports = router;
