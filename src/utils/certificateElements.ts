export interface CertElement {
  id: string;
  type: 'text';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string | number;
  textAlign: 'left' | 'center' | 'right';
  fontStyle: string;
  letterSpacing: string;
  lineHeight?: string;
  borderBottom?: string;
  visible?: boolean;
}

export const CANVAS_W = 960;
export const CANVAS_H = 679;

export const FONTS: { label: string; value: string }[] = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Palatino (Caligrafía)', value: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif' },
  { label: 'Cinzel (Clásica)', value: '"Cinzel", Georgia, serif' },
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { label: 'Lato', value: '"Lato", Arial, sans-serif' },
  { label: 'Montserrat', value: '"Montserrat", Arial, sans-serif' },
  { label: 'Courier New (Mono)', value: '"Courier New", Courier, monospace' },
  { label: 'Impact', value: 'Impact, fantasy' },
];

export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700&family=Montserrat:wght@400;600;700&display=swap';

export const DEFAULT_ELEMENTS: CertElement[] = [
  {
    id: 'title',
    type: 'text',
    text: 'CERTIFICADO',
    x: 0, y: 110, width: 960, height: 80,
    fontSize: 66, fontFamily: '"Cinzel", Georgia, serif',
    color: '#1e3a8a', fontWeight: 700,
    textAlign: 'center', fontStyle: 'normal', letterSpacing: '0.12em',
    visible: true,
  },
  {
    id: 'subtitle',
    type: 'text',
    text: 'DE RECONOCIMIENTO',
    x: 0, y: 190, width: 960, height: 40,
    fontSize: 18, fontFamily: '"Cinzel", Georgia, serif',
    color: '#1e3a8a', fontWeight: 400,
    textAlign: 'center', fontStyle: 'normal', letterSpacing: '0.3em',
    visible: true,
  },
  {
    id: 'granted_to',
    type: 'text',
    text: 'OTORGADO A:',
    x: 0, y: 263, width: 960, height: 30,
    fontSize: 12, fontFamily: 'Arial, sans-serif',
    color: '#6b7280', fontWeight: 400,
    textAlign: 'center', fontStyle: 'normal', letterSpacing: '0.2em',
    visible: true,
  },
  {
    id: 'participant_name',
    type: 'text',
    text: '{{nombre}}',
    x: 180, y: 302, width: 600, height: 78,
    fontSize: 60, fontFamily: '"Playfair Display", Georgia, serif',
    color: '#1e3a8a', fontWeight: 400,
    textAlign: 'center', fontStyle: 'italic', letterSpacing: 'normal',
    borderBottom: '1.5px solid #1e3a8a',
    lineHeight: '1.1',
    visible: true,
  },
  {
    id: 'description',
    type: 'text',
    text: 'Por haber completado satisfactoriamente su participación en el evento {{evento}}.',
    x: 200, y: 415, width: 560, height: 80,
    fontSize: 15, fontFamily: '"Lato", Arial, sans-serif',
    color: '#374151', fontWeight: 400,
    textAlign: 'center', fontStyle: 'normal', letterSpacing: 'normal',
    lineHeight: '1.7',
    visible: true,
  },
  {
    id: 'sig1_line',
    type: 'text',
    text: '',
    x: 130, y: 570, width: 200, height: 20,
    fontSize: 12, fontFamily: 'Arial',
    color: 'transparent', fontWeight: 400,
    textAlign: 'center', fontStyle: 'normal', letterSpacing: 'normal',
    borderBottom: '1px solid #374151',
    visible: true,
  },
  {
    id: 'sig1_name',
    type: 'text',
    text: 'MATEO LÓPEZ',
    x: 130, y: 595, width: 200, height: 22,
    fontSize: 12, fontFamily: 'Arial, sans-serif',
    color: '#1e3a8a', fontWeight: 700,
    textAlign: 'center', fontStyle: 'normal', letterSpacing: '0.1em',
    visible: true,
  },
  {
    id: 'sig1_title',
    type: 'text',
    text: 'Director',
    x: 130, y: 618, width: 200, height: 20,
    fontSize: 11, fontFamily: '"Lato", Arial, sans-serif',
    color: '#6b7280', fontWeight: 400,
    textAlign: 'center', fontStyle: 'normal', letterSpacing: 'normal',
    visible: true,
  },
  {
    id: 'sig2_line',
    type: 'text',
    text: '',
    x: 630, y: 570, width: 200, height: 20,
    fontSize: 12, fontFamily: 'Arial',
    color: 'transparent', fontWeight: 400,
    textAlign: 'center', fontStyle: 'normal', letterSpacing: 'normal',
    borderBottom: '1px solid #374151',
    visible: true,
  },
  {
    id: 'sig2_name',
    type: 'text',
    text: 'JULIANA SILVA',
    x: 630, y: 595, width: 200, height: 22,
    fontSize: 12, fontFamily: 'Arial, sans-serif',
    color: '#1e3a8a', fontWeight: 700,
    textAlign: 'center', fontStyle: 'normal', letterSpacing: '0.1em',
    visible: true,
  },
  {
    id: 'sig2_title',
    type: 'text',
    text: 'Coordinadora',
    x: 630, y: 618, width: 200, height: 20,
    fontSize: 11, fontFamily: '"Lato", Arial, sans-serif',
    color: '#6b7280', fontWeight: 400,
    textAlign: 'center', fontStyle: 'normal', letterSpacing: 'normal',
    visible: true,
  },
];
