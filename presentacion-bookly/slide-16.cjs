const {
  theme, addNotes, addFooter, addCard, addCircle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.primary };

  slide.addText('Tres ideas para recordar', {
    x: 0.65, y: 0.6, w: 8.7, h: 0.62, margin: 0,
    fontFace: FONT_HEAD, fontSize: 34, bold: true, color: 'FFFFFF', align: 'center'
  });
  slide.addText('BOOKLY · Avances del proyecto', {
    x: 0.65, y: 1.35, w: 8.7, h: 0.24, margin: 0,
    fontFace: FONT_BODY, fontSize: 12.5, color: theme.light, align: 'center'
  });

  const ideas = [
    { x: 0.7, n: '01', title: 'Lógica centralizada', text: 'La API protege disponibilidad, reservas, permisos y trazabilidad.', color: theme.accent },
    { x: 3.58, n: '02', title: 'Experiencia móvil real', text: 'La app integra Android y fue verificada en un dispositivo.', color: theme.secondary },
    { x: 6.46, n: '03', title: 'Calidad verificable', text: '393 pruebas y artefactos listos para distribución.', color: '3F6B52' }
  ];
  ideas.forEach((it) => {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: it.x, y: 2.0, w: 2.52, h: 2.1, rectRadius: 0.15,
      fill: { color: 'FFFFFF', transparency: 92 }, line: { color: it.color, width: 1.8 }
    });
    slide.addText(it.n, { x: it.x + 0.18, y: 2.2, w: 0.6, h: 0.3, margin: 0, fontFace: FONT_BODY, fontSize: 12, bold: true, color: it.color });
    slide.addText(it.title, { x: it.x + 0.18, y: 2.72, w: 2.16, h: 0.48, margin: 0, fontFace: FONT_HEAD, fontSize: 17, bold: true, color: 'FFFFFF', fit: 'shrink' });
    slide.addText(it.text, { x: it.x + 0.18, y: 3.34, w: 2.16, h: 0.52, margin: 0, fontFace: FONT_BODY, fontSize: 10.8, color: theme.light, fit: 'shrink' });
  });

  slide.addText('¿Preguntas?', {
    x: 3.5, y: 4.55, w: 3, h: 0.45, margin: 0,
    fontFace: FONT_HEAD, fontSize: 25, bold: true, color: theme.light, align: 'center'
  });

  addFooter(slide, pres, theme, 'BOOKLY · Conclusiones', 16, true);
  addNotes(slide, 15);
  return slide;
}

module.exports = { createSlide };
