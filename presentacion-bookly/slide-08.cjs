const {
  theme, addNotes, addFooter, addCard, addCircle, addTitle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addTitle(slide, pres, theme, 'Así se ve una reserva real, paso a paso', 'Recorrido del cliente');

  const items = [
    ['1', 'Explorar', 'El cliente abre el catálogo y filtra servicios.'],
    ['2', 'Elegir', 'Selecciona un servicio y el profesional disponible.'],
    ['3', 'Consultar', 'La API devuelve solo horarios realmente libres.'],
    ['4', 'Confirmar', 'La app envía servicio, profesional, inicio y fin.'],
    ['5', 'Validar', 'La API comprueba reglas y conflictos en ese instante.'],
    ['6', 'Sincronizar', 'La cita aparece en ambas agendas y en auditoría.']
  ];
  items.forEach((it, i) => {
    const row = i < 3 ? 1 : 2;
    const col = i % 3;
    const x = 0.65 + col * 3.13;
    const y = 1.42 + row * 1.34;
    addCard(slide, pres, theme, x, y, 2.72, 0.94, { fill: 'FFFFFF', shadow: false });
    addCircle(slide, pres, theme, x + 0.17, y + 0.14, 0.4, i < 3 ? theme.accent : '3F6B52', it[0], 'FFFFFF', 11);
    slide.addText(it[1], {
      x: x + 0.7, y: y + 0.1, w: 1.76, h: 0.21, margin: 0,
      fontFace: FONT_HEAD, fontSize: 12.8, bold: true, color: theme.primary
    });
    slide.addText(it[2], {
      x: x + 0.7, y: y + 0.38, w: 1.76, h: 0.36, margin: 0,
      fontFace: FONT_BODY, fontSize: 8.8, color: theme.secondary, fit: 'shrink'
    });
  });
  slide.addShape(pres.shapes.LINE, { x: 3.35, y: 1.89, w: 0.35, h: 0, line: { color: theme.light, width: 1.5, endArrowType: 'triangle' } });
  slide.addShape(pres.shapes.LINE, { x: 6.48, y: 1.89, w: 0.35, h: 0, line: { color: theme.light, width: 1.5, endArrowType: 'triangle' } });
  slide.addShape(pres.shapes.LINE, { x: 1.98, y: 2.36, w: 0, h: 0.32, line: { color: theme.light, width: 1.5, endArrowType: 'triangle' } });
  slide.addShape(pres.shapes.LINE, { x: 8.24, y: 2.36, w: 0, h: 0.32, line: { color: theme.light, width: 1.5, endArrowType: 'triangle' } });

  addCard(slide, pres, theme, 3.48, 0.96, 3.05, 0.28, { fill: theme.primary, line: theme.primary, shadow: false });
  slide.addText('Regla visible: mínimo 2 horas de anticipación', {
    x: 3.63, y: 1.025, w: 2.75, h: 0.08, margin: 0,
    fontFace: FONT_BODY, fontSize: 7.5, bold: true, color: 'FFFFFF', align: 'center', fit: 'shrink'
  });

  addFooter(slide, pres, theme, 'BOOKLY · Flujo de reserva', 8);
  addNotes(slide, 7);
  return slide;
}

module.exports = { createSlide };
