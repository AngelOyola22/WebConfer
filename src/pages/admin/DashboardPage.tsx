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

  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  const loadRegistrations = async () => {
    setLoading(true);
    // Cargar eventos únicos para el filtro
    const { data: eventsData } = await supabase.from('events').select('id, title');
    if (eventsData) setEvents(eventsData);

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
    
    // 1. Actualizar estado en DB
    const { error } = await supabase.from('registrations').update({ status }).eq('id', id);
    
    if (!error) {
      // 2. Si es aprobado, enviar el correo automáticamente en segundo plano
      if (status === 'approved') {
        // Hacemos el fetch sin 'await' para no bloquear la interfaz
        supabase.functions.invoke('send-approval-email', {
          body: { registration_id: id }
        }).catch(err => console.error("Error al disparar correo de aprobación:", err));
      }

      // 3. Actualizar la lista en pantalla
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      
      // 4. Cerrar el modal automáticamente
      setSelectedReg(null);
    } else {
      console.error(error);
      alert('Hubo un error al actualizar el estado.');
    }
    
    setUpdating(null);
  };

  const filtered = registrations.filter(r => {
    const matchStatus = filter === 'all' || r.status === filter;
    const matchEvent = selectedEventId === 'all' || r.event_id === selectedEventId;
    const term = search.toLowerCase();
    const matchSearch = !term ||
      r.first_name.toLowerCase().includes(term) ||
      r.last_name.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term);
    return matchStatus && matchEvent && matchSearch;
  });

  const counts = {
    all: registrations.filter(r => selectedEventId === 'all' || r.event_id === selectedEventId).length,
    pending: registrations.filter(r => r.status === 'pending' && (selectedEventId === 'all' || r.event_id === selectedEventId)).length,
    approved: registrations.filter(r => r.status === 'approved' && (selectedEventId === 'all' || r.event_id === selectedEventId)).length,
    rejected: registrations.filter(r => r.status === 'rejected' && (selectedEventId === 'all' || r.event_id === selectedEventId)).length,
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
        <div className="table-toolbar" style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <select 
              className="form-input" 
              style={{ width: '220px', background: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
            >
              <option value="all" style={{ background: '#0f172a' }}>Todos los eventos</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id} style={{ background: '#0f172a' }}>{ev.title}</option>
              ))}
            </select>
          </div>

          <div className="search-input-wrap" style={{ flex: 1, margin: 0, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              id="search-registrations"
              type="search"
              className="form-input search-input"
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.2)' }}
            />
          </div>
          <span className="table-count" style={{ background: '#3b82f6', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
            {filtered.length}
          </span>
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
                  <th>Nombre</th><th>Evento</th><th>Correo</th><th>Teléfono</th><th>Edad</th><th>Estado</th><th>Fecha</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReg && (
        <div className="modal-backdrop" onClick={() => setSelectedReg(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 850, padding: 0, overflow: 'hidden' }}>
            
            {/* Header del Modal */}
            <div className="modal-top" style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <h2 style={{ margin: 0 }}>{selectedReg.first_name} {selectedReg.last_name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <span className={`badge badge-${selectedReg.status}`}>
                    {STATUS_LABELS[selectedReg.status as RegistrationStatus]}
                  </span>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>ID: {selectedReg.id.substring(0,8)}</span>
                </div>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setSelectedReg(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Split View */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 350 }}>
              
              {/* Lado Izquierdo: Información */}
              <div style={{ padding: 24, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 16 }}>Detalles del Participante</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div><span style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Evento</span><strong style={{ fontSize: 15, color: '#f1f5f9' }}>{(selectedReg as any).events?.title || 'General'}</strong></div>
                  <div><span style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Correo Electrónico</span><strong style={{ fontSize: 15, color: '#f1f5f9' }}>{selectedReg.email}</strong></div>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <div><span style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Teléfono</span><strong style={{ fontSize: 15, color: '#f1f5f9' }}>{selectedReg.phone}</strong></div>
                    <div><span style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Edad</span><strong style={{ fontSize: 15, color: '#f1f5f9' }}>{selectedReg.age} años</strong></div>
                  </div>
                  <div><span style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Fecha de Registro</span><strong style={{ fontSize: 14, color: '#cbd5e1' }}>{new Date(selectedReg.created_at).toLocaleString('es')}</strong></div>
                </div>
              </div>

              {/* Lado Derecho: Foto / Comprobante */}
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 16 }}>Comprobante de Pago</h3>
                <a href={selectedReg.payment_proof_url} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#000', position: 'relative', cursor: 'zoom-in' }} className="proof-hover">
                  <img src={selectedReg.payment_proof_url} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', color: 'white', fontWeight: 600 }} className="proof-overlay">Abrir completo ↗</div>
                </a>
              </div>
            </div>

            {/* Footer: Botones fijos */}
            <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                className="btn btn-danger" 
                disabled={updating === selectedReg.id || selectedReg.status === 'rejected'} 
                onClick={() => updateStatus(selectedReg.id, 'rejected')}
                style={{ padding: '10px 24px' }}
              >
                {updating === selectedReg.id ? <div className="spinner" /> : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg> Rechazar</>
                )}
              </button>
              
              <button 
                className="btn btn-success" 
                disabled={updating === selectedReg.id || selectedReg.status === 'approved'} 
                onClick={() => updateStatus(selectedReg.id, 'approved')}
                style={{ padding: '10px 24px' }}
              >
                {updating === selectedReg.id ? <div className="spinner" /> : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> {selectedReg.status === 'approved' ? 'Ya está Aprobado' : 'Aprobar Inscripción'}</>
                )}
              </button>
            </div>
            
            <style>{`
              .proof-hover:hover .proof-overlay { opacity: 1 !important; }
            `}</style>

          </div>
        </div>
      )}
    </AdminLayout>
  );
}