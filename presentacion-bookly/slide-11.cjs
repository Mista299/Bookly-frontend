const {
  theme, addNotes, addFooter, addCard, addCircle, addTitle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addTitle(slide, pres, theme, 'La app se integra con el dispositivo, no solo se empaqueta', 'Capacidades nativas');

  addCard(slide, pres, theme, 0.6, 1.48, 3.0, 3.42, { fill: 'FFFFFF', shadow: false });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.38, y: 1.65, w: 1.44, h: 2.87, rectRadius: 0.18, fill: { color: theme.primary }, line: { color: theme.primary } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 1.48, y: 1.79, w: 1.24, h: 0.24, fill: { color: theme.light }, line: { color: theme.light } });
  slide.addText('BOOKLY', { x: 1.58, y: 2.17, w: 1.04, h: 0.2, margin: 0, fontFace: FONT_HEAD, fontSize: 12, bold: true, color: 'FFFFFF', align: 'center' });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.58, y: 2.52, w: 1.04, h: 0.62, rectRadius: 0.08, fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF' } });
  slide.addText('14:30', { x: 1.64, y: 2.68, w: 0.92, h: 0.22, margin: 0, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: theme.accent, align: 'center' });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.58, y: 3.33, w: 1.04, h: 0.4, rectRadius: 0.12, fill: { color: theme.accent }, line: { color: theme.accent } });
  slide.addText('Reservar', { x: 1.64, y: 3.46, w: 0.92, h: 0.12, margin: 0, fontFace: FONT_BODY, fontSize: 8, bold: true, color: 'FFFFFF', align: 'center' });
  slide.addText('←', { x: 1.48, y: 4.14, w: 0.3, h: 0.2, margin: 0, fontFace: FONT_BODY, fontSize: 15, bold: true, color: theme.light });
  slide.addText('Representación de la interfaz móvil', { x: 0.82, y: 4.62, w: 2.56, h: 0.15, margin: 0, fontFace: FONT_BODY, fontSize: 8.5, italic: true, color: theme.secondary, align: 'center' });

  const items = [
    { y: 1.55, title: 'Status bar', text: 'Identidad visual de marca', icon: 'S', color: theme.primary },
    { y: 2.22, title: 'Teclado nativo', text: 'Los inputs no quedan tapados', icon: 'T', color: theme.secondary },
    { y: 2.89, title: 'Botón atrás', text: 'Navega o sale en la raíz', icon: '←', color: theme.accent },
    { y: 3.56, title: 'Red', text: 'Aviso visible sin conexión', icon: 'W', color: '3F6B52' },
    { y: 4.23, title: 'Safe areas', text: 'Respeta muesca y gestos', icon: 'A', color: theme.primary }
  ];
  items.forEach((it) => {
    addCard(slide, pres, theme, 4.05, it.y, 5.28, 0.54, { fill: 'FFFFFF', shadow: false });
    addCircle(slide, pres, theme, 4.22, it.y + 0.09, 0.34, it.color, it.icon, 'FFFFFF', 10);
    slide.addText(it.title, { x: 4.73, y: it.y + 0.11, w: 1.55, h: 0.19, margin: 0, fontFace: FONT_BODY, fontSize: 11.2, bold: true, color: theme.primary });
    slide.addText(it.text, { x: 6.35, y: it.y + 0.12, w: 2.65, h: 0.18, margin: 0, fontFace: FONT_BODY, fontSize: 10.5, color: theme.secondary, fit: 'shrink' });
  });

  addFooter(slide, pres, theme, 'BOOKLY · Integración con el dispositivo', 11);
  addNotes(slide, 10);
  return slide;
}

module.exports = { createSlide };
