# 🎵 PulseBeat

PulseBeat is a premium, feature-rich music streaming application designed as a highly polished Spotify clone. Built entirely on the MERN stack (MongoDB, Express, React, Node.js), it focuses on delivering a dynamic, high-performance, and visually stunning user experience while maintaining a robust and scalable backend architecture.

## ✨ Key Features

### 🎧 Frontend (The Experience)
- **Premium UI/UX:** A state-of-the-art interface featuring smooth glassmorphism, dynamic micro-animations, and curated color palettes designed for maximum user engagement.
- **Dynamic Hero Section:** A beautiful slideshow featuring the latest releases (both music and albums) sorted by upload date.
- **Intelligent Playback State:** A persistent **Queue system** built on `localStorage` that seamlessly remembers your current song, shuffle state, repeat mode, and playback progress even across browser restarts.
- **Activity Feed & Community:** Real-time visibility into friend activities (likes, uploads, playlist additions).
- **Personal & Community Playlists:** Create personal playlists, or explore top trending community playlists from other users worldwide.

### ⚙️ Backend (The Engine)
- **Role-Based Access Control:** Secure authentication (JWT + bcrypt) supporting three distinct roles: `User`, `Artist`, and `Admin`.
- **Advanced Content Delivery:** Deep integration with **ImageKit**. Audio files and cover images are securely streamed, with on-the-fly image compression using `sharp` to ensure fast load times.
- **Robust Data Models:**
  - **Polymorphic Likes:** A scalable like system allowing users to like Music, Albums, or Playlists using a single, highly indexed collection.
  - **Deque Data Structures:** The `RecentlyPlayed` and `Activity` feeds utilize smart Mongoose `post-save` hooks to act as strict deques (e.g., automatically capping at 100 records and deleting the oldest entries to optimize storage).
- **Comprehensive API:** Secure endpoints for searching/filtering (by strictly enforced `genre` and `mood` enums), tracking play counts, fetching latest releases, and more.
- **Content Moderation System:** Admins have access to a full reporting dashboard to suspend users, hide inappropriate content, and manage artist verification requests.

## 🌱 Database Seeding Architecture

PulseBeat includes a powerful, automated seeding environment located in `backend/seeding/` designed to populate the database with high-quality test data seamlessly.

1. **Admin Seeding (`seed-admin.js`):** Easily inject a securely hashed SuperAdmin into the cluster bypassing standard registration logic.
2. **Artist Seeding (`seed-artists.js`):** Automatically maps artist credentials from Markdown, parses local profile pictures, heavily compresses them (800x800 JPEG), and uploads them directly to ImageKit.
3. **Music Seeding (`seed-music.js`):** A highly intelligent script that:
   - Scans local directories for `.mp3`/`.wav` and cover images.
   - Uses a `slugify` algorithm to fuzzy-match filenames to database song titles.
   - Extracts exact audio durations using `music-metadata`.
   - Uploads assets to ImageKit and seeds MongoDB with complete metadata (genres, moods, durations).

## 🚀 Getting Started

### Prerequisites
- Node.js
- MongoDB cluster (local or Atlas)
- ImageKit Account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ShayanZ27/pulsebeat.git
   cd pulsebeat
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Configure your .env file with MONGO_DB_URI, JWT_SECRET, and IMAGEKIT keys
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---
*Built with ❤️ by the PulseBeat Team.*
