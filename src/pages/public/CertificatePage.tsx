import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Event, EventCertificate } from '../../types/database';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CertElement, DEFAULT_ELEMENTS } from '../../utils/certificateElements';
import '../admin/CertificatesPage.css';

export default function CertificatePage() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const nombre = searchParams.get('n') || '';
  const apellido = searchParams.get('a') || '';
  const nombreCompleto = `${nombre} ${apellido}`.trim() || 'Participante';

  const [cert, setCert] = useState<EventCertificate | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!eventId) return;
      const [certRes, eventRes] = await Promise.all([
        supabase.from('event_certificates').select('*').eq('event_id', eventId).maybeSingle(),
        supabase.from('events').select('*').eq('id', eventId).single(),
      ]);
      if (certRes.data) setCert(certRes.data);
      if (eventRes.data) setEvent(eventRes.data);
      setLoading(false);
    }
    load();
  }, [eventId]);

  const handleDownload = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: cert?.background_color || '#ffffff',
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      pdf.save(`Certificado_${nombre}_${apellido}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Error generando el PDF. Por favor intenta con otro navegador.');
    }
    setDownloading(false);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!cert || !event) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ color: 'white' }}>Certificado no disponible</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Este certificado no ha sido configurado todavía.</p>
      </div>
    );
  }

  // Inject variables into text
  const processText = (text: string) => {
    return text.replace(/{{nombre}}/g, nombreCompleto).replace(/{{evento}}/g, event.title);
  };

  const elements: CertElement[] = cert.elements && Array.isArray(cert.elements) && cert.elements.length > 0 
    ? cert.elements 
    : DEFAULT_ELEMENTS;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>

      {/* Cabecera */}
      <div style={{ marginBottom: 32, textAlign: 'center', maxWidth: 600 }}>
        <h1 style={{ color: 'white', fontSize: 28, margin: '0 0 8px' }}>
          ¡Felicidades{nombre ? `, ${nombre}` : ''}!
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' }}>
          Aquí está tu certificado oficial. Descárgalo en formato PDF para imprimirlo o compartirlo.
        </p>
        <button
          className="btn btn-primary"
          onClick={handleDownload}
          disabled={downloading}
          style={{ padding: '12px 28px', fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 10 }}
        >
          {downloading ? (
            <><div className="spinner" style={{ width: 18, height: 18 }} /> Generando PDF...</>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Descargar Certificado PDF
            </>
          )}
        </button>
      </div>

      {/* Certificado escalado al ancho disponible */}
      <div style={{ width: '100%', maxWidth: 1000, overflowX: 'auto' }}>
        <div style={{
          width: 960,
          margin: '0 auto',
          transform: `scale(${Math.min(1, (typeof window !== 'undefined' ? Math.min(window.innerWidth - 48, 1000) : 960) / 960)})`,
          transformOrigin: 'top center',
        }}>
          
          {/* CANVAS ABSOLUTO */}
          <div
            ref={printRef}
            className="certificate-canvas"
            style={{
              '--cert-bg': cert.background_color,
              '--cert-primary': cert.primary_color,
              '--cert-secondary': cert.secondary_color,
            } as React.CSSProperties}
          >
            {/* FONDO (Marca de agua, Ondas, Sello) */}
            <div className="cert-layer cert-watermark">
              <span className="cert-watermark-text">Certificado</span>
            </div>
            
            <svg className="cert-layer cert-waves" viewBox="0 0 960 679" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,0 C0,0 280,0 200,180 C160,270 0,340 0,340 Z" fill="var(--cert-primary)" opacity="1"/>
              <path d="M0,0 C0,0 320,0 240,200 C200,300 0,400 0,400 Z" fill="var(--cert-primary)" opacity="0.22"/>
              <path d="M960,679 C960,679 680,679 760,499 C800,409 960,339 960,339 Z" fill="var(--cert-primary)" opacity="1"/>
              <path d="M960,679 C960,679 640,679 720,479 C760,379 960,279 960,279 Z" fill="var(--cert-primary)" opacity="0.22"/>
            </svg>

            <svg style={{ position: 'absolute', bottom: 40, left: 425 }} className="cert-seal" viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="goldGrad2" cx="40%" cy="35%" r="60%">
                  <stop offset="0%" stopColor="#fef3c7"/>
                  <stop offset="30%" stopColor="#fbbf24"/>
                  <stop offset="70%" stopColor="#d97706"/>
                  <stop offset="100%" stopColor="#92400e"/>
                </radialGradient>
                <radialGradient id="goldInner2" cx="40%" cy="35%" r="60%">
                  <stop offset="0%" stopColor="#fef9c3"/>
                  <stop offset="50%" stopColor="#f59e0b"/>
                  <stop offset="100%" stopColor="#b45309"/>
                </radialGradient>
              </defs>
              <rect x="42" y="72" width="11" height="35" rx="2" fill="#d97706" transform="rotate(-15 47 85)"/>
              <rect x="57" y="72" width="11" height="35" rx="2" fill="#d97706" transform="rotate(15 63 85)"/>
              {Array.from({length: 16}).map((_, i) => (
                <rect key={i} x="53" y="5" width="4" height="50" rx="2" fill="url(#goldGrad2)" transform={`rotate(${i * 22.5} 55 55)`} opacity="0.85"/>
              ))}
              <circle cx="55" cy="52" r="32" fill="url(#goldGrad2)"/>
              <circle cx="55" cy="52" r="26" fill="url(#goldInner2)" stroke="#fef3c7" strokeWidth="1.5"/>
              <circle cx="55" cy="52" r="20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
              <circle cx="55" cy="52" r="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75"/>
            </svg>

            {/* ELEMENTOS JSON */}
            {elements.map(el => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
                  padding: 4,
                  boxSizing: 'border-box'
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
                  lineHeight: 1.2
                }}>
                  {processText(el.text)}
                </div>
              </div>
            ))}

          </div>

        </div>
      </div>

    </div>
  );
}
