const {
  theme, addNotes, addFooter, addCard, addCircle, addTitle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addTitle(slide, pres, theme, 'El acceso se adapta al rol y protege la sesión', 'Autenticación y permisos');

  const centers = [1.6, 4.98, 8.36];
  const labels = [
    { title: 'Validar', text: 'Correo y contraseña', color: theme.primary },
    { title: 'Proteger', text: 'MFA para administración', color: theme.secondary },
    { title: 'Enrutar', text: 'Cada rol ve su módulo', color: theme.accent }
  ];
  labels.forEach((l, i) => {
    addCircle(slide, pres, theme, centers[i] - 0.55, 1.55, 1.1, l.color, String(i + 1), 'FFFFFF', 24);
    slide.addText(l.title, { x: centers[i] - 0.8, y: 2.85, w: 1.6, h: 0.3, margin: 0, fontFace: FONT_HEAD, fontSize: 17, bold: true, color: theme.primary, align: 'center' });
    slide.addText(l.text, { x: centers[i] - 1.05, y: 3.28, w: 2.1, h: 0.42, margin: 0, fontFace: FONT_BODY, fontSize: 11.5, color: theme.secondary, align: 'center', fit: 'shrink' });
    if (i < 2) slide.addShape(pres.shapes.LINE, { x: centers[i] + 0.62, y: 2.1, w: 1.7, h: 0, line: { color: theme.light, width: 2.5, endArrowType: 'triangle' } });
  });

  const modules = [
    { x: 0.75, text: 'Administrador\nServicios · Usuarios\nAuditoría', color: theme.primary },
    { x: 3.75, text: 'Profesional\nAgenda · Horario\nTurnos', color: theme.secondary },
    { x: 6.75, text: 'Cliente\nCatálogo · Disponibilidad\nReservas', color: theme.accent }
  ];
  modules.forEach((m) => {
    addCard(slide, pres, theme, m.x, 4.0, 2.5, 0.82, { fill: 'FFFFFF', shadow: false });
    slide.addText(m.text, { x: m.x + 0.16, y: 4.16, w: 2.18, h: 0.45, margin: 0, fontFace: FONT_BODY, fontSize: 10.4, bold: true, color: m.color, align: 'center', fit: 'shrink' });
  });

  slide.addText('La sesión se conserva en el dispositivo; si caduca, se limpia y vuelve al login sin afectar la app.', {
    x: 1.15, y: 4.95, w: 7.7, h: 0.23, margin: 0,
    fontFace: FONT_BODY, fontSize: 11.3, color: theme.secondary, align: 'center'
  });

  addFooter(slide, pres, theme, 'BOOKLY · Autenticación y manejo de sesión', 9);
  addNotes(slide, 8);
  return slide;
}

module.exports = { createSlide };
