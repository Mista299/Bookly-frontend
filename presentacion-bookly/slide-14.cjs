const {
  theme, addNotes, addFooter, addCard, addCircle, addTitle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addTitle(slide, pres, theme, 'Las pruebas encontraron fallos que la vista no mostraba', 'Errores y mitigaciones');

  const rows = [
    { y: 1.55, label: 'Sesión recién iniciada', before: 'Un 401 antiguo cerraba el login.', after: 'Solo se cierra si el token fallido sigue vigente.', color: theme.primary },
    { y: 2.48, label: 'Cambio de contraseña', before: 'Contraseña incorrecta expulsaba al admin.', after: 'Error visible sin cerrar la sesión.', color: theme.accent },
    { y: 3.41, label: 'Auditoría', before: 'El filtro de fecha provocaba HTTP 400.', after: 'Fechas normalizadas con zona horaria.', color: '3F6B52' }
  ];
  rows.forEach((r) => {
    addCard(slide, pres, theme, 0.6, r.y, 2.25, 0.72, { fill: 'FFFFFF', shadow: false });
    slide.addText(r.label, { x: 0.78, y: r.y + 0.12, w: 1.88, h: 0.2, margin: 0, fontFace: FONT_BODY, fontSize: 10.7, bold: true, color: theme.primary, fit: 'shrink' });
    slide.addText(r.before, { x: 0.78, y: r.y + 0.39, w: 1.88, h: 0.2, margin: 0, fontFace: FONT_BODY, fontSize: 9.5, color: theme.secondary, fit: 'shrink' });
    slide.addShape(pres.shapes.LINE, { x: 2.9, y: r.y + 0.36, w: 0.72, h: 0, line: { color: r.color, width: 2.2, endArrowType: 'triangle' } });
    addCard(slide, pres, theme, 3.68, r.y, 5.67, 0.72, { fill: 'FFFFFF', shadow: false });
    slide.addText(r.after, { x: 3.9, y: r.y + 0.22, w: 5.22, h: 0.28, margin: 0, fontFace: FONT_BODY, fontSize: 11.2, color: r.color, fit: 'shrink' });
  });

  slide.addText('7 errores reales del frontend corregidos', {
    x: 2.1, y: 4.55, w: 5.8, h: 0.3, margin: 0,
    fontFace: FONT_HEAD, fontSize: 18, bold: true, color: theme.accent, align: 'center'
  });
  slide.addText('Las incidencias del backend quedaron documentadas; cuando fue posible, el frontend las toleró sin interrumpir la experiencia.', {
    x: 1.4, y: 4.95, w: 7.2, h: 0.25, margin: 0,
    fontFace: FONT_BODY, fontSize: 10.8, color: theme.secondary, align: 'center', fit: 'shrink'
  });

  addFooter(slide, pres, theme, 'BOOKLY · Errores encontrados', 14);
  addNotes(slide, 13);
  return slide;
}

module.exports = { createSlide };
