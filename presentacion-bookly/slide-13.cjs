const {
  theme, addNotes, addFooter, addCard, addCircle, addTitle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addTitle(slide, pres, theme, 'La calidad se comprueba con 394 casos E2E', 'Automatización');

  const groups = [
    { x: 0.6, value: 48, label: 'Funcionales', text: 'Flujos reales por rol y reserva completa', color: theme.primary },
    { x: 3.72, value: 144, label: 'Responsive', text: '24 rutas × 6 tamaños reales de pantalla', color: theme.accent },
    { x: 6.84, value: 202, label: 'Accesibilidad', text: 'Contraste, foco, jerarquía y nombres accesibles', color: '3F6B52' }
  ];
  groups.forEach((g, i) => {
    addCard(slide, pres, theme, g.x, 1.6, 2.55, 2.9, { fill: 'FFFFFF' });
    slide.addText(String(g.value), { x: g.x + 0.2, y: 1.98, w: 2.15, h: 0.76, margin: 0, fontFace: FONT_HEAD, fontSize: 38, bold: true, color: g.color, align: 'center' });
    slide.addText(g.label, { x: g.x + 0.2, y: 2.84, w: 2.15, h: 0.28, margin: 0, fontFace: FONT_BODY, fontSize: 14, bold: true, color: theme.primary, align: 'center' });
    slide.addText(g.text, { x: g.x + 0.28, y: 3.38, w: 1.99, h: 0.55, margin: 0, fontFace: FONT_BODY, fontSize: 10.5, color: theme.secondary, align: 'center', fit: 'shrink' });
    if (i < 2) {
      slide.addText('+', { x: g.x + 2.58, y: 2.64, w: 0.5, h: 0.35, margin: 0, fontFace: FONT_HEAD, fontSize: 25, bold: true, color: theme.light, align: 'center' });
    }
  });

  addCard(slide, pres, theme, 2.15, 4.7, 5.7, 0.48, { fill: theme.primary, line: theme.primary, shadow: false });
  slide.addText('394 casos en total  →  393 aprobados  +  1 omitido', {
    x: 2.4, y: 4.85, w: 5.2, h: 0.16, margin: 0,
    fontFace: FONT_BODY, fontSize: 11.3, bold: true, color: 'FFFFFF', align: 'center', fit: 'shrink'
  });

  addFooter(slide, pres, theme, 'BOOKLY · Calidad y pruebas', 13);
  addNotes(slide, 12);
  return slide;
}

module.exports = { createSlide };
