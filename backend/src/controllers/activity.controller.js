const activityModel = require('../models/activity.model');

async function getFeed(req, res) {
    try {
        let limit = parseInt(req.query.limit);
        if (isNaN(limit) || limit <= 0 || limit > 50) {
            limit = 20;
        }

        const activities = await activityModel.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('user', 'username profilePicture')
            .populate('targetId');

        res.status(200).json({
            success: true,
            message: "Activity feed fetched successfully",
            data: activities,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    getFeed,
};
