const {
  theme, addNotes, addFooter, addCard, addCircle, addTitle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addTitle(slide, pres, theme, 'Los flujos principales ya trabajan de extremo a extremo', 'Estado funcional');

  const panels = [
    { x: 0.55, title: 'Administrador', color: theme.primary, tabs: ['Resumen', 'Servicios', 'Usuarios', 'Auditoría'], note: 'Configura y supervisa' },
    { x: 3.73, title: 'Profesional', color: theme.secondary, tabs: ['Hoy', 'Agenda', 'Horario', 'Turnos'], note: 'Organiza su tiempo' },
    { x: 6.91, title: 'Cliente', color: theme.accent, tabs: ['Inicio', 'Servicios', 'Agenda', 'Perfil'], note: 'Encuentra y reserva' }
  ];
  panels.forEach((p) => {
    addCard(slide, pres, theme, p.x, 1.5, 2.55, 3.15, { fill: 'FFFFFF' });
    slide.addText(p.title, {
      x: p.x + 0.2, y: 1.72, w: 2.15, h: 0.27, margin: 0,
      fontFace: FONT_HEAD, fontSize: 16, bold: true, color: theme.primary, align: 'center'
    });
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: p.x + 0.22, y: 2.18, w: 2.1, h: 1.63, rectRadius: 0.08,
      fill: { color: theme.bg }, line: { color: theme.light }
    });
    p.tabs.forEach((t, j) => {
      slide.addText(t, {
        x: p.x + 0.43, y: 2.37 + j * 0.31, w: 1.45, h: 0.18, margin: 0,
        fontFace: FONT_BODY, fontSize: 9.5, bold: j === 0, color: j === 0 ? p.color : theme.secondary
      });
      if (j === 0) {
        slide.addShape(pres.shapes.OVAL, {
          x: p.x + 0.25, y: 2.39, w: 0.1, h: 0.1,
          fill: { color: p.color }, line: { color: p.color }
        });
      }
    });
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: p.x + 0.55, y: 4.06, w: 1.45, h: 0.36, rectRadius: 0.14,
      fill: { color: p.color }, line: { color: p.color }
    });
    slide.addText(p.note, {
      x: p.x + 0.61, y: 4.17, w: 1.33, h: 0.12, margin: 0,
      fontFace: FONT_BODY, fontSize: 8.3, bold: true, color: 'FFFFFF', align: 'center'
    });
  });

  slide.addText('La misma base de negocio alimenta las tres experiencias', {
    x: 2.1, y: 4.83, w: 5.8, h: 0.26, margin: 0,
    fontFace: FONT_HEAD, fontSize: 16, bold: true, color: theme.accent, align: 'center'
  });

  addFooter(slide, pres, theme, 'BOOKLY · Flujos por rol', 4);
  addNotes(slide, 3);
  return slide;
}

module.exports = { createSlide };
