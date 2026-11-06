const {
  theme, addNotes, addFooter, addCard, addCircle, addTitle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addTitle(slide, pres, theme, 'Diseñar para el dedo, no para una pantalla grande', 'UX móvil');

  addCard(slide, pres, theme, 0.6, 1.5, 4.25, 3.35, { fill: 'FFFFFF', shadow: false });
  slide.addText('Antes: 7 destinos en 360 px', { x: 0.88, y: 1.78, w: 3.68, h: 0.28, margin: 0, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: theme.secondary, align: 'center' });
  const before = ['Resumen', 'Servicios', 'Profes.', 'Usuarios', 'Auditoría', 'Agenda', 'Ajustes'];
  before.forEach((t, i) => {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85 + i * 0.51, y: 2.28, w: 0.47, h: 0.42, rectRadius: 0.08, fill: { color: theme.light }, line: { color: theme.light } });
    slide.addText(t, { x: 0.86 + i * 0.51, y: 2.42, w: 0.45, h: 0.1, margin: 0, fontFace: FONT_BODY, fontSize: 5.6, color: theme.primary, align: 'center', fit: 'shrink' });
  });
  slide.addText('Ilegible y sin espacio para respirar', { x: 1.1, y: 3.0, w: 3.25, h: 0.24, margin: 0, fontFace: FONT_BODY, fontSize: 11.5, color: theme.secondary, align: 'center' });
  slide.addText('Después: 4 destinos + Más', { x: 0.88, y: 3.5, w: 3.68, h: 0.28, margin: 0, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: theme.accent, align: 'center' });
  ['Inicio', 'Agenda', 'Turnos', 'Más'].forEach((t, i) => {
    const x = 0.88 + i * 0.9;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 3.98, w: i === 3 ? 0.78 : 0.72, h: 0.48, rectRadius: 0.14, fill: { color: i === 3 ? theme.accent : theme.primary }, line: { color: i === 3 ? theme.accent : theme.primary } });
    slide.addText(t, { x: x + 0.04, y: 4.14, w: i === 3 ? 0.7 : 0.64, h: 0.12, margin: 0, fontFace: FONT_BODY, fontSize: 8.3, bold: true, color: 'FFFFFF', align: 'center' });
  });

  const standards = [
    { y: 1.55, n: '44 × 44', title: 'px', text: 'Tamaño mínimo de cada control táctil', color: theme.accent },
    { y: 2.48, n: 'AA', title: 'WCAG', text: 'Contraste verificado en textos y estados', color: '3F6B52' },
    { y: 3.41, n: '6', title: 'anchos', text: 'Desde 320 px hasta escritorio', color: theme.secondary }
  ];
  standards.forEach((s) => {
    addCard(slide, pres, theme, 5.25, s.y, 4.1, 0.75, { fill: 'FFFFFF', shadow: false });
    slide.addText(s.n, { x: 5.48, y: s.y + 0.15, w: 0.95, h: 0.32, margin: 0, fontFace: FONT_HEAD, fontSize: 20, bold: true, color: s.color, align: 'center', fit: 'shrink' });
    slide.addText(s.title, { x: 5.5, y: s.y + 0.48, w: 0.92, h: 0.12, margin: 0, fontFace: FONT_BODY, fontSize: 7.8, bold: true, color: theme.secondary, align: 'center' });
    slide.addText(s.text, { x: 6.7, y: s.y + 0.24, w: 2.35, h: 0.3, margin: 0, fontFace: FONT_BODY, fontSize: 11.3, color: theme.primary, fit: 'shrink' });
  });

  slide.addText('La meta era que se sintiera diseñada para el celular, no reducida desde el sitio.', {
    x: 1.1, y: 4.98, w: 7.8, h: 0.22, margin: 0,
    fontFace: FONT_BODY, fontSize: 11.8, color: theme.primary, align: 'center'
  });

  addFooter(slide, pres, theme, 'BOOKLY · Diseño móvil', 12);
  addNotes(slide, 11);
  return slide;
}

module.exports = { createSlide };
