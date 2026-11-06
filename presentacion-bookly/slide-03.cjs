const {
  theme, addNotes, addFooter, addCard, addCircle, addTitle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addTitle(slide, pres, theme, 'Una app, tres experiencias según el rol', 'Alcance funcional');

  const xs = [0.55, 3.73, 6.91];
  const data = [
    { role: 'Administrador', color: theme.primary, items: ['Servicios y profesionales', 'Agenda global', 'Usuarios, roles y auditoría', 'Perfil y seguridad'] },
    { role: 'Profesional', color: theme.secondary, items: ['Turnos de hoy', 'Agenda de citas', 'Horario semanal', 'Perfil'] },
    { role: 'Cliente', color: theme.accent, items: ['Catálogo de servicios', 'Detalle y profesionales', 'Disponibilidad real', 'Reservas y cancelaciones'] }
  ];
  data.forEach((d, i) => {
    addCard(slide, pres, theme, xs[i], 1.52, 2.55, 3.18, { fill: 'FFFFFF' });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: xs[i], y: 1.52, w: 2.55, h: 0.12,
      fill: { color: d.color }, line: { color: d.color }
    });
    slide.addText(d.role, {
      x: xs[i] + 0.2, y: 1.82, w: 2.15, h: 0.3, margin: 0,
      fontFace: FONT_HEAD, fontSize: 17, bold: true, color: theme.primary, align: 'center'
    });
    d.items.forEach((item, j) => {
      addCircle(slide, pres, theme, xs[i] + 0.22, 2.38 + j * 0.48, 0.16, d.color, '✓', 'FFFFFF', 8);
      slide.addText(item, {
        x: xs[i] + 0.5, y: 2.35 + j * 0.48, w: 1.82, h: 0.26, margin: 0,
        fontFace: FONT_BODY, fontSize: 11.6, color: theme.secondary, fit: 'shrink'
      });
    });
  });

  slide.addText('Acceso común: registro · login · MFA · cambio de contraseña · cierre de sesión', {
    x: 1.15, y: 4.87, w: 7.7, h: 0.23, margin: 0,
    fontFace: FONT_BODY, fontSize: 11.5, color: theme.secondary, align: 'center'
  });

  addFooter(slide, pres, theme, 'BOOKLY · Alcance funcional implementado', 3);
  addNotes(slide, 3);
  return slide;
}

module.exports = { createSlide };
