import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import RegisterPage from './pages/public/RegisterPage';
import SuccessPage from './pages/public/SuccessPage';

// Admin Pages
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import EventsPage from './pages/admin/EventsPage';
import ContactsPage from './pages/admin/ContactsPage';

// Layout
import ProtectedRoute from './components/layout/ProtectedRoute';

function App() {
  const { initialize, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className='loading-overlay'>
        <div style={{ textAlign: 'center' }}>
          <div className='spinner' style={{ width: 40, height: 40, margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--clr-text-secondary)' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<LandingPage />} />
        <Route path='/evento/:eventId' element={<LandingPage />} />
        <Route path='/registro/:eventId' element={<RegisterPage />} />
        <Route path='/registro/exitoso' element={<SuccessPage />} />

        {/* Admin Auth */}
        <Route path='/admin/login' element={<LoginPage />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path='/admin' element={<DashboardPage />} />
          <Route path='/admin/eventos' element={<EventsPage />} />
          <Route path='/admin/contactos' element={<ContactsPage />} />
        </Route>

        {/* Fallback */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
