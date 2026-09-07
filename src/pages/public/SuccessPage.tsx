import { Link } from 'react-router-dom';

export default function SuccessPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(16,185,129,0.15) 0%, transparent 70%)', zIndex: -1 }} />
      <div className="card animate-fade-in-up" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: 'var(--space-12)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-6)', fontSize: '2.5rem' }}>
          &#10003;
        </div>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)', color: '#6ee7b7' }}>Inscripcion enviada</h1>
        <p style={{ color: 'var(--clr-text-secondary)', marginBottom: 'var(--space-2)', lineHeight: 1.7 }}>
          Hemos recibido tu solicitud de inscripcion. Una vez que revisemos tu comprobante de pago, recibiras un correo con el enlace de acceso a Zoom.
        </p>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-8)' }}>
          El proceso de revision puede tomar hasta 24 horas habiles.
        </p>
        <Link to="/" className="btn btn-primary btn-lg">Volver al inicio</Link>
      </div>
    </div>
  );
}