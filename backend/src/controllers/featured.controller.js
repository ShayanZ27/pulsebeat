const musicModel = require('../models/music.model');
const albumModel = require('../models/album.model');
const playlistModel = require('../models/playlist.model');

const SLIDE_COUNT = 5;
const ARTIST_FIELDS = 'username firstName lastName profilePicture';
const ACTIVE = { isActive: { $ne: false } };

const songPopulate = {
    path: 'songs',
    match: ACTIVE,
    populate: { path: 'artist', select: ARTIST_FIELDS },
};

function findTracks(filter, sort, limit) {
    return musicModel.find({ ...ACTIVE, ...filter })
        .sort(sort)
        .limit(limit)
        .populate('artist', ARTIST_FIELDS)
        .lean();
}

function findAlbums(filter, sort, limit) {
    return albumModel.find({ ...ACTIVE, ...filter })
        .sort(sort)
        .limit(limit)
        .populate('artist', ARTIST_FIELDS)
        .populate(songPopulate)
        .lean();
}

function findPlaylists(filter, sort, limit) {
    return playlistModel.find({ isPublic: true, ...filter })
        .sort(sort)
        .limit(limit)
        .populate('owner', ARTIST_FIELDS)
        .populate(songPopulate)
        .lean();
}

/** Playlists without their own cover borrow the first song's artwork. */
function withPlaylistCover(playlist) {
    return { ...playlist, coverImage: playlist.coverImage || playlist.songs?.[0]?.coverImage || '' };
}

const toSlide = (type) => (item) => ({ type, item });

/**
 * Hero showcase slides.
 * 1. Admin-pinned items (isFeatured), ordered by featuredOrder.
 * 2. Backfilled with trending albums / tracks / public playlists, interleaved
 *    so the carousel mixes content types.
 */
async function getFeatured(req, res) {
    try {
        const pinnedSort = { featuredOrder: 1, updatedAt: -1 };
        const [pinnedTracks, pinnedAlbums, pinnedPlaylists] = await Promise.all([
            findTracks({ isFeatured: true }, pinnedSort, SLIDE_COUNT),
            findAlbums({ isFeatured: true }, pinnedSort, SLIDE_COUNT),
            findPlaylists({ isFeatured: true }, pinnedSort, SLIDE_COUNT),
        ]);

        const pinned = [
            ...pinnedAlbums.map(toSlide('album')),
            ...pinnedTracks.map(toSlide('track')),
            ...pinnedPlaylists.map(withPlaylistCover).map(toSlide('playlist')),
        ]
            .sort((a, b) => (a.item.featuredOrder ?? 0) - (b.item.featuredOrder ?? 0))
            .slice(0, SLIDE_COUNT);

        let slides = pinned;

        if (slides.length < SLIDE_COUNT) {
            const trendingSort = { plays: -1, likesCount: -1 };
            const [albums, tracks, playlists] = await Promise.all([
                findAlbums({}, trendingSort, SLIDE_COUNT),
                findTracks({}, trendingSort, SLIDE_COUNT),
                findPlaylists({ 'songs.0': { $exists: true } }, { likesCount: -1, updatedAt: -1 }, SLIDE_COUNT),
            ]);

            const pools = [
                albums.filter((a) => a.songs?.length).map(toSlide('album')),
                tracks.map(toSlide('track')),
                playlists.map(withPlaylistCover).filter((p) => p.songs?.length).map(toSlide('playlist')),
            ];

            const seen = new Set(slides.map((s) => String(s.item._id)));
            const backfill = [];
            for (let i = 0; i < SLIDE_COUNT && backfill.length + slides.length < SLIDE_COUNT; i++) {
                for (const pool of pools) {
                    const slide = pool[i];
                    if (!slide || seen.has(String(slide.item._id))) continue;
                    seen.add(String(slide.item._id));
                    backfill.push(slide);
                    if (backfill.length + slides.length >= SLIDE_COUNT) break;
                }
            }
            slides = [...slides, ...backfill];
        }

        res.status(200).json({
            success: true,
            message: 'Featured content fetched successfully',
            data: slides,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { getFeatured };
