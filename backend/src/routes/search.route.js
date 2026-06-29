const express = require('express');
const searchController = require('../controllers/search.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/',
    authMiddleware.authenticateUser,
    searchController.search
);

module.exports = router;
