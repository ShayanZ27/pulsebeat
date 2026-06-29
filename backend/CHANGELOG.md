# Changelog

All notable changes to this project during this session are documented in this file.

## [Unreleased]

### Added
- **Likes Feature:**
  - `like.model.js`: Implemented a polymorphic association (`targetType` and `targetId`) to support liking both `music` and `album`. Added a unique compound index to prevent duplicate likes and added `timestamps` for chronological sorting.
  - `like.controller.js`: 
    - Implemented `addLike` and `removeLike` handlers. 
    - Added `getLikedMusic` and `getLikedAlbum` endpoints using `.populate()` to fetch full object data.
  - `like.route.js`: Created routes for all like-related operations.
  - `app.js`: Registered the new `/api/like` route.
- **Music Feature:**
  - `music.controller.js`: Implemented `incrementPlayCount` to track when a song is played, and added logic to simultaneously increment the play count of the associated album.
  - `music.controller.js`: Implemented `getTrendingMusic` with dynamic, optional `.limit()` parsing to fetch top tracks sorted by `plays` and `likesCount`.
  - `music.route.js`: Added `/play/:id` and `/trending/:limit?` routes.
- **Artist & Album Trending:**
  - `music.controller.js`: Added `getTrendingAlbums` API using dynamic limits.
  - `music.controller.js`: Added `getTrendingArtists` API utilizing powerful MongoDB Aggregation pipelines to fetch top artists dynamically without mutating the user schema.
  - `music.controller.js`: Implemented `getArtistMusic` and `getArtistAlbums` to fetch artist-specific tracks, complete with an `isSuspended` safety check.
- **User Profiles:**
  - `user.controller.js` & `user.route.js`: Implemented `PUT /profile` endpoint for seamless partial updates to username, bio, and profile picture.
  - `storage.service.js`: Added `deleteImageByURL` to permanently delete old profile pictures from ImageKit.
- **Playlists Feature:**
  - `playlist.model.js`: Created schema supporting name, description, coverImage, isPublic toggle, a referenced array of `songs`, and real-time trackers for `totalDuration` and `likesCount`. Added indexing on name.
  - `playlist.controller.js` & `playlist.route.js`: Implemented full CRUD functionality including `createPlaylist`, dynamically calculated `addSong` and `removeSong`, nested deep-populated `getPlaylistById`, `getUserPlaylists`, and a powerful dynamic `updatePlaylist` handler.
- **Global Search System:**
  - `search.controller.js` & `search.route.js`: Built a unified `/api/search` endpoint utilizing parallel `Promise.all` queries. Supports a dynamic `type` query parameter (`all`, `artist`, `music`, `album`, `playlist`) with case-insensitive `$regex` matching.
- **Image Compression:**
  - `storage.service.js`: Integrated the `sharp` library to automatically resize and heavily compress raw memory buffers into high-efficiency JPEGs (reducing sizes up to 97%), completely bypassing ImageKit's 4MB Base64 payload limits.
- **Artist Request System:**
  - `artist-request.model.js`: Created schema to track pending artist requests.
  - `user.controller.js`: Implemented `requestArtist` API with strict 24-hour rate limiting and automatic cleanup of previous pending requests.
- **Admin System:**
  - `admin.controller.js` & `admin.route.js`: Implemented `getAllArtistRequests`, `approveArtist`, `rejectArtist`, `suspendUser`, and `unsuspendUser`.
  - Built content moderation endpoints (`hideContent` and `restoreContent`) for dynamically disabling music and albums.
  - Built `fetchReports` (with dynamic `status` and `type=all` query parsing) and `resolveReport` (combining resolve/dismiss logic into a single dynamic endpoint).
- **Admin User Injection:**
  - `seed-admin.js`: Created an automated Node script to bypass standard registration and securely inject a hashed SuperAdmin into the MongoDB cluster. Added to `.gitignore`.
- **User Reporting System:**
  - `report.model.js`: Created a polymorphic schema (`refPath: contentType`) to support reporting `Music`, `Album`, or `User` within a single collection. Added high-performance compound indexing.
  - `user.controller.js`: Implemented `reportContent` endpoint. Validates that the targeted content actually exists dynamically before saving the report. Rate-limits by rejecting identical pending reports.

### Changed
- **Music Controller Improvements:**
  - `getTrendingMusic`: Enforced a hard safety limit (`limit <= 50`) to protect against potential Denial of Service (DoS) by fetching massive datasets. Safely handled `NaN` limits.
  - `getTrendingMusic`: Fixed sort query to properly use the `likesCount` field instead of `likes`.
  - `incrementPlayCount`: Re-ordered execution logic to ensure 404 responses are returned immediately if an invalid `id` is provided, preventing crashes when checking associated albums.
- **Security & Authorization:**
  - `auth.middleware.js`: Updated `authenticateUser` to safely allow the `artist` role to access shared APIs.
  - `auth.middleware.js`: Added `authenticateAdmin` middleware to explicitly lock down all `/api/admin` routes.
  - `auth.controller.js`: Completely blocked `'admin'` registration on the public `/register` endpoint to prevent privilege escalation.
  - `music.controller.js`: Updated `.populate('artist')` across endpoints to restrict returned fields to `username profilePicture`, actively preventing password leaks to the frontend.
  - `music.controller.js`: Removed overly restrictive `.select()` in artist endpoints to ensure `uri` and `coverImage` are included for frontend playback.
- **Likes Feature Expansion:**
  - `like.controller.js` & `like.model.js`: Expanded the polymorphic association to support `'playlist'` as a valid `targetType`.
  - `like.route.js`: Added the `/liked-playlists` endpoint.
- **Playlist System Improvements:**
  - `playlist.controller.js`: Injected `match: { isActive: true }` into `.populate('songs')` to automatically filter out hidden/suspended music globally.

### Fixed
- **Like Controller Fixes:**
  - Fixed an issue where the database increment logic was executing *before* the `likeModel` creation, leading to corrupted counts on duplicate API calls.
  - Corrected field update query from `$inc: { likes: 1 }` to the proper schema name `$inc: { likesCount: 1 }`.
  - Added strict database existence checking (`.exists()`) to ensure the `music` or `album` actually exists in the DB before a `Like` relationship is created.
  - Added missing `musicModel` and `albumModel` imports.
- **Routing:**
  - Fixed a `TypeError: argument handler must be a function` crash in `like.route.js` caused by outdated controller function names.
  - Fixed a `[MONGOOSE] Warning: the 'new' option for findOneAndUpdate() is deprecated` warning by replacing it with `{ returnDocument: 'after' }` in `incrementPlayCount`.
- **Express 5 Routing Compatibility:**
  - Fixed a `PathError [TypeError]: Unexpected ?` crash in `music.route.js` caused by Express 5's upgraded `path-to-regexp`. Split optional parameter routes into strict dual definitions (e.g., `/trending` and `/trending/:limit`).
- **Data Validation & Crashes:**
  - Fixed an unhandled `TypeError: Cannot destructure property` crash in `user.controller.js` by defaulting `req.body` to an empty object for empty requests.
  - Handled `MulterError: Unexpected field` edge cases for profile updates.
- **Reporting System Fixes:**
  - Fixed an unimported `reportModel` reference error in `user.controller.js`.
  - Fixed an undefined `contentId` reference bug by properly destructuring and using `reportedContent`.
  - Adjusted the `reportSchema.index` to remove an overly restrictive `{ unique: true }` constraint that was crashing the admin `resolveReport` API on subsequent user reports.
  - Corrected Enum casing in `report.model.js` (`['Music', 'Album', 'User']`) to exactly match registered Mongoose models, fixing `refPath` population failures.
