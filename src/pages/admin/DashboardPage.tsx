import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import type { Registration, RegistrationStatus } from '../../types/database';
import './DashboardPage.css';

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

export default function DashboardPage() {
  const { user, signOut } = useAuthStore();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RegistrationStatus | 'all'>('all');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setRegistrations(data as unknown as Registration[]);
    setLoading(false);
  };

  useEffect(() => { loadRegistrations(); }, []);

  const updateStatus = async (id: string, status: RegistrationStatus) => {
    setUpdating(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('registrations') as any).update({ status }).eq('id', id);
    if (!error) {
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      if (selectedReg?.id === id) setSelectedReg(prev => prev ? { ...prev, status } : null);
    }
    setUpdating(null);
  };

  const filtered = registrations.filter(r => {
    const matchStatus = filter === 'all' || r.status === filter;
    const term = search.toLowerCase();
    const matchSearch = !term ||
      r.first_name.toLowerCase().includes(term) ||
      r.last_name.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: registrations.length,
    pending: registrations.filter(r => r.status === 'pending').length,
    approved: registrations.filter(r => r.status === 'approved').length,
    rejected: registrations.filter(r => r.status === 'rejected').length,
  };

  const statFilters = ['all', 'pending', 'approved', 'rejected'] as const;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <span className="logo-icon">⚖️</span>
          <span className="text-gradient">WebConfer</span>
        </div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav__item admin-nav__item--active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Inscripciones
          </Link>
          <Link to="/admin/contactos" className="admin-nav__item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Contactos
          </Link>
        </nav>
        <div className="admin-sidebar__footer">
          <div className="admin-user">
            <div className="admin-user__avatar">{user?.email?.[0]?.toUpperCase()}</div>
            <div className="admin-user__info">
              <p className="admin-user__email">{user?.email}</p>
              <p className="admin-user__role">Administrador</p>
            </div>
          </div>
          <button onClick={signOut} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 'var(--space-3)' }}>
            Cerrar Sesion
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Inscripciones</h1>
            <p>Gestiona y aprueba las solicitudes recibidas</p>
          </div>
          <button onClick={loadRegistrations} className="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Actualizar
          </button>
        </header>

        <div className="stats-grid">
          {statFilters.map(s => {
            const isActive = filter === s;
            const label = s === 'all' ? 'Todos' : STATUS_LABELS[s];
            const badgeClass = s === 'all' ? 'badge badge-info' : `badge badge-${s}`;
            return (
              <button
                key={s}
                id={`filter-${s}`}
                className={isActive ? 'stat-card stat-card--active' : 'stat-card'}
                onClick={() => setFilter(s)}
              >
                <div className={`${badgeClass} stat-card__badge`}>{label}</div>
                <div className="stat-card__number">{counts[s]}</div>
              </button>
            );
          })}
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-toolbar">
            <div className="search-input-wrap">
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                id="search-registrations"
                type="search"
                className="form-input search-input"
                placeholder="Buscar por nombre o correo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="table-count">{filtered.length} resultado(s)</span>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="spinner" style={{ width: 36, height: 36 }} />
              <p>Cargando inscripciones...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Sin inscripciones</h3>
              <p>No hay registros que coincidan con el filtro.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th><th>Correo</th><th>Telefono</th><th>Edad</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(reg => (
                    <tr key={reg.id} className="data-table__row" onClick={() => setSelectedReg(reg)}>
                      <td className="data-table__name">{reg.first_name} {reg.last_name}</td>
                      <td className="data-table__secondary">{reg.email}</td>
                      <td className="data-table__secondary">{reg.phone}</td>
                      <td className="data-table__secondary">{reg.age}</td>
                      <td><span className={`badge badge-${reg.status}`}>{STATUS_LABELS[reg.status]}</span></td>
                      <td className="data-table__muted">{new Date(reg.created_at).toLocaleDateString('es')}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          {reg.status !== 'approved' && (
                            <button id={`approve-${reg.id}`} className="btn btn-success btn-sm" disabled={updating === reg.id} onClick={() => updateStatus(reg.id, 'approved')}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                            </button>
                          )}
                          {reg.status !== 'rejected' && (
                            <button id={`reject-${reg.id}`} className="btn btn-danger btn-sm" disabled={updating === reg.id} onClick={() => updateStatus(reg.id, 'rejected')}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {selectedReg && (
        <div className="modal-backdrop" onClick={() => setSelectedReg(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <div>
                <h2>{selectedReg.first_name} {selectedReg.last_name}</h2>
                <span className={`badge badge-${selectedReg.status}`} style={{ marginTop: 'var(--space-2)' }}>
                  {STATUS_LABELS[selectedReg.status]}
                </span>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setSelectedReg(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="modal-grid">
              <div className="modal-field"><span>Correo</span><strong>{selectedReg.email}</strong></div>
              <div className="modal-field"><span>Telefono</span><strong>{selectedReg.phone}</strong></div>
              <div className="modal-field"><span>Edad</span><strong>{selectedReg.age} anos</strong></div>
              <div className="modal-field"><span>Registrado</span><strong>{new Date(selectedReg.created_at).toLocaleString('es')}</strong></div>
            </div>
            <div className="divider" />
            <p className="modal-section-label">Comprobante de Pago</p>
            <a href={selectedReg.payment_proof_url} target="_blank" rel="noreferrer" className="proof-preview">
              <img src={selectedReg.payment_proof_url} alt="Comprobante" />
              <div className="proof-preview__overlay">Ver en tamano completo</div>
            </a>
            <div className="modal-actions">
              {selectedReg.status !== 'approved' && (
                <button className="btn btn-success" disabled={updating === selectedReg.id} onClick={() => updateStatus(selectedReg.id, 'approved')}>
                  {updating === selectedReg.id ? <div className="spinner" /> : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> Aprobar</>
                  )}
                </button>
              )}
              {selectedReg.status !== 'rejected' && (
                <button className="btn btn-danger" disabled={updating === selectedReg.id} onClick={() => updateStatus(selectedReg.id, 'rejected')}>
                  {updating === selectedReg.id ? <div className="spinner" /> : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg> Rechazar</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}