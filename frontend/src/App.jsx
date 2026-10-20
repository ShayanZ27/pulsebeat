import { useSelector } from 'react-redux';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import AudioEngine from './audio/AudioEngine';
import AppShell from './components/layout/AppShell';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/Home';
import PlaylistPage from './pages/PlaylistPage';
import AlbumPage from './pages/AlbumPage';
import ArtistPage from './pages/ArtistPage';
import LibraryPage from './pages/LibraryPage';
import DiscoverPage from './pages/DiscoverPage';
import ProfilePage from './pages/ProfilePage';
import { selectCurrentUser } from './store/authSlice';

/** Renders child routes for signed-in users; otherwise sends them to /login (remembering where they were). */
function RequireAuth() {
  const user = useSelector(selectCurrentUser);
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

export default function App() {
  return (
    <>
      <AudioEngine />
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
            <Route path="/album/:id" element={<AlbumPage />} />
            <Route path="/artist/:id" element={<ArtistPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/discover" element={<Navigate to="/discover/trending" replace />} />
            <Route path="/discover/genre-and-moods" element={<Navigate to="/discover/genres" replace />} />
            <Route path="/discover/genres-and-moods" element={<Navigate to="/discover/genres" replace />} />
            <Route path="/discover/:section" element={<DiscoverPage />} />
            <Route path="/search" element={<Navigate to="/discover/genres" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

