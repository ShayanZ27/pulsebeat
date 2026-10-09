const express = require('express');
const activityController = require('../controllers/activity.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/feed',
    authMiddleware.authenticateUser,
    activityController.getFeed
);

module.exports = router;
