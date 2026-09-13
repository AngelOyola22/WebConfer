import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Event, EventStatus } from '../../types/database';
import AdminLayout from '../../components/layout/AdminLayout';
import './DashboardPage.css';

const STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    price: 0,
    status: 'draft' as EventStatus,
  });

  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setEvents(data as Event[]);
    setLoading(false);
  };

  useEffect(() => { loadEvents(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const dateToSave = formData.event_date ? new Date(formData.event_date).toISOString() : new Date().toISOString();
    const { error } = await supabase.from('events').insert({
      title: formData.title,
      description: formData.description,
      event_date: dateToSave,
      price: formData.price,
      status: formData.status,
    });
    if (!error) {
      setIsModalOpen(false);
      setFormData({ title: '', description: '', event_date: '', price: 0, status: 'draft' });
      loadEvents();
    }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: EventStatus) => {
    const { error } = await supabase.from('events').update({ status }).eq('id', id);
    if (!error) {
      setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    }
  };

  return (
    <AdminLayout
      title="Eventos"
      subtitle="Administra los eventos y conferencias"
      onRefresh={loadEvents}
      isRefreshing={loading}
      actions={
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Evento
        </button>
      }
    >
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="table-loading">
            <div className="spinner" style={{ width: 36, height: 36 }} />
            <p>Cargando eventos...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>Sin eventos</h3>
            <p>No has creado ningún evento todavía.</p>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
              Crear mi primer evento
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Título</th><th>Fecha</th><th>Precio</th><th>Estado</th><th>Enlace Público</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} className="data-table__row">
                    <td className="data-table__name">{event.title}</td>
                    <td className="data-table__secondary">{new Date(event.event_date).toLocaleDateString('es')}</td>
                    <td className="data-table__secondary">${event.price}</td>
                    <td>
                      <span className={`badge badge-${event.status === 'published' ? 'approved' : event.status === 'draft' ? 'pending' : 'rejected'}`}>
                        {STATUS_LABELS[event.status]}
                      </span>
                    </td>
                    <td>
                      <a href={`/evento/${event.id}`} target="_blank" rel="noreferrer" style={{ color: 'var(--clr-primary)' }}>Ver Página</a>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        {event.status !== 'published' && (
                          <button className="btn btn-success btn-sm" onClick={() => updateStatus(event.id, 'published')}>Publicar</button>
                        )}
                        {event.status === 'published' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(event.id, 'draft')}>Ocultar</button>
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

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-top">
              <h2>Crear Nuevo Evento</h2>
              <button className="btn btn-secondary btn-icon" onClick={() => setIsModalOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} style={{ marginTop: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Título</label>
                <input required className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
                <label className="form-label">Descripción</label>
                <textarea className="form-input" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid-2" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Fecha del Evento</label>
                  <input type="date" required className="form-input" value={formData.event_date} onChange={e => setFormData({ ...formData, event_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio ($)</label>
                  <input type="number" min="0" required className="form-input" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
