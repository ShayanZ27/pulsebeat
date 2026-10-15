const activityModel = require('../models/activity.model');
const musicModel = require('../models/music.model');
const albumModel = require('../models/album.model');
const playlistModel = require('../models/playlist.model');

const ARTIST_FIELDS = 'username firstName lastName';

/**
 * Activity.targetId is polymorphic but has no `ref`/`refPath`, so a plain
 * `.populate('targetId')` is a no-op. Resolve targets manually: one query per
 * target type (max 3 queries regardless of feed size).
 */
async function resolveTargets(activities) {
    const idsByType = { music: [], album: [], playlist: [] };
    for (const activity of activities) {
        idsByType[activity.targetType]?.push(activity.targetId);
    }

    const [musics, albums, playlists] = await Promise.all([
        idsByType.music.length
            ? musicModel.find({ _id: { $in: idsByType.music } }).select('title coverImage artist').populate('artist', ARTIST_FIELDS).lean()
            : [],
        idsByType.album.length
            ? albumModel.find({ _id: { $in: idsByType.album } }).select('title coverImage artist').populate('artist', ARTIST_FIELDS).lean()
            : [],
        idsByType.playlist.length
            ? playlistModel.find({ _id: { $in: idsByType.playlist } }).select('name coverImage').lean()
            : [],
    ]);

    return new Map([...musics, ...albums, ...playlists].map(doc => [String(doc._id), doc]));
}

async function getFeed(req, res) {
    try {
        let limit = parseInt(req.query.limit);
        if (isNaN(limit) || limit <= 0 || limit > 50) {
            limit = 20;
        }

        const activities = await activityModel.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('user', 'username firstName lastName profilePicture')
            .lean();

        const targets = await resolveTargets(activities);

        const data = activities
            .filter(activity => activity.user) // drop activities from deleted users
            .map(activity => ({
                ...activity,
                target: targets.get(String(activity.targetId)) || null,
            }));

        res.status(200).json({
            success: true,
            message: "Activity feed fetched successfully",
            data,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    getFeed,
};
