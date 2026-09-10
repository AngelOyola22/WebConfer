import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import type { Contact } from '../../types/database';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import './DashboardPage.css';

const schema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  source: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ContactsPage() {
  const { user, signOut } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setContacts(data as unknown as Contact[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('contacts') as any).insert(data);
    reset();
    setShowForm(false);
    load();
    setSaving(false);
  };

  const filtered = contacts.filter(c => {
    const t = search.toLowerCase();
    return !t ||
      c.first_name.toLowerCase().includes(t) ||
      c.last_name.toLowerCase().includes(t) ||
      c.email.toLowerCase().includes(t);
  });

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <span className="logo-icon">⚖️</span>
          <span className="text-gradient">WebConfer</span>
        </div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav__item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Inscripciones
          </Link>
          <Link to="/admin/eventos" className="admin-nav__item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Eventos
          </Link>
          <Link to="/admin/contactos" className="admin-nav__item admin-nav__item--active">
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
            <h1>Base de Contactos</h1>
            <p>Gestiona tu base de prospectos para difusion</p>
          </div>
          <button id="add-contact-btn" className="btn btn-primary" onClick={() => setShowForm(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Agregar Contacto
          </button>
        </header>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-toolbar">
            <div className="search-input-wrap">
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                id="search-contacts"
                type="search"
                className="form-input search-input"
                placeholder="Buscar contacto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="table-count">{filtered.length} contacto(s)</span>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="spinner" style={{ width: 36, height: 36 }} />
              <p>Cargando...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>Sin contactos</h3>
              <p>Agrega contactos para tu base de difusion.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Nombre</th><th>Correo</th><th>Telefono</th><th>Fuente</th><th>Fecha</th></tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="data-table__row">
                      <td className="data-table__name">{c.first_name} {c.last_name}</td>
                      <td className="data-table__secondary">{c.email}</td>
                      <td className="data-table__secondary">{c.phone || '-'}</td>
                      <td><span className="badge badge-info">{c.source || 'Manual'}</span></td>
                      <td className="data-table__muted">{new Date(c.created_at).toLocaleDateString('es')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h2>Nuevo Contacto</h2>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowForm(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Nombres <span>*</span></label>
                  <input id="contact-first-name" {...register('first_name')} className={`form-input ${errors.first_name ? 'error' : ''}`} />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos <span>*</span></label>
                  <input id="contact-last-name" {...register('last_name')} className={`form-input ${errors.last_name ? 'error' : ''}`} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">Correo <span>*</span></label>
                <input id="contact-email" type="email" {...register('email')} className={`form-input ${errors.email ? 'error' : ''}`} />
              </div>
              <div className="grid-2" style={{ gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Telefono</label>
                  <input id="contact-phone" {...register('phone')} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fuente</label>
                  <input id="contact-source" {...register('source')} className="form-input" placeholder="WhatsApp, Web..." />
                </div>
              </div>
              <button
                id="save-contact-btn"
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 'var(--space-6)' }}
                disabled={saving}
              >
                {saving ? <><div className="spinner" /> Guardando...</> : 'Guardar Contacto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}