const activityModel = require('../models/activity.model');
const musicModel = require('../models/music.model');
const albumModel = require('../models/album.model');
const playlistModel = require('../models/playlist.model');

const ARTIST_FIELDS = 'username firstName lastName profilePicture';
// `uri` + `duration` let the client play a song straight from the feed.
const MUSIC_FIELDS = 'title coverImage artist album uri duration isActive';

/**
 * Activity.targetId is polymorphic but has no `ref`/`refPath`, so a plain
 * `.populate('targetId')` is a no-op. Resolve targets manually: one query per
 * target type (max 3 queries regardless of feed size, plus one for playlist
 * fallback covers).
 */
async function resolveTargets(activities) {
    const idsByType = { music: [], album: [], playlist: [] };
    for (const activity of activities) {
        idsByType[activity.targetType]?.push(activity.targetId);
        // Songs added to playlists are resolved alongside regular music targets
        if (activity.relatedMusic) idsByType.music.push(activity.relatedMusic);
    }

    const [musics, albums, playlists] = await Promise.all([
        idsByType.music.length
            ? musicModel.find({ _id: { $in: idsByType.music } }).select(MUSIC_FIELDS).populate('artist', ARTIST_FIELDS).lean()
            : [],
        idsByType.album.length
            ? albumModel.find({ _id: { $in: idsByType.album } }).select('title coverImage artist isActive').populate('artist', ARTIST_FIELDS).lean()
            : [],
        idsByType.playlist.length
            ? playlistModel.find({ _id: { $in: idsByType.playlist } }).select('name coverImage isPublic songs owner').populate('owner', 'username firstName lastName').lean()
            : [],
    ]);

    // Playlists without custom artwork borrow their first song's cover
    const firstSongIds = playlists
        .filter(pl => !pl.coverImage && pl.songs?.length)
        .map(pl => pl.songs[0]);
    const firstSongs = firstSongIds.length
        ? await musicModel.find({ _id: { $in: firstSongIds } }).select('coverImage').lean()
        : [];
    const coverBySong = new Map(firstSongs.map(s => [String(s._id), s.coverImage]));

    const shapedPlaylists = playlists.map(({ songs = [], ...pl }) => ({
        ...pl,
        songCount: songs.length,
        coverImage: pl.coverImage || coverBySong.get(String(songs[0])) || '',
    }));

    return new Map(
        [...musics, ...albums, ...shapedPlaylists]
            .filter(doc => doc.isActive !== false)
            .map(doc => [String(doc._id), doc])
    );
}

async function getFeed(req, res) {
    try {
        let limit = parseInt(req.query.limit);
        if (isNaN(limit) || limit <= 0 || limit > 50) {
            limit = 20;
        }

        // Over-fetch slightly so dropping deleted/inactive targets still fills the page
        const activities = await activityModel.find()
            .sort({ createdAt: -1 })
            .limit(limit + 10)
            .populate('user', 'username firstName lastName profilePicture role')
            .lean();

        const targets = await resolveTargets(activities);

        const data = activities
            .filter(activity => activity.user) // drop activities from deleted users
            .map(activity => ({
                ...activity,
                target: targets.get(String(activity.targetId)) || null,
                related: activity.relatedMusic ? targets.get(String(activity.relatedMusic)) || null : null,
            }))
            .filter(activity => activity.target) // drop activities whose content no longer exists
            .slice(0, limit);

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
