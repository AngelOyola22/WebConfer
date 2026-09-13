import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../../store/toastStore';
import AdminLayout from '../../components/layout/AdminLayout';
import './DashboardPage.css';
import './CampaignsPage.css';

interface Event { id: string; title: string; }
interface Campaign {
  id: string;
  subject: string;
  status: string;
  recipients_count: number;
  created_at: string;
  scheduled_for?: string;
  event_id: string;
  events?: { title: string };
}
interface EmailLog {
  id: string;
  recipient_email: string;
  status: string;
  error_message?: string;
  sent_at?: string;
}

const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  queued: 'En cola',
  sending: 'Enviando',
  completed: 'Completado',
  failed: 'Fallido',
};

const LOG_STATUS_CLASS: Record<string, string> = {
  queued: 'badge-pending',
  sent: 'badge-approved',
  delivered: 'badge-approved',
  bounced: 'badge-rejected',
  complained: 'badge-rejected',
  failed: 'badge-rejected',
};

const LOG_STATUS_LABELS: Record<string, string> = {
  queued: 'En Cola',
  sent: 'Enviado',
  delivered: 'Entregado',
  bounced: 'Rebotado',
  complained: 'Queja',
  failed: 'Fallido',
};

const DEFAULT_EMAIL_TEMPLATE = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600&auto=format&fit=crop" alt="Banner" style="width: 100%; border-radius: 8px; margin-bottom: 20px;">
  
  <h1 style="color: #1e293b; margin-top: 0;">¡Hola {{nombre}}! 👋</h1>
  
  <p style="font-size: 16px; line-height: 1.5; color: #475569;">
    Nos emociona invitarte a nuestro próximo evento. Prepárate para una sesión increíble donde hablaremos de tecnología e innovación.
  </p>

  <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> Jueves, 25 de Octubre</p>
    <p style="margin: 5px 0;"><strong>⏰ Hora:</strong> 18:00 (Hora Local)</p>
    <p style="margin: 5px 0;"><strong>📍 Lugar:</strong> Transmisión Online</p>
  </div>

  <div style="text-align: center; margin-top: 30px; display: flex; flex-direction: column; gap: 15px; align-items: center;">
    <a href="{{link_evento}}" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Ver Detalles del Evento</a>
    <a href="{{link_registro}}" style="color: #2563eb; font-weight: bold; text-decoration: underline;">Inscribirme directamente</a>
  </div>
  
  <p style="margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center;">
    Si no deseas recibir más notificaciones, puedes responder a este correo solicitando tu baja.
  </p>
</div>`;

export default function CampaignsPage() {
  const [tab, setTab] = useState<'list' | 'create' | 'logs'>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [queuingId, setQueuingId] = useState<string | null>(null);
  const [campaignToResend, setCampaignToResend] = useState<Campaign | null>(null);
  const [selectedErrorLog, setSelectedErrorLog] = useState<EmailLog | null>(null);

  const [form, setForm] = useState({
    event_id: '',
    subject: '',
    body_html: DEFAULT_EMAIL_TEMPLATE,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [campaignsRes, eventsRes] = await Promise.all([
      supabase
        .from('email_campaigns')
        .select('*, events(title)')
        .order('created_at', { ascending: false }),
      supabase
        .from('events')
        .select('id, title')
        .order('title'),
    ]);
    if (campaignsRes.data) setCampaigns(campaignsRes.data as any);
    if (eventsRes.data) setEvents(eventsRes.data as Event[]);
    setLoading(false);
  };

  const saveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.event_id || !form.subject || !form.body_html) return;
    setSaving(true);
    const { error } = await supabase.from('email_campaigns').insert({
      event_id: form.event_id,
      subject: form.subject,
      body_html: form.body_html,
      status: 'draft',
    });
    if (!error) {
      setForm({ event_id: '', subject: '', body_html: DEFAULT_EMAIL_TEMPLATE });
      setTab('list');
      await loadData();
    }
    setSaving(false);
  };

  const enqueueCampaign = async (campaign: Campaign) => {
    setQueuingId(campaign.id);
    
    // 1. Obtener la Base de Contactos global (los importados de Excel/manualmente)
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, email');

    if (!contacts || contacts.length === 0) {
      toast.warning('La Base de Contactos está vacía. Añade o importa contactos primero.');
      setQueuingId(null);
      return;
    }

    // 2. Crear los logs de envío encolados para cada contacto
    const logsToInsert = contacts.map((c: any) => ({
      campaign_id: campaign.id,
      recipient_email: c.email,
      status: 'queued',
    }));
    await supabase.from('email_logs').insert(logsToInsert);

    // 3. Reemplazar variables de links dinámicos con el dominio actual
    const origin = window.location.origin;
    const finalHtml = campaign.body_html
      .replace(/\{\{link_evento\}\}/g, `${origin}/evento/${campaign.event_id}`)
      .replace(/\{\{link_registro\}\}/g, `${origin}/registro/${campaign.event_id}`);

    // 4. Actualizar estado a 'queued' y guardar el HTML procesado
    await supabase.from('email_campaigns').update({
      status: 'queued',
      recipients_count: contacts.length,
      body_html: finalHtml
    }).eq('id', campaign.id);

    // 5. Disparar la Edge Function para que procese la cola inmediatamente
    try {
      await supabase.functions.invoke('send-email-queue');
    } catch (e) {
      console.error("Error al invocar la función:", e);
    }

    await loadData();
    setQueuingId(null);
    setCampaignToResend(null);
    toast.success(`✅ ${contacts.length} correos encolados. La función de envío ha sido iniciada.`);
  };

  const openLogs = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setLogsLoading(true);
    setTab('logs');
    const { data } = await supabase
      .from('email_logs')
      .select('*')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false });
    setLogs((data as EmailLog[]) || []);
    setLogsLoading(false);
  };

  const statusBadge = (status: string) => {
    const cls = status === 'completed' ? 'badge-approved'
      : status === 'queued' || status === 'sending' ? 'badge-pending'
      : status === 'failed' ? 'badge-rejected'
      : 'badge-info';
    return <span className={`badge ${cls}`}>{CAMPAIGN_STATUS_LABELS[status] || status}</span>;
  };

  return (
    <AdminLayout
      title="Campañas de Correo"
      subtitle="Crea, envía y monitorea tus campañas de email masivo"
      onRefresh={async () => {
        if (tab === 'logs' && selectedCampaign) {
          await openLogs(selectedCampaign);
        } else {
          await loadData();
        }
      }}
      isRefreshing={loading || logsLoading}
      actions={
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {tab === 'logs' && (
            <button className="btn btn-secondary btn-sm" onClick={() => setTab('list')}>
              ← Volver a campañas
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setTab('create')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva Campaña
          </button>
        </div>
      }
    >
      {/* ── LIST ── */}
      {tab === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="table-loading">
              <div className="spinner" style={{ width: 36, height: 36 }} />
              <p>Cargando campañas...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📧</div>
              <h3>Sin campañas</h3>
              <p>Crea tu primera campaña de correo.</p>
              <button onClick={() => setTab('create')} className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
                Crear campaña
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asunto</th>
                    <th>Evento</th>
                    <th>Estado</th>
                    <th>Destinatarios</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => (
                    <tr key={c.id} className="data-table__row">
                      <td className="data-table__name">{c.subject}</td>
                      <td className="data-table__secondary">{(c as any).events?.title || '-'}</td>
                      <td>{statusBadge(c.status)}</td>
                      <td className="data-table__secondary">{c.recipients_count || 0}</td>
                      <td className="data-table__muted">{new Date(c.created_at).toLocaleDateString('es')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          {c.status === 'draft' ? (
                            <button
                              className="btn btn-success btn-sm"
                              disabled={queuingId === c.id}
                              onClick={() => enqueueCampaign(c)}
                              title="Encolar todos los correos a la base de contactos"
                            >
                              {queuingId === c.id ? <div className="spinner" style={{ width: 12, height: 12 }} /> : (
                                <>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
                                  Encolar
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={queuingId === c.id}
                              onClick={() => setCampaignToResend(c)}
                              title="Reenviar a todos"
                            >
                              {queuingId === c.id ? <div className="spinner" style={{ width: 12, height: 12 }} /> : (
                                <>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#f59e0b' }}><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
                                  Reenviar
                                </>
                              )}
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openLogs(c)}
                            title="Ver logs de envío"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            Logs
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE ── */}
      {tab === 'create' && (
        <div className="campaign-create-grid">
          <div className="card">
            <h2 style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-xl)' }}>Nueva Campaña</h2>
            <form onSubmit={saveCampaign}>
              <div className="form-group">
                <label className="form-label">Evento *</label>
                <select
                  className="form-input"
                  value={form.event_id}
                  onChange={e => setForm({ ...form, event_id: e.target.value })}
                  required
                >
                  <option value="">Selecciona un evento...</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">Asunto del correo *</label>
                <input
                  className="form-input"
                  placeholder="Ej: ¡No te pierdas nuestro próximo evento!"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">Cuerpo del correo (HTML) *</label>
                <textarea
                  className="form-input campaign-html-editor"
                  placeholder={`<h1>¡Hola {{nombre}}!</h1>\n<p>Te invitamos a nuestro próximo evento...</p>`}
                  value={form.body_html}
                  onChange={e => setForm({ ...form, body_html: e.target.value })}
                  rows={14}
                  required
                />
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-muted)', marginTop: 'var(--space-2)' }}>
                  Usa <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 3 }}>{`{{nombre}}`}</code> y <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 3 }}>{`{{apellido}}`}</code> para personalizar cada correo automáticamente.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTab('list')}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Borrador'}
                </button>
              </div>
            </form>
          </div>

          <div className="campaign-preview-panel card">
            <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)', color: 'var(--clr-text-secondary)' }}>
              Vista previa del HTML
            </h3>
            {form.body_html ? (
              <div
                className="campaign-html-preview"
                dangerouslySetInnerHTML={{ __html: form.body_html.replace(/\{\{nombre\}\}/g, 'Juan').replace(/\{\{apellido\}\}/g, 'Pérez') }}
              />
            ) : (
              <div style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-8)' }}>
                Escribe el HTML para ver la vista previa aquí...
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LOGS ── */}
      {tab === 'logs' && selectedCampaign && (
        <>
          <div className="campaign-log-header card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Campaña</p>
                <p style={{ fontWeight: 600, marginTop: 2 }}>{selectedCampaign.subject}</p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
                {['queued','sent','failed'].map(s => {
                  const count = logs.filter(l => l.status === s || (s === 'sent' && ['sent','delivered'].includes(l.status))).length;
                  const title = s === 'sent' ? 'Enviados' : s === 'failed' ? 'Fallidos' : 'En cola';
                  const color = s === 'sent' ? '#10b981' : s === 'failed' ? '#ef4444' : '#f59e0b';
                  return (
                    <div key={s} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{title}</div>
                      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {logsLoading ? (
              <div className="table-loading">
                <div className="spinner" style={{ width: 36, height: 36 }} />
                <p>Cargando logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>Sin registros aún</h3>
                <p>Esta campaña no ha sido encolada todavía.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Destinatario</th>
                      <th>Estado</th>
                      <th>Enviado</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="data-table__row">
                        <td className="data-table__name">{log.recipient_email}</td>
                        <td>
                          <span className={`badge ${LOG_STATUS_CLASS[log.status] || 'badge-info'}`}>
                            {LOG_STATUS_LABELS[log.status] || log.status}
                          </span>
                        </td>
                        <td className="data-table__muted">
                          {log.sent_at ? new Date(log.sent_at).toLocaleString('es') : '-'}
                        </td>
                        <td className="data-table__muted">
                          {log.error_message ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ 
                                display: 'inline-block', 
                                maxWidth: 150, 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                color: 'var(--clr-danger)'
                              }}>
                                {log.error_message}
                              </span>
                              <button 
                                className="btn btn-secondary btn-sm btn-icon"
                                onClick={() => setSelectedErrorLog(log)}
                                title="Ver error completo"
                                style={{ width: 24, height: 24, padding: 0 }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              </button>
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MODAL REENVIAR ── */}
      {campaignToResend && (
        <div className="modal-backdrop" onClick={() => setCampaignToResend(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-top">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f59e0b' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Atención
              </h2>
              <button className="btn btn-secondary btn-icon" onClick={() => setCampaignToResend(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
              <p style={{ color: 'var(--clr-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
                ¿Estás seguro de que deseas reenviar la campaña <strong>"{campaignToResend.subject}"</strong>? 
                Esto enviará un nuevo correo a <strong>toda tu Base de Contactos</strong> y generará registros duplicados para esta campaña.
              </p>
              
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setCampaignToResend(null)}>
                  Cancelar
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => enqueueCampaign(campaignToResend)}
                  disabled={queuingId === campaignToResend.id}
                  style={{ background: '#f59e0b', color: '#1e293b', border: 'none' }}
                >
                  {queuingId === campaignToResend.id ? 'Reenviando...' : 'Sí, Reenviar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETALLE DE ERROR ── */}
      {selectedErrorLog && (
        <div className="modal-backdrop" onClick={() => setSelectedErrorLog(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-top">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--clr-danger)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                Detalle del Error
              </h2>
              <button className="btn btn-secondary btn-icon" onClick={() => setSelectedErrorLog(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <span style={{ fontSize: '12px', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Destinatario:</span>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{selectedErrorLog.recipient_email}</div>
              </div>
              
              <div style={{ background: '#111827', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                <pre style={{ margin: 0, color: '#f87171', fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedErrorLog.error_message || ''), null, 2);
                    } catch (e) {
                      return selectedErrorLog.error_message;
                    }
                  })()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
