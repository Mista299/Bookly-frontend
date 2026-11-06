const {
  theme, addNotes, addFooter, addCard, addCircle, addTitle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addTitle(slide, pres, theme, 'El problema: tres personas, una agenda dispersa', 'Punto de partida');

  const roles = [
    { x: 0.65, title: 'Cliente', icon: 'C', text: 'Busca un servicio y necesita una hora realmente libre.', color: theme.accent },
    { x: 3.78, title: 'Profesional', icon: 'P', text: 'Administra su horario y evita reservas superpuestas.', color: theme.secondary },
    { x: 6.91, title: 'Administración', icon: 'A', text: 'Configura servicios, usuarios y necesita trazabilidad.', color: '3F6B52' }
  ];
  roles.forEach((r) => {
    addCard(slide, pres, theme, r.x, 1.55, 2.43, 2.03, { fill: 'FFFFFF' });
    addCircle(slide, pres, theme, r.x + 0.18, 1.78, 0.46, r.color, r.icon, 'FFFFFF', 14);
    slide.addText(r.title, {
      x: r.x + 0.77, y: 1.81, w: 1.47, h: 0.28, margin: 0,
      fontFace: FONT_HEAD, fontSize: 13.2, bold: true, color: theme.primary, fit: 'shrink'
    });
    slide.addText(r.text, {
      x: r.x + 0.2, y: 2.48, w: 2.02, h: 0.68, margin: 0,
      fontFace: FONT_BODY, fontSize: 12.5, color: theme.secondary, fit: 'shrink'
    });
  });

  slide.addText('Antes: llamadas, mensajes y cuadernos', {
    x: 1.1, y: 3.98, w: 3.2, h: 0.28, margin: 0,
    fontFace: FONT_HEAD, fontSize: 16, bold: true, color: theme.secondary, align: 'center'
  });
  slide.addText('Después: una agenda compartida', {
    x: 5.65, y: 3.98, w: 3.2, h: 0.28, margin: 0,
    fontFace: FONT_HEAD, fontSize: 16, bold: true, color: theme.accent, align: 'center'
  });
  slide.addShape(pres.shapes.LINE, {
    x: 2.7, y: 4.42, w: 4.6, h: 0,
    line: { color: theme.accent, width: 2.5, beginArrowType: 'none', endArrowType: 'triangle' }
  });
  slide.addText('Una sola fuente de verdad para disponibilidad, reservas y permisos', {
    x: 2.4, y: 4.62, w: 5.2, h: 0.34, margin: 0,
    fontFace: FONT_BODY, fontSize: 13, color: theme.primary, align: 'center'
  });

  addFooter(slide, pres, theme, 'BOOKLY · Problema y propuesta de valor', 2);
  addNotes(slide, 2);
  return slide;
}

module.exports = { createSlide };
