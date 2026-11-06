const {
  theme, addNotes, addFooter, addCard, addCircle, addTitle, addBulletList, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addTitle(slide, pres, theme, 'Qué queda listo y cuál es el siguiente paso', 'Estado y hoja de ruta');

  addCard(slide, pres, theme, 0.62, 1.48, 4.15, 3.35, { fill: 'FFFFFF', shadow: false });
  slide.addText('Completado', { x: 0.9, y: 1.78, w: 3.6, h: 0.32, margin: 0, fontFace: FONT_HEAD, fontSize: 19, bold: true, color: '3F6B52' });
  addBulletList(slide, ['APK firmado + AAB', 'Verificación en Android 14', 'Flujos principales por rol', 'Responsive y accesibilidad', '393 pruebas E2E aprobadas'], { x: 0.92, y: 2.34, w: 3.45, h: 1.9, fs: 12.3, gap: 9, color: theme.secondary });

  addCard(slide, pres, theme, 5.23, 1.48, 4.15, 3.35, { fill: theme.primary, line: theme.primary, shadow: false });
  slide.addText('Próximos pasos', { x: 5.51, y: 1.78, w: 3.6, h: 0.32, margin: 0, fontFace: FONT_HEAD, fontSize: 19, bold: true, color: 'FFFFFF' });
  addBulletList(slide, ['Publicación en Google Play', 'Pruebas con usuarios reales', 'Más dispositivos y gamas Android', 'Resolver incidencias de la API', 'Métricas de uso y calidad'], { x: 5.53, y: 2.34, w: 3.45, h: 1.9, fs: 12.3, gap: 9, color: theme.light });

  addCard(slide, pres, theme, 3.48, 4.91, 3.05, 0.4, { fill: theme.accent, line: theme.accent, shadow: false });
  slide.addText('Pendiente clave: reprogramar reservas', {
    x: 3.62, y: 5.04, w: 2.77, h: 0.13, margin: 0,
    fontFace: FONT_BODY, fontSize: 9.3, bold: true, color: 'FFFFFF', align: 'center', fit: 'shrink'
  });

  addFooter(slide, pres, theme, 'BOOKLY · Estado actual y próximos pasos', 15);
  addNotes(slide, 14);
  return slide;
}

module.exports = { createSlide };
