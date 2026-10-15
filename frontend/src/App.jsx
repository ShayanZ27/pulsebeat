import { useSelector } from 'react-redux';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import AudioEngine from './audio/AudioEngine';
import AppShell from './components/layout/AppShell';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/Home';
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
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
