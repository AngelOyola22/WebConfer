import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Registration, RegistrationStatus } from '../../types/database';
import AdminLayout from '../../components/layout/AdminLayout';
import './DashboardPage.css';

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

export default function DashboardPage() {
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
      .select('*, events(title)')
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
    <AdminLayout
      title="Inscripciones"
      subtitle="Gestiona y aprueba las solicitudes recibidas"
      onRefresh={loadRegistrations}
      isRefreshing={loading}
    >
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
                  <th>Nombre</th><th>Evento</th><th>Correo</th><th>Teléfono</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg: any) => (
                  <tr key={reg.id} className="data-table__row" onClick={() => setSelectedReg(reg)}>
                    <td className="data-table__name">{reg.first_name} {reg.last_name}</td>
                    <td className="data-table__secondary">{reg.events?.title || 'General'}</td>
                    <td className="data-table__secondary">{reg.email}</td>
                    <td className="data-table__secondary">{reg.phone}</td>
                    <td className="data-table__secondary">{reg.age}</td>
                    <td><span className={`badge badge-${reg.status}`}>{STATUS_LABELS[reg.status as RegistrationStatus]}</span></td>
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

      {selectedReg && (
        <div className="modal-backdrop" onClick={() => setSelectedReg(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <div>
                <h2>{selectedReg.first_name} {selectedReg.last_name}</h2>
                <span className={`badge badge-${selectedReg.status}`} style={{ marginTop: 'var(--space-2)' }}>
                  {STATUS_LABELS[selectedReg.status as RegistrationStatus]}
                </span>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setSelectedReg(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="modal-grid">
              <div className="modal-field"><span>Evento</span><strong>{(selectedReg as any).events?.title || 'General'}</strong></div>
              <div className="modal-field"><span>Correo</span><strong>{selectedReg.email}</strong></div>
              <div className="modal-field"><span>Teléfono</span><strong>{selectedReg.phone}</strong></div>
              <div className="modal-field"><span>Edad</span><strong>{selectedReg.age} años</strong></div>
              <div className="modal-field" style={{ gridColumn: '1 / -1' }}><span>Registrado</span><strong>{new Date(selectedReg.created_at).toLocaleString('es')}</strong></div>
            </div>
            <div className="divider" />
            <p className="modal-section-label">Comprobante de Pago</p>
            <a href={selectedReg.payment_proof_url} target="_blank" rel="noreferrer" className="proof-preview">
              <img src={selectedReg.payment_proof_url} alt="Comprobante" />
              <div className="proof-preview__overlay">Ver en tamaño completo</div>
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
    </AdminLayout>
  );
}