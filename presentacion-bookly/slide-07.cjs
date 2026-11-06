const {
  theme, addNotes, addFooter, addCard, addCircle, addTitle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addTitle(slide, pres, theme, 'La API decide y explica el resultado', 'Reglas en lenguaje llano');

  addCard(slide, pres, theme, 0.6, 1.55, 2.25, 2.72, { fill: 'FFFFFF' });
  slide.addText('1', { x: 0.82, y: 1.83, w: 0.45, h: 0.42, margin: 0, fontFace: FONT_HEAD, fontSize: 27, bold: true, color: theme.accent });
  slide.addText('Solicitud', { x: 1.35, y: 1.91, w: 1.18, h: 0.28, margin: 0, fontFace: FONT_HEAD, fontSize: 18, bold: true, color: theme.primary });
  slide.addText('La app envía la acción del usuario y su sesión vigente.', { x: 0.84, y: 2.55, w: 1.72, h: 0.75, margin: 0, fontFace: FONT_BODY, fontSize: 13, color: theme.secondary, fit: 'shrink' });
  slide.addText('Ejemplo: “quiero reservar 14:30”', { x: 0.84, y: 3.55, w: 1.72, h: 0.35, margin: 0, fontFace: FONT_BODY, fontSize: 10.5, italic: true, color: theme.accent, fit: 'shrink' });

  addCard(slide, pres, theme, 3.87, 1.55, 2.25, 2.72, { fill: theme.primary, line: theme.primary });
  slide.addText('2', { x: 4.09, y: 1.83, w: 0.45, h: 0.42, margin: 0, fontFace: FONT_HEAD, fontSize: 27, bold: true, color: theme.light });
  slide.addText('Reglas', { x: 4.62, y: 1.91, w: 1.18, h: 0.28, margin: 0, fontFace: FONT_HEAD, fontSize: 18, bold: true, color: 'FFFFFF' });
  slide.addText('La API comprueba horario, anticipación, disponibilidad, rol y conflictos.', { x: 4.11, y: 2.55, w: 1.72, h: 0.95, margin: 0, fontFace: FONT_BODY, fontSize: 13, color: theme.light, fit: 'shrink' });
  slide.addText('La app no decide la agenda.', { x: 4.11, y: 3.67, w: 1.72, h: 0.28, margin: 0, fontFace: FONT_BODY, fontSize: 10.5, italic: true, color: theme.light });

  addCard(slide, pres, theme, 7.14, 1.55, 2.25, 2.72, { fill: 'FFFFFF' });
  slide.addText('3', { x: 7.36, y: 1.83, w: 0.45, h: 0.42, margin: 0, fontFace: FONT_HEAD, fontSize: 27, bold: true, color: '3F6B52' });
  slide.addText('Respuesta', { x: 7.89, y: 1.91, w: 1.25, h: 0.28, margin: 0, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: theme.primary, fit: 'shrink' });
  slide.addText('La interfaz recibe datos actualizados o un motivo comprensible.', { x: 7.38, y: 2.55, w: 1.72, h: 0.75, margin: 0, fontFace: FONT_BODY, fontSize: 13, color: theme.secondary, fit: 'shrink' });
  slide.addText('Éxito → actualizar agenda\nError → explicar y refrescar', { x: 7.38, y: 3.49, w: 1.72, h: 0.55, margin: 0, fontFace: FONT_BODY, fontSize: 10.5, color: '3F6B52', fit: 'shrink' });

  slide.addShape(pres.shapes.LINE, { x: 2.85, y: 2.91, w: 1.0, h: 0, line: { color: theme.accent, width: 2.5, endArrowType: 'triangle' } });
  slide.addShape(pres.shapes.LINE, { x: 6.12, y: 2.91, w: 1.0, h: 0, line: { color: theme.accent, width: 2.5, endArrowType: 'triangle' } });

  slide.addText('Ejemplo: “ese horario ya no está disponible; elige otro”', {
    x: 2.5, y: 4.6, w: 5, h: 0.25, margin: 0,
    fontFace: FONT_BODY, fontSize: 13, color: theme.primary, align: 'center'
  });

  addFooter(slide, pres, theme, 'BOOKLY · Funcionamiento de la API', 7);
  addNotes(slide, 6);
  return slide;
}

module.exports = { createSlide };
