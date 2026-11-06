const {
  theme, addNotes, addFooter, addCard, addCircle, addTitle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addTitle(slide, pres, theme, 'Una reserva depende de reglas, no solo de fecha y hora', 'Lógica de negocio');

  const steps = [
    { x: 0.55, title: 'Horario', text: 'El profesional define sus franjas semanales.', color: theme.primary },
    { x: 2.88, title: 'Disponibilidad', text: 'El sistema cruza servicio, duración y reservas.', color: theme.secondary },
    { x: 5.21, title: 'Reserva', text: 'El cliente elige un espacio realmente libre.', color: theme.accent },
    { x: 7.54, title: 'Agenda', text: 'Las partes ven la cita y queda auditada.', color: '3F6B52' }
  ];
  steps.forEach((s, i) => {
    addCard(slide, pres, theme, s.x, 1.62, 1.92, 2.24, { fill: 'FFFFFF' });
    addCircle(slide, pres, theme, s.x + 0.65, 1.38, 0.62, s.color, String(i + 1), 'FFFFFF', 18);
    slide.addText(s.title, {
      x: s.x + 0.12, y: 2.12, w: 1.68, h: 0.46, margin: 0,
      fontFace: FONT_HEAD, fontSize: 14, bold: true, color: theme.primary, align: 'center', fit: 'shrink'
    });
    slide.addText(s.text, {
      x: s.x + 0.19, y: 2.68, w: 1.54, h: 0.72, margin: 0,
      fontFace: FONT_BODY, fontSize: 11.2, color: theme.secondary, align: 'center', fit: 'shrink'
    });
    if (i < steps.length - 1) {
      slide.addShape(pres.shapes.LINE, {
        x: s.x + 1.95, y: 2.76, w: 0.32, h: 0,
        line: { color: theme.accent, width: 2, endArrowType: 'triangle' }
      });
    }
  });

  addCard(slide, pres, theme, 1.15, 4.18, 7.7, 0.68, { fill: theme.primary, line: theme.primary, shadow: false });
  slide.addText('Si el horario cambia o se ocupa mientras el cliente decide, la API vuelve a validarlo y evita una reserva inválida.', {
    x: 1.48, y: 4.39, w: 7.04, h: 0.25, margin: 0,
    fontFace: FONT_BODY, fontSize: 12.5, color: 'FFFFFF', align: 'center', fit: 'shrink'
  });

  addFooter(slide, pres, theme, 'BOOKLY · La reserva como proceso central', 6);
  addNotes(slide, 5);
  return slide;
}

module.exports = { createSlide };
