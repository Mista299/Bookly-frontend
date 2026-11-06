const {
  theme, addNotes, addFooter, addCard, addCircle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 6.95, y: 0, w: 3.05, h: 5.625,
    fill: { color: theme.primary }, line: { color: theme.primary }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 7.55, y: 0.63, w: 1.72, h: 3.72, rectRadius: 0.2,
    fill: { color: 'FFFFFF' }, line: { color: theme.light, width: 1.4 },
    shadow: { type: 'outer', color: '000000', blur: 4, offset: 2, angle: 135, opacity: 0.16 }
  });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 7.72, y: 0.8, w: 1.38, h: 0.34, rectRadius: 0.12,
    fill: { color: theme.light }, line: { color: theme.light }
  });
  slide.addText('9:41', {
    x: 7.84, y: 0.86, w: 0.5, h: 0.14, margin: 0,
    fontFace: FONT_BODY, fontSize: 8.5, bold: true, color: theme.primary
  });
  slide.addText('BOOKLY', {
    x: 7.78, y: 1.42, w: 1.26, h: 0.28, margin: 0,
    fontFace: FONT_HEAD, fontSize: 17, bold: true, color: theme.primary, align: 'center'
  });
  slide.addText('Tu próxima cita', {
    x: 7.78, y: 1.78, w: 1.26, h: 0.18, margin: 0,
    fontFace: FONT_BODY, fontSize: 8.5, color: theme.secondary, align: 'center'
  });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 7.82, y: 2.14, w: 1.18, h: 0.86, rectRadius: 0.1,
    fill: { color: theme.bg }, line: { color: theme.light }
  });
  slide.addText('14:30', {
    x: 7.9, y: 2.27, w: 1.02, h: 0.28, margin: 0,
    fontFace: FONT_HEAD, fontSize: 20, bold: true, color: theme.accent, align: 'center'
  });
  slide.addText('Coloración', {
    x: 7.9, y: 2.66, w: 1.02, h: 0.15, margin: 0,
    fontFace: FONT_BODY, fontSize: 8, color: theme.secondary, align: 'center'
  });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 7.82, y: 3.24, w: 0.5, h: 0.5, rectRadius: 0.1,
    fill: { color: theme.accent }, line: { color: theme.accent }
  });
  slide.addText('Reservar', {
    x: 7.84, y: 3.4, w: 0.46, h: 0.12, margin: 0,
    fontFace: FONT_BODY, fontSize: 6.6, bold: true, color: 'FFFFFF', align: 'center', fit: 'shrink'
  });
  ['Inicio', 'Servicios', 'Agenda', 'Perfil'].forEach((t, i) => {
    addCircle(slide, pres, theme, 7.8 + i * 0.33, 3.99, 0.16, i === 2 ? theme.accent : theme.light);
    slide.addText(t, {
      x: 7.72 + i * 0.33, y: 4.19, w: 0.32, h: 0.11, margin: 0,
      fontFace: FONT_BODY, fontSize: 4.8, color: i === 2 ? theme.accent : theme.secondary, align: 'center'
    });
  });

  slide.addText('BOOKLY', {
    x: 0.62, y: 0.56, w: 4.2, h: 0.55, margin: 0,
    fontFace: FONT_HEAD, fontSize: 32, bold: true, color: theme.primary
  });
  slide.addText('Avances del proyecto', {
    x: 0.65, y: 1.35, w: 5.5, h: 0.72, margin: 0,
    fontFace: FONT_HEAD, fontSize: 38, bold: true, color: theme.primary, fit: 'shrink'
  });
  slide.addText('Una aplicación móvil para organizar citas, disponibilidad y reservas en salones de belleza.', {
    x: 0.68, y: 2.25, w: 5.25, h: 0.8, margin: 0,
    fontFace: FONT_BODY, fontSize: 18, color: theme.secondary, breakLine: false, fit: 'shrink'
  });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.68, y: 3.42, w: 2.35, h: 0.48, rectRadius: 0.2,
    fill: { color: theme.accent }, line: { color: theme.accent }
  });
  slide.addText('Computación Móvil', {
    x: 0.78, y: 3.56, w: 2.15, h: 0.18, margin: 0,
    fontFace: FONT_BODY, fontSize: 11.5, bold: true, color: 'FFFFFF', align: 'center'
  });
  slide.addText('2026-II  ·  Lógica de negocio + frontend Android', {
    x: 0.7, y: 4.38, w: 5.4, h: 0.25, margin: 0,
    fontFace: FONT_BODY, fontSize: 12.5, color: theme.secondary
  });
  slide.addText('Equipo BOOKLY', {
    x: 0.7, y: 4.77, w: 3, h: 0.22, margin: 0,
    fontFace: FONT_BODY, fontSize: 11, color: theme.primary
  });

  addNotes(slide, 1);
  return slide;
}

module.exports = { createSlide };
