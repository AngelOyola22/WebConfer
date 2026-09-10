import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) {
      setError('Credenciales invalidas. Verifica tu correo y contrasena.');
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-grid" />
      <div className="login-card card animate-fade-in-up">
        <div className="login-logo">
          <span className="logo-icon">&#9878;</span>
          <span className="text-gradient">WebConfer</span>
        </div>
        <div className="login-card__header">
          <h1>Bienvenido de vuelta</h1>
          <p>Ingresa tus credenciales para acceder al panel</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">Correo Electronico</label>
            <input
              id="admin-email"
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@webconfer.com"
              required
            />
          </div>
          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label" htmlFor="admin-password">Contrasena</label>
            <input
              id="admin-password"
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              required
            />
          </div>
          <button
            id="admin-login-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 'var(--space-6)' }}
            disabled={loading}
          >
            {loading ? <><div className="spinner" /> Ingresando...</> : 'Ingresar al Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}