# Spotify Clone API Documentation

This document outlines the complete REST API for the Spotify Clone backend. All endpoints are prefixed with `/api`.
Base URL: `http://localhost:3000/api`

---

## 🔒 Authentication (`/api/auth`)

### 1. Register a User
- **Endpoint:** `POST /auth/register`
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `email` (string, required)
  - `password` (string, required)
  - `username` (string, required)
  - `bio` (string, optional)
  - `profilePicture` (file, optional)
- **Response:** `201 Created` - Sets `token` cookie.

### 2. Login
- **Endpoint:** `POST /auth/login`
- **Content-Type:** `application/json`
- **Body:** `{ "email": "user@test.com", "password": "password123" }`
- **Response:** `200 OK` - Sets `token` cookie. Returns user data.

### 3. Logout
- **Endpoint:** `POST /auth/logout`
- **Response:** `200 OK` - Clears `token` cookie.

---

## 👤 User Operations (`/api/user`)
*All endpoints require authentication.*

### 1. Update Profile
- **Endpoint:** `PUT /user/profile`
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `username` (string, optional)
  - `bio` (string, optional)
  - `profilePicture` (file, optional)
  - `deleteProfilePicture` (boolean, optional)
- **Response:** `200 OK` - Returns updated profile.

### 2. Request Artist Status
- **Endpoint:** `POST /user/request-artist`
- **Body (JSON):** `{ "statement": "I am a creator..." }`
- **Rate Limit:** 1 request per 24 hours.
- **Response:** `200 OK` - Creates a pending request for admins to review.

### 3. Report Content
- **Endpoint:** `POST /user/report`
- **Body (JSON):** 
  ```json
  {
    "reportedContent": "<ID>",
    "contentType": "Music" | "Album" | "User",
    "reason": "spam" | "abusive" | "inappropriate" | "copyright" | "other",
    "description": "Optional details..."
  }
  ```
- **Response:** `200 OK` - Validates content exists and submits report.

---

## 🎵 Music & Trending (`/api/music`)
*All endpoints require authentication.*

### 1. Play Song (Increments Play Count)
- **Endpoint:** `GET /music/play/:id`
- **Response:** `200 OK` - Returns song `uri` and increments plays for both song and its album.

### 2. Get Trending Music
- **Endpoint:** `GET /music/trending/:limit?` (e.g. `/trending/10`)
- **Response:** `200 OK` - Array of top songs sorted by `plays` and `likesCount`.

### 3. Get Trending Albums
- **Endpoint:** `GET /music/trending-albums/:limit?`
- **Response:** `200 OK` - Array of top albums.

### 4. Get Trending Artists
- **Endpoint:** `GET /music/trending-artists/:limit?`
- **Response:** `200 OK` - Array of top artists based on cumulative song plays.

### 5. Get Artist Portfolio
- **Endpoint:** `GET /music/artist/:artistId/music` (Gets songs)
- **Endpoint:** `GET /music/artist/:artistId/albums` (Gets albums)

---

## 💿 Albums (`/api/album`)

### 1. Get All Albums
- **Endpoint:** `GET /album/`
- **Response:** `200 OK` - Array of albums.

### 2. Get Album by ID
- **Endpoint:** `GET /album/:id`
- **Response:** `200 OK` - Deeply populated album details (including songs).

---

## 🎧 Playlists (`/api/playlist`)
*All endpoints require authentication.*

### 1. Create Playlist
- **Endpoint:** `POST /playlist/`
- **Body (JSON):** `{ "name": "My Mix", "description": "Chill vibes", "isPublic": true }`
- **Response:** `201 Created`

### 2. Get User's Playlists
- **Endpoint:** `GET /playlist/`
- **Response:** `200 OK` - Array of playlists owned by the logged-in user.

### 3. Get Playlist by ID
- **Endpoint:** `GET /playlist/:id`
- **Response:** `200 OK` - Fully populated playlist (includes song and artist details). Automatically hides suspended/hidden songs.

### 4. Update Playlist
- **Endpoint:** `PATCH /playlist/:id`
- **Content-Type:** `multipart/form-data`
- **Body:** `name`, `description`, `isPublic`, `coverImage` (file), `deleteCoverImage` (boolean).
- **Response:** `200 OK`

### 5. Manage Playlist Songs
- **Add Song:** `POST /playlist/:id/add` - Body: `{ "songId": "<ID>" }`
- **Remove Song:** `DELETE /playlist/:id/remove` - Body: `{ "songId": "<ID>" }`

---

## ❤️ Likes System (`/api/like`)
*All endpoints require authentication.*

### 1. Toggle Like
- **Add Like:** `POST /like/` 
- **Remove Like:** `DELETE /like/`
- **Body (JSON):** `{ "targetId": "<ID>", "targetType": "music" | "album" | "playlist" }`
- **Response:** `200 OK` - Automatically increments/decrements `likesCount` on the target document.

### 2. Fetch Liked Content
- **Endpoint:** `GET /like/liked-music`
- **Endpoint:** `GET /like/liked-albums`
- **Endpoint:** `GET /like/liked-playlists`
- **Response:** `200 OK` - Fully populated array of liked documents.

---

## 🔍 Search (`/api/search`)
*Requires authentication.*

### 1. Global Search
- **Endpoint:** `GET /search/?query=drake&type=all`
- **Params:** 
  - `query`: Text to search (regex matched).
  - `type`: `all` | `music` | `album` | `artist` | `playlist`
- **Response:** `200 OK` - Consolidated object containing matching results across collections.

---

## 🛡️ Admin Panel (`/api/admin`)
*All endpoints require Admin authentication (role === 'admin').*

### 1. Artist Request Management
- **Get Pending:** `GET /admin/artist-requests`
- **Approve:** `PUT /admin/approve-artist/:requestId`
- **Reject:** `PUT /admin/reject-artist/:requestId` - Body: `{ "reason": "Explanation..." }`

### 2. User Moderation
- **Suspend:** `PATCH /admin/suspend-user/:userId`
- **Unsuspend:** `PATCH /admin/unsuspend-user/:userId`

### 3. Content Moderation
- **Hide:** `PUT /admin/hide-content/:contentId?type=music` (or `type=album`)
- **Restore:** `PUT /admin/restore-content/:contentId?type=music` (or `type=album`)

### 4. User Reports
- **Fetch Reports:** `GET /admin/reports?status=open&type=all`
  - *Status:* `open`, `resolved`, `dismissed`
  - *Type:* `music`, `album`, `user`, `all`
- **Resolve/Dismiss Report:** `PUT /admin/resolve-report/:reportId`
  - **Body (JSON):** `{ "status": "resolved" | "dismissed", "comments": "Took down the song" }`
