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
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    price: 0,
    meeting_url: '',
    status: 'draft' as EventStatus,
    speakers: [] as { name: string; role: string; initials: string }[],
    agenda: [] as { time: string; title: string; speaker: string }[],
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

  const openCreateModal = () => {
    setEditId(null);
    setFormData({ title: '', description: '', event_date: '', price: 0, meeting_url: '', status: 'draft', speakers: [], agenda: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (event: Event) => {
    setEditId(event.id);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : '',
      price: event.price,
      meeting_url: event.meeting_url || '',
      status: event.status,
      speakers: event.speakers || [],
      agenda: event.agenda || [],
    });
    setIsModalOpen(true);
  };

  const addSpeaker = () => setFormData(prev => ({ ...prev, speakers: [...prev.speakers, { name: '', role: '', initials: '' }] }));
  const removeSpeaker = (index: number) => setFormData(prev => ({ ...prev, speakers: prev.speakers.filter((_, i) => i !== index) }));
  const updateSpeaker = (index: number, field: string, value: string) => {
    const newSpeakers = [...formData.speakers];
    newSpeakers[index] = { ...newSpeakers[index], [field]: value };
    if (field === 'name' && !newSpeakers[index].initials) {
      newSpeakers[index].initials = value.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    }
    setFormData(prev => ({ ...prev, speakers: newSpeakers }));
  };

  const addAgendaItem = () => setFormData(prev => ({ ...prev, agenda: [...prev.agenda, { time: '', title: '', speaker: '' }] }));
  const removeAgendaItem = (index: number) => setFormData(prev => ({ ...prev, agenda: prev.agenda.filter((_, i) => i !== index) }));
  const updateAgendaItem = (index: number, field: string, value: string) => {
    const newAgenda = [...formData.agenda];
    newAgenda[index] = { ...newAgenda[index], [field]: value };
    setFormData(prev => ({ ...prev, agenda: newAgenda }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const dateToSave = formData.event_date ? new Date(formData.event_date).toISOString() : new Date().toISOString();
    
    const payload = {
      title: formData.title,
      description: formData.description,
      event_date: dateToSave,
      price: formData.price,
      meeting_url: formData.meeting_url || null,
      status: formData.status,
      speakers: formData.speakers,
      agenda: formData.agenda,
    };

    let error;
    if (editId) {
      const { error: updateError } = await supabase.from('events').update(payload).eq('id', editId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('events').insert(payload);
      error = insertError;
    }

    if (!error) {
      setIsModalOpen(false);
      setEditId(null);
      setFormData({ title: '', description: '', event_date: '', price: 0, meeting_url: '', status: 'draft', speakers: [], agenda: [] });
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
        <button onClick={openCreateModal} className="btn btn-primary btn-sm">
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
            <button onClick={openCreateModal} className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
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
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(event)}>Editar</button>
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-top">
              <h2>{editId ? 'Editar Evento' : 'Crear Nuevo Evento'}</h2>
              <button className="btn btn-secondary btn-icon" onClick={() => setIsModalOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} style={{ marginTop: 'var(--space-4)' }}>
              
              <h3 style={{ fontSize: 16, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>Información General</h3>
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
              <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
                <label className="form-label">Enlace de Reunión (Google Meet, Zoom, etc.)</label>
                <input type="url" placeholder="https://meet.google.com/..." className="form-input" value={formData.meeting_url} onChange={e => setFormData({ ...formData, meeting_url: e.target.value })} />
                <span style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>Opcional. Se enviará por correo automáticamente al aprobar inscripciones.</span>
              </div>

              <div style={{ marginTop: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
                  <h3 style={{ fontSize: 16, margin: 0 }}>Ponentes</h3>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addSpeaker}>+ Agregar Ponente</button>
                </div>
                {formData.speakers.length === 0 && <p style={{ fontSize: 13, color: 'var(--clr-text-muted)' }}>No hay ponentes registrados.</p>}
                {formData.speakers.map((speaker, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 60px 40px', gap: 12, marginBottom: 12, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8 }}>
                    <input placeholder="Nombre (ej. Dr. Carlos)" className="form-input" value={speaker.name} onChange={e => updateSpeaker(i, 'name', e.target.value)} required />
                    <input placeholder="Cargo / Rol" className="form-input" value={speaker.role} onChange={e => updateSpeaker(i, 'role', e.target.value)} required />
                    <input placeholder="Iniciales" className="form-input" value={speaker.initials} onChange={e => updateSpeaker(i, 'initials', e.target.value)} maxLength={2} required />
                    <button type="button" className="btn btn-danger btn-icon" onClick={() => removeSpeaker(i)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
                  <h3 style={{ fontSize: 16, margin: 0 }}>Programa (Agenda)</h3>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addAgendaItem}>+ Agregar Actividad</button>
                </div>
                {formData.agenda.length === 0 && <p style={{ fontSize: 13, color: 'var(--clr-text-muted)' }}>No hay actividades registradas.</p>}
                {formData.agenda.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 40px', gap: 12, marginBottom: 12, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8 }}>
                    <input type="time" className="form-input" value={item.time} onChange={e => updateAgendaItem(i, 'time', e.target.value)} required />
                    <input placeholder="Título de actividad" className="form-input" value={item.title} onChange={e => updateAgendaItem(i, 'title', e.target.value)} required />
                    <input placeholder="Ponente (opcional)" className="form-input" value={item.speaker} onChange={e => updateAgendaItem(i, 'speaker', e.target.value)} />
                    <button type="button" className="btn btn-danger btn-icon" onClick={() => removeAgendaItem(i)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="modal-actions" style={{ marginTop: 'var(--space-6)', position: 'sticky', bottom: 0, background: 'var(--clr-bg-card)', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : (editId ? 'Guardar Cambios' : 'Crear Evento')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
