const express = require('express');
const featuredController = require('../controllers/featured.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', featuredController.getFeatured);

module.exports = router;
