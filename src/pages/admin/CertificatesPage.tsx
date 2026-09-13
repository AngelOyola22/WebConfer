import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { supabase } from '../../lib/supabase';
import type { Event, EventCertificate } from '../../types/database';
import AdminLayout from '../../components/layout/AdminLayout';
import { toast } from '../../store/toastStore';
import {
  CertElement, DEFAULT_ELEMENTS, FONTS,
  CANVAS_W, CANVAS_H, GOOGLE_FONTS_URL
} from '../../utils/certificateElements';
import './CertificatesPage.css';

const DEFAULT_CERT: Partial<EventCertificate> = {
  background_color: '#ffffff',
  primary_color: '#1e3a8a',
  secondary_color: '#eab308',
  elements: DEFAULT_ELEMENTS,
};

let _elemCounter = 0;
const newId = () => `el_${Date.now()}_${_elemCounter++}`;

// ── Sello Dorado SVG (reutilizable) ──────────────────────────────────────────
function GoldSeal({ id = 'A' }: { id?: string }) {
  return (
    <svg style={{ position: 'absolute', bottom: 38, left: '50%', transform: 'translateX(-55px)' }} width="110" height="110" viewBox="0 0 110 110">
      <defs>
        <radialGradient id={`gG${id}`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fef3c7"/>
          <stop offset="30%" stopColor="#fbbf24"/>
          <stop offset="70%" stopColor="#d97706"/>
          <stop offset="100%" stopColor="#92400e"/>
        </radialGradient>
        <radialGradient id={`gI${id}`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fef9c3"/>
          <stop offset="50%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#b45309"/>
        </radialGradient>
      </defs>
      <rect x="42" y="72" width="11" height="35" rx="2" fill="#d97706" transform="rotate(-15 47 85)"/>
      <rect x="57" y="72" width="11" height="35" rx="2" fill="#d97706" transform="rotate(15 63 85)"/>
      {Array.from({length: 16}).map((_, i) => (
        <rect key={i} x="53" y="5" width="4" height="50" rx="2" fill={`url(#gG${id})`} transform={`rotate(${i * 22.5} 55 55)`} opacity="0.85"/>
      ))}
      <circle cx="55" cy="52" r="32" fill={`url(#gG${id})`}/>
      <circle cx="55" cy="52" r="26" fill={`url(#gI${id})`} stroke="#fef3c7" strokeWidth="1.5"/>
      <circle cx="55" cy="52" r="20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <circle cx="55" cy="52" r="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75"/>
    </svg>
  );
}

// ── Ondas de fondo SVG ────────────────────────────────────────────────────────
function CertWaves() {
  return (
    <svg className="cert-layer cert-waves" viewBox="0 0 960 679" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,0 C0,0 280,0 200,180 C160,270 0,340 0,340 Z" fill="var(--cert-primary)" opacity="1"/>
      <path d="M0,0 C0,0 320,0 240,200 C200,300 0,400 0,400 Z" fill="var(--cert-primary)" opacity="0.22"/>
      <path d="M960,679 C960,679 680,679 760,499 C800,409 960,339 960,339 Z" fill="var(--cert-primary)" opacity="1"/>
      <path d="M960,679 C960,679 640,679 720,479 C760,379 960,279 960,279 Z" fill="var(--cert-primary)" opacity="0.22"/>
    </svg>
  );
}

export default function CertificatesPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [cert, setCert] = useState<Partial<EventCertificate>>(DEFAULT_CERT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [elements, setElements] = useState<CertElement[]>(DEFAULT_ELEMENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Undo/Redo history
  const history = useRef<CertElement[][]>([DEFAULT_ELEMENTS]);
  const historyIndex = useRef(0);
  const pushHistory = useCallback((els: CertElement[]) => {
    const slice = history.current.slice(0, historyIndex.current + 1);
    slice.push(els);
    history.current = slice.slice(-30); // max 30 steps
    historyIndex.current = history.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIndex.current > 0) {
      historyIndex.current--;
      setElements(history.current[historyIndex.current]);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndex.current < history.current.length - 1) {
      historyIndex.current++;
      setElements(history.current[historyIndex.current]);
    }
  }, []);

  const applyElements = useCallback((els: CertElement[]) => {
    pushHistory(els);
    setElements(els);
  }, [pushHistory]);

  const [scale, setScale] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const updateScale = useCallback(() => {
    if (!previewContainerRef.current) return;
    const containerW = previewContainerRef.current.clientWidth - 48;
    setScale(Math.min(containerW / CANVAS_W, 1));
  }, []);

  useEffect(() => {
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (previewContainerRef.current) ro.observe(previewContainerRef.current);
    return () => ro.disconnect();
  }, [updateScale]);

  // Keyboard shortcuts
  useEffect(() => {
    const STEP = 1;
    const STEP_FAST = 10;
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); return; }

      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (selectedId) {
        const step = e.shiftKey ? STEP_FAST : STEP;
        if (e.key === 'Delete' || e.key === 'Backspace') {
          deleteElement(selectedId);
          return;
        }
        const dirs: Record<string, [number, number]> = {
          ArrowLeft: [-step, 0], ArrowRight: [step, 0],
          ArrowUp: [0, -step], ArrowDown: [0, step],
        };
        if (dirs[e.key]) {
          e.preventDefault();
          const [dx, dy] = dirs[e.key];
          setElements(prev => prev.map(el => el.id === selectedId ? { ...el, x: el.x + dx, y: el.y + dy } : el));
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId, undo, redo]);

  const loadEvents = async () => {
    setLoading(true);
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (data) {
      setEvents(data);
      if (data.length > 0) setSelectedEventId(prev => prev || data[0].id);
    }
    setLoading(false);
  };

  useEffect(() => { loadEvents(); }, []);

  useEffect(() => {
    if (selectedEventId) loadCertificate(selectedEventId);
  }, [selectedEventId]);

  const loadCertificate = async (eventId: string) => {
    const { data } = await supabase.from('event_certificates').select('*').eq('event_id', eventId).maybeSingle();
    if (data) {
      setCert(data);
      const els = (data.elements && Array.isArray(data.elements) && data.elements.length > 0) ? data.elements : DEFAULT_ELEMENTS;
      history.current = [els];
      historyIndex.current = 0;
      setElements(els);
    } else {
      setCert({ ...DEFAULT_CERT, event_id: eventId });
      history.current = [DEFAULT_ELEMENTS];
      historyIndex.current = 0;
      setElements(DEFAULT_ELEMENTS);
    }
    setSelectedId(null);
  };

  const handleSave = async () => {
    if (!selectedEventId) return;
    setSaving(true);
    const { error } = await supabase.from('event_certificates').upsert({ ...cert, event_id: selectedEventId, elements });
    if (error) toast.error('Error al guardar el certificado');
    else toast.success('Certificado guardado con éxito');
    setSaving(false);
  };

  const handleChangeProp = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCert(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const updateEl = (id: string, updates: Partial<CertElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const commitDrag = (id: string, x: number, y: number) => {
    const next = elements.map(el => el.id === id ? { ...el, x, y } : el);
    applyElements(next);
  };

  const commitResize = (id: string, w: number, h: number, x: number, y: number) => {
    const next = elements.map(el => el.id === id ? { ...el, width: w, height: h, x, y } : el);
    applyElements(next);
  };

  const deleteElement = (id: string) => {
    const next = elements.filter(el => el.id !== id);
    applyElements(next);
    setSelectedId(null);
  };

  const duplicateElement = (id: string) => {
    const src = elements.find(el => el.id === id);
    if (!src) return;
    const clone: CertElement = { ...src, id: newId(), x: src.x + 20, y: src.y + 20 };
    const next = [...elements, clone];
    applyElements(next);
    setSelectedId(clone.id);
  };

  const addTextElement = () => {
    const el: CertElement = {
      id: newId(), type: 'text', text: 'Nuevo Texto',
      x: 300, y: 300, width: 360, height: 50,
      fontSize: 20, fontFamily: 'Arial, sans-serif',
      color: '#1e3a8a', fontWeight: 400,
      textAlign: 'center', fontStyle: 'normal', letterSpacing: 'normal',
      lineHeight: '1.3', visible: true,
    };
    const next = [...elements, el];
    applyElements(next);
    setSelectedId(el.id);
  };

  const moveLayerUp = (id: string) => {
    const idx = elements.findIndex(el => el.id === id);
    if (idx < elements.length - 1) {
      const next = [...elements];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      applyElements(next);
    }
  };

  const moveLayerDown = (id: string) => {
    const idx = elements.findIndex(el => el.id === id);
    if (idx > 0) {
      const next = [...elements];
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      applyElements(next);
    }
  };

  const selectedEl = elements.find(el => el.id === selectedId) ?? null;
  const certLink = selectedEventId
    ? `${window.location.origin}/certificado/${selectedEventId}?n=Nombre&a=Apellido`
    : '';

  return (
    <AdminLayout
      title="Editor de Certificados"
      subtitle="Drag & Drop · Tipografías · Capas · Deshacer/Rehacer"
      onRefresh={loadEvents}
      isRefreshing={loading}
    >
      {/* Google Fonts */}
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} />

      <div className="certificate-editor">
        {/* ── PANEL IZQUIERDO ── */}
        <div className="certificate-controls" onClick={() => setSelectedId(null)}>

          {/* Evento */}
          <div className="form-group" onClick={e => e.stopPropagation()}>
            <label className="form-label">Evento</label>
            <select className="form-input" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
              {events.length === 0 && <option value="">Sin eventos</option>}
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </div>

          <div className="divider" />

          {!selectedEl ? (
            /* ── Vista Global ── */
            <div onClick={e => e.stopPropagation()}>
              <p className="cert-section-label">🎨 Fondo</p>
              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">Color de Ondas</label>
                <div className="cert-color-row">
                  <input type="color" name="primary_color" value={cert.primary_color || '#1e3a8a'} onChange={handleChangeProp} className="cert-color-picker"/>
                  <input type="text" name="primary_color" value={cert.primary_color || ''} onChange={handleChangeProp} className="form-input"/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Color de Insignia</label>
                <div className="cert-color-row">
                  <input type="color" name="secondary_color" value={cert.secondary_color || '#eab308'} onChange={handleChangeProp} className="cert-color-picker"/>
                  <input type="text" name="secondary_color" value={cert.secondary_color || ''} onChange={handleChangeProp} className="form-input"/>
                </div>
              </div>

              <div className="divider" />
              <p className="cert-section-label">📋 Capas</p>
              <div className="layers-list">
                {[...elements].reverse().map(el => (
                  <div
                    key={el.id}
                    className={`layer-item ${selectedId === el.id ? 'layer-item--active' : ''}`}
                    onClick={e => { e.stopPropagation(); setSelectedId(el.id); }}
                  >
                    <span className="layer-eye" onClick={e => { e.stopPropagation(); updateEl(el.id, { visible: !(el.visible ?? true) }); }}>
                      {(el.visible ?? true) ? '👁' : '🙈'}
                    </span>
                    <span className="layer-name">{el.text.substring(0, 22) || '(vacío)'}</span>
                    <div className="layer-actions">
                      <button title="Subir" onClick={e => { e.stopPropagation(); moveLayerUp(el.id); }}>↑</button>
                      <button title="Bajar" onClick={e => { e.stopPropagation(); moveLayerDown(el.id); }}>↓</button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn cert-add-btn" onClick={e => { e.stopPropagation(); addTextElement(); }}>
                + Agregar Texto
              </button>

              <div style={{ marginTop: 8, padding: '12px', background: 'rgba(59,130,246,0.08)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#93c5fd', lineHeight: 1.6 }}>
                  💡 <strong>Atajos:</strong><br/>
                  <code>Ctrl+Z</code> Deshacer · <code>Ctrl+Y</code> Rehacer<br/>
                  <code>Delete</code> Eliminar elemento<br/>
                  <code>↑ ↓ ← →</code> Mover 1px (+ <code>Shift</code> = 10px)
                </p>
              </div>

              <button
                className="btn"
                style={{ marginTop: 6, fontSize: 12, color: 'var(--clr-danger, #ef4444)', borderColor: 'rgba(239,68,68,0.2)' }}
                onClick={e => { e.stopPropagation(); if (confirm('¿Restablecer diseño por defecto?')) { applyElements(DEFAULT_ELEMENTS); setSelectedId(null); }}}
              >
                🔄 Restablecer diseño
              </button>
            </div>
          ) : (
            /* ── Panel de elemento seleccionado ── */
            <div className="element-editor" onClick={e => e.stopPropagation()}>
              <div className="element-editor-header">
                <p className="cert-section-label" style={{ margin: 0 }}>✏️ Elemento</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button title="Duplicar" className="btn" style={{ padding: '4px 8px', fontSize: 13 }}
                    onClick={() => duplicateElement(selectedEl.id)}>⧉</button>
                  <button title="Eliminar" className="btn" style={{ padding: '4px 8px', fontSize: 13, color: '#ef4444' }}
                    onClick={() => deleteElement(selectedEl.id)}>🗑</button>
                  <button title="Cerrar" className="btn" style={{ padding: '4px 8px', fontSize: 13 }}
                    onClick={() => setSelectedId(null)}>✕</button>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 10 }}>
                <label className="form-label">Texto</label>
                <textarea
                  className="form-input"
                  value={selectedEl.text}
                  onChange={e => updateEl(selectedEl.id, { text: e.target.value })}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
                {selectedEl.id === 'participant_name' && <small style={{color:'#64748b',fontSize:11}}>Usa <code>{`{{nombre}}`}</code> para el nombre real.</small>}
                {selectedEl.id === 'description' && <small style={{color:'#64748b',fontSize:11}}>Usa <code>{`{{evento}}`}</code> para el nombre del evento.</small>}
              </div>

              <div className="form-group">
                <label className="form-label">Fuente</label>
                <select
                  className="form-input"
                  value={selectedEl.fontFamily}
                  onChange={e => updateEl(selectedEl.id, { fontFamily: e.target.value })}
                  style={{ fontFamily: selectedEl.fontFamily }}
                >
                  {FONTS.map(f => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Tamaño (px)</label>
                  <input type="number" className="form-input" value={selectedEl.fontSize}
                    onChange={e => updateEl(selectedEl.id, { fontSize: Number(e.target.value) })}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Grosor</label>
                  <select className="form-input" value={selectedEl.fontWeight} onChange={e => updateEl(selectedEl.id, { fontWeight: e.target.value })}>
                    <option value="300">Thin</option>
                    <option value="400">Normal</option>
                    <option value="600">SemiBold</option>
                    <option value="700">Bold</option>
                    <option value="900">Black</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Color</label>
                <div className="cert-color-row">
                  <input type="color" value={selectedEl.color === 'transparent' ? '#ffffff' : selectedEl.color}
                    onChange={e => updateEl(selectedEl.id, { color: e.target.value })} className="cert-color-picker"/>
                  <input type="text" value={selectedEl.color}
                    onChange={e => updateEl(selectedEl.id, { color: e.target.value })} className="form-input"/>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Alineación</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['left','center','right'] as const).map(align => (
                    <button key={align} className="btn"
                      style={{ flex: 1, padding: '6px', background: selectedEl.textAlign === align ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)', borderColor: selectedEl.textAlign === align ? '#3b82f6' : 'transparent', fontSize: 16 }}
                      onClick={() => updateEl(selectedEl.id, { textAlign: align })}>
                      {align === 'left' ? '⬅' : align === 'center' ? '↔' : '➡'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Espac. letras</label>
                  <input type="text" className="form-input" placeholder="0.1em" value={selectedEl.letterSpacing}
                    onChange={e => updateEl(selectedEl.id, { letterSpacing: e.target.value })}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Interlineado</label>
                  <input type="text" className="form-input" placeholder="1.4" value={selectedEl.lineHeight || '1.3'}
                    onChange={e => updateEl(selectedEl.id, { lineHeight: e.target.value })}/>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">X (px)</label>
                  <input type="number" className="form-input" value={selectedEl.x} onChange={e => updateEl(selectedEl.id, { x: Number(e.target.value) })}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Y (px)</label>
                  <input type="number" className="form-input" value={selectedEl.y} onChange={e => updateEl(selectedEl.id, { y: Number(e.target.value) })}/>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Estilos</label>
                <label className="cert-checkbox-label">
                  <input type="checkbox" checked={selectedEl.fontStyle === 'italic'}
                    onChange={e => updateEl(selectedEl.id, { fontStyle: e.target.checked ? 'italic' : 'normal' })}/>
                  Cursiva (Italic)
                </label>
              </div>
            </div>
          )}

          <div className="divider" />

          {/* Botones de acción globales */}
          <div onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button className="btn" onClick={undo} title="Ctrl+Z" style={{ flex: 1, fontSize: 13 }}>↩ Deshacer</button>
              <button className="btn" onClick={redo} title="Ctrl+Y" style={{ flex: 1, fontSize: 13 }}>↪ Rehacer</button>
            </div>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
              {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Guardando...</> : '💾 Guardar Diseño'}
            </button>
            {certLink && (
              <div className="cert-link-preview" style={{ marginTop: 10 }}>
                <p className="form-label" style={{ marginBottom: 6 }}>🔗 Enlace de prueba</p>
                <a href={certLink} target="_blank" rel="noreferrer" className="cert-link-anchor">Ver certificado ↗</a>
                <p style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 4 }}>Usa <code>{'{{link_certificado}}'}</code> en tus campañas</p>
              </div>
            )}
          </div>
        </div>

        {/* ── PREVISUALIZACIÓN ── */}
        <div className="certificate-preview-wrapper" onClick={() => setSelectedId(null)}>
          <div className="cert-preview-toolbar">
            <span className="cert-preview-label">
              Editor — A4 Horizontal ({Math.round(scale * 100)}%)
              {selectedEl && (
                <span style={{ marginLeft: 16, color: '#60a5fa' }}>
                  · X:{selectedEl.x}px  Y:{selectedEl.y}px  W:{selectedEl.width}px  H:{selectedEl.height}px
                </span>
              )}
            </span>
            <span style={{ fontSize: 11, color: '#475569' }}>
              {selectedEl ? `"${selectedEl.text.substring(0, 24) || '(vacío)'}..." seleccionado` : `${elements.length} elementos`}
            </span>
          </div>

          <div className="certificate-preview-container" ref={previewContainerRef}>
            <div
              className="cert-scale-wrapper"
              style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
            >
              <div
                className="certificate-canvas"
                style={{ '--cert-bg': cert.background_color, '--cert-primary': cert.primary_color, '--cert-secondary': cert.secondary_color } as React.CSSProperties}
              >
                {/* Fondo */}
                <div className="cert-layer cert-watermark">
                  <span className="cert-watermark-text">Certificado</span>
                </div>
                <CertWaves />
                <GoldSeal id="E" />

                {/* Elementos drag & drop */}
                {elements.map(el => {
                  if (!(el.visible ?? true)) return null;
                  const isSelected = selectedId === el.id;
                  return (
                    <Rnd
                      key={el.id}
                      size={{ width: el.width, height: el.height }}
                      position={{ x: el.x, y: el.y }}
                      onDragStop={(_, d) => commitDrag(el.id, d.x, d.y)}
                      onResizeStop={(_, _dir, ref, _delta, pos) => commitResize(el.id, ref.offsetWidth, ref.offsetHeight, pos.x, pos.y)}
                      bounds="parent"
                      onClick={(e: any) => { e.stopPropagation(); setSelectedId(el.id); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: isSelected ? '2px dashed #3b82f6' : '2px solid transparent',
                        cursor: 'move',
                        zIndex: isSelected ? 50 : 10,
                        padding: 4,
                        boxSizing: 'border-box',
                        boxShadow: isSelected ? '0 0 0 4000px rgba(59,130,246,0.03)' : 'none',
                      }}
                    >
                      <div style={{
                        width: '100%',
                        fontFamily: el.fontFamily,
                        fontSize: el.fontSize,
                        color: el.color,
                        fontWeight: el.fontWeight,
                        textAlign: el.textAlign,
                        fontStyle: el.fontStyle,
                        letterSpacing: el.letterSpacing,
                        borderBottom: el.borderBottom,
                        lineHeight: el.lineHeight || '1.2',
                        wordBreak: 'break-word',
                      }}>
                        {el.text}
                      </div>

                      {/* Handles visuales del elemento seleccionado */}
                      {isSelected && (
                        <>
                          <div className="rnd-handle rnd-handle-tl"/>
                          <div className="rnd-handle rnd-handle-tr"/>
                          <div className="rnd-handle rnd-handle-bl"/>
                          <div className="rnd-handle rnd-handle-br"/>
                        </>
                      )}
                    </Rnd>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
