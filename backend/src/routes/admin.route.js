const express = require("express");
const adminController = require("../controllers/admin.controller");
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get("/artist-requests",
    authMiddleware.authenticateAdmin,
    adminController.getAllArtistRequests
);

router.put("/approve-artist/:requestId",
    authMiddleware.authenticateAdmin,
    adminController.approveArtist
);

router.put("/reject-artist/:requestId",
    authMiddleware.authenticateAdmin,
    adminController.rejectArtist
);

router.patch("/suspend-user/:userId",
    authMiddleware.authenticateAdmin,
    adminController.suspendUser
);

router.patch("/unsuspend-user/:userId",
    authMiddleware.authenticateAdmin,
    adminController.unsuspendUser
);

router.put('/hide-content/:contentId', 
    authMiddleware.authenticateAdmin,
    adminController.hideContent
);

router.put('/restore-content/:contentId', 
    authMiddleware.authenticateAdmin,
    adminController.restoreContent
);

router.get('/reports', 
    authMiddleware.authenticateAdmin,
    adminController.fetchReports
);

router.put('/resolve-report/:reportId', 
    authMiddleware.authenticateAdmin,
    adminController.resolveReport
);

module.exports = router;