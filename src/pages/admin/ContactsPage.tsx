import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { Contact } from '../../types/database';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { toast } from '../../store/toastStore';
import AdminLayout from '../../components/layout/AdminLayout';
import './DashboardPage.css';

const schema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  source: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const { error } = await (supabase.from('contacts') as any).insert(data);
    if (!error) {
      toast.success('Contacto guardado exitosamente.');
      reset();
      setShowForm(false);
      load();
    } else {
      toast.error('Error al guardar el contacto.');
    }
    setSaving(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        if (typeof bstr !== 'string') return;

        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const parsedContacts = data.map((row: any) => ({
          email: row.email || row.Email || row.correo || row.Correo || '',
          first_name: row.first_name || row.nombre || row.Nombre || null,
          last_name: row.last_name || row.apellido || row.Apellido || null,
          source: 'excel_import'
        })).filter(c => c.email); // Only keep rows with email

        if (parsedContacts.length === 0) {
          toast.warning('No se encontraron correos en el archivo.');
          setLoading(false);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('contacts') as any).insert(parsedContacts);
        
        if (error) {
          toast.error('Error al importar contactos.');
          console.error(error);
        } else {
          toast.success(`✅ ${parsedContacts.length} contactos importados exitosamente.`);
          load();
        }
      } catch (error) {
        toast.error('Error al procesar el archivo Excel.');
        console.error(error);
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const filtered = contacts.filter(c => {
    const t = search.toLowerCase();
    return !t ||
      c.first_name.toLowerCase().includes(t) ||
      c.last_name.toLowerCase().includes(t) ||
      c.email.toLowerCase().includes(t);
  });

  return (
    <AdminLayout
      title="Base de Contactos"
      subtitle="Gestiona tu base de prospectos para difusión"
      onRefresh={load}
      isRefreshing={loading}
      actions={
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Importar Excel
          </button>
          <button id="add-contact-btn" className="btn btn-primary" onClick={() => setShowForm(true)} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Agregar Contacto
          </button>
        </div>
      }
    >
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
            <p>Agrega contactos para tu base de difusión.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Fuente</th><th>Fecha</th></tr>
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
                  <label className="form-label">Nombres</label>
                  <input id="contact-first-name" {...register('first_name')} className={`form-input ${errors.first_name ? 'error' : ''}`} />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos</label>
                  <input id="contact-last-name" {...register('last_name')} className={`form-input ${errors.last_name ? 'error' : ''}`} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">Correo <span>*</span></label>
                <input id="contact-email" type="email" {...register('email')} className={`form-input ${errors.email ? 'error' : ''}`} />
              </div>
              <div className="grid-2" style={{ gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
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
    </AdminLayout>
  );
}