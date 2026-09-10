import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Event } from '../../types/database';
import './LandingPage.css';

const features = [
  { icon: '⚖️', title: 'Expertos Juridicos', desc: 'Aprende de abogados con mas de 20 anos de experiencia en litigios y consultoria.' },
  { icon: '🎓', title: 'Certificado Oficial', desc: 'Recibe un certificado de participacion con validez academica y profesional.' },
  { icon: '🌐', title: '100% Online', desc: 'Accede desde cualquier dispositivo. Sin desplazamientos, a tu ritmo.' },
  { icon: '📁', title: 'Material Incluido', desc: 'Acceso a todos los materiales del seminario, grabaciones y recursos digitales.' },
];

const speakers = [
  { name: 'Dr. Carlos Mendoza', role: 'Litigante Civil · 25 anos de exp.', initials: 'CM' },
  { name: 'Dra. Ana Rios', role: 'Derecho Laboral · Ex-Jueza', initials: 'AR' },
  { name: 'Mg. Roberto Vega', role: 'Derecho Corporativo · Arbitro', initials: 'RV' },
];

const agenda = [
  { time: '09:00', title: 'Apertura e Introduccion al Marco Legal', speaker: 'Dr. Carlos Mendoza' },
  { time: '10:30', title: 'Nuevas Tendencias en el Derecho Laboral', speaker: 'Dra. Ana Rios' },
  { time: '12:00', title: 'Receso', speaker: '' },
  { time: '13:00', title: 'Derecho Corporativo y Compliance', speaker: 'Mg. Roberto Vega' },
  { time: '15:00', title: 'Panel de Preguntas y Respuestas', speaker: 'Todos los ponentes' },
  { time: '16:00', title: 'Clausura y Networking Virtual', speaker: '' },
];

export default function LandingPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (data) {
        setEvent(data as Event);
      }
      setLoading(false);
    }
    fetchEvent();
  }, [eventId]);

  const registerUrl = eventId ? `/registro/${eventId}` : '#';

  if (loading) {
    return (
      <div className='loading-overlay'>
        <div style={{ textAlign: 'center' }}>
          <div className='spinner' style={{ width: 40, height: 40, margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--clr-text-secondary)' }}>Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (!event && eventId) {
    return (
      <div className="landing">
        <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h2>Evento no encontrado</h2>
          <p>El evento al que intentas acceder no existe o ya no esta disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="container">
          <div className="landing-nav__inner">
            <div className="landing-nav__logo">
              <span className="logo-icon">⚖️</span>
              <span className="text-gradient">WebConfer</span>
            </div>
            <div className="landing-nav__links">
              <a href="#ponentes">Ponentes</a>
              <a href="#programa">Programa</a>
            </div>
            <div className="landing-nav__actions">
              <Link to={registerUrl} className="btn btn-primary btn-sm">Inscribirme</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero__bg-glow" />
        <div className="hero__grid" />
        <div className="hero__particles">
          {[...Array(15)].map((_, i) => (
            <div key={i} className={`particle particle-${i + 1}`} />
          ))}
        </div>
        <div className="container">
          <div className="hero__content">
            <div className="hero__badge animate-fade-in-up stagger-1">
              <span className="badge-dot" />
              {event ? new Date(event.event_date).toLocaleDateString() : 'Proximo Evento'}
            </div>
            <h1 className="hero__title animate-fade-in-up stagger-2">
              {event ? event.title : <>Seminario de <span className="text-gradient">Derecho Contemporaneo</span> y Practica Juridica</>}
            </h1>
            <p className="hero__desc animate-fade-in-up stagger-3">
              {event && event.description ? event.description : 'Un espacio de alto nivel para profesionales del derecho, estudiantes avanzados e instituciones. Actualiza tus conocimientos con los expertos mas reconocidos del ambito legal.'}
            </p>
            <div className="hero__cta animate-fade-in-up stagger-4">
              <Link to={registerUrl} className="btn btn-primary btn-lg hero__cta-main">
                Asegurar mi Lugar
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <a href="#programa" className="btn btn-secondary btn-lg">Ver Programa</a>
            </div>
            <div className="hero__stats animate-fade-in-up stagger-5">
              <div className="hero__stat"><strong>500+</strong><span>Participantes</span></div>
              <div className="hero__stat-divider" />
              <div className="hero__stat"><strong>3</strong><span>Ponentes</span></div>
              <div className="hero__stat-divider" />
              <div className="hero__stat"><strong>7h</strong><span>de Contenido</span></div>
              <div className="hero__stat-divider" />
              <div className="hero__stat"><strong>100%</strong><span>Online</span></div>
            </div>
          </div>
        </div>
        <div className="hero__scroll-hint">
          <div className="scroll-mouse"><div className="scroll-wheel" /></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Beneficios</div>
            <h2>Por que elegirnos</h2>
            <p>Una experiencia disenada para maximizar tu aprendizaje y networking</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className={`feature-card card card-hover animate-fade-in-up stagger-${i + 1}`}>
                <div className="feature-card__icon-wrap">
                  <span className="feature-card__icon">{f.icon}</span>
                </div>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ponentes" className="section section-alt">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Speakers</div>
            <h2>Nuestros Ponentes</h2>
            <p>Profesionales de trayectoria reconocida a nivel nacional e internacional</p>
          </div>
          <div className="grid-3">
            {speakers.map((s, i) => (
              <div key={i} className={`card card-hover speaker-card animate-fade-in-up stagger-${i + 1}`}>
                <div className="speaker-card__avatar">{s.initials}</div>
                <h3>{s.name}</h3>
                <p>{s.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="programa" className="section">
        <div className="container-md">
          <div className="section-header">
            <div className="section-tag">Agenda</div>
            <h2>Programa del Evento</h2>
            <p>Una jornada completa de aprendizaje y actualizacion profesional</p>
          </div>
          <div className="agenda">
            {agenda.map((item, i) => (
              <div key={i} className={`agenda-item ${!item.speaker ? 'agenda-item--break' : ''}`}>
                <div className="agenda-item__time">{item.time}</div>
                <div className="agenda-item__line">
                  <div className="agenda-item__dot" />
                </div>
                <div className="agenda-item__content">
                  <h4>{item.title}</h4>
                  {item.speaker && <p>{item.speaker}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="container-sm">
          <div className="cta-card">
            <div className="cta-card__orb cta-card__orb-1" />
            <div className="cta-card__orb cta-card__orb-2" />
            <div className="cta-card__content">
              <div className="section-tag">Inscripciones abiertas</div>
              <h2>Listo para inscribirte?</h2>
              <p>Las plazas son limitadas. Asegura tu lugar ahora y forma parte de esta experiencia unica de actualizacion juridica.</p>
              <div className="cta-card__info">
                <span>Cupos limitados</span>
                <span>&bull;</span>
                <span>Confirmacion por correo</span>
                <span>&bull;</span>
                <span>Acceso inmediato a Zoom</span>
              </div>
              <Link to={registerUrl} className="btn btn-primary btn-lg">
                Completar mi Inscripcion
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer__inner">
            <div className="landing-nav__logo">
              <span className="logo-icon">⚖️</span>
              <span className="text-gradient">WebConfer</span>
            </div>
            <p>2026 WebConfer. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}