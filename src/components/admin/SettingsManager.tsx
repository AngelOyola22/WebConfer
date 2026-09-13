import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../../store/toastStore';

export const SettingsManager: React.FC = () => {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('global_settings')
        .select('sender_name, sender_email')
        .maybeSingle();
      if (data) {
        setSenderName(data.sender_name || '');
        setSenderEmail(data.sender_email || '');
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('global_settings')
        .select('id')
        .maybeSingle();

      const payload = { sender_name: senderName, sender_email: senderEmail, updated_at: new Date().toISOString() };

      if (existing) {
        const { error } = await supabase.from('global_settings').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('global_settings').insert([{ sender_name: senderName, sender_email: senderEmail }]);
        if (error) throw error;
      }
      toast.success('Configuración guardada exitosamente.');
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--clr-text-muted)', padding: 'var(--space-8)' }}>
      <div className="spinner" style={{ width: 20, height: 20 }} />
      Cargando configuración...
    </div>
  );

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Sender Settings Card */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>Correo del Remitente</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-muted)' }}>
            Configura el nombre y dirección de correo desde la cual salen todos los envíos masivos del sistema.
            El dominio debe estar verificado en tu cuenta de <strong style={{ color: 'var(--clr-text-secondary)' }}>Resend</strong>.
          </p>
        </div>

        <form onSubmit={saveSettings}>
          <div className="form-group">
            <label className="form-label">Nombre del Remitente</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="form-input"
              placeholder="Ej. Eventos WebConfer"
              required
            />
          </div>
          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label">Correo del Remitente</label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              className="form-input"
              placeholder="Ej. notificaciones@tudominio.com"
              required
            />
          </div>
          <div style={{ marginTop: 'var(--space-6)' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Guardando...</> : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="card" style={{ borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--clr-primary)' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Flujo de envío de correos
        </h3>
        <ol style={{ paddingLeft: 'var(--space-5)', color: 'var(--clr-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.8' }}>
          <li>Crea una campaña en la sección <strong>Campañas</strong>.</li>
          <li>Haz clic en <strong>"Encolar"</strong> para registrar los logs y pasar el estado a <em>queued</em>.</li>
          <li>La <strong>Edge Function</strong> <code style={{ background: 'rgba(255,255,255,0.08)', padding: '0 5px', borderRadius: 3 }}>send-email-queue</code> procesará el lote y enviará los correos mediante la API de Resend.</li>
          <li>Monitorea el estado individual de cada correo desde la sección <strong>Logs</strong> de la campaña.</li>
        </ol>
      </div>
    </div>
  );
};
