const {
  theme, addNotes, addFooter, addCard, addCircle, addTitle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addTitle(slide, pres, theme, 'Cuatro avances que ya son verificables', 'Resumen de entregables');

  const stats = [
    { n: '01', big: 'APK', title: 'Aplicación Android', text: 'APK firmado y AAB generado', color: theme.accent },
    { n: '02', big: '14', title: 'Android verificado', text: 'Instalación y arranque en dispositivo', color: theme.primary },
    { n: '03', big: '393', title: 'Pruebas aprobadas', text: '1 omitida · suite E2E', color: '3F6B52' },
    { n: '04', big: '44', title: 'Controles táctiles', text: 'Safe areas y navegación adaptable', color: theme.secondary }
  ];
  stats.forEach((s, i) => {
    const x = 0.62 + i * 2.35;
    addCard(slide, pres, theme, x, 1.55, 2.08, 3.1, { fill: 'FFFFFF' });
    slide.addText(s.n, {
      x: x + 0.2, y: 1.75, w: 0.45, h: 0.25, margin: 0,
      fontFace: FONT_BODY, fontSize: 11, bold: true, color: s.color
    });
    slide.addText(s.big, {
      x: x + 0.18, y: 2.15, w: 1.72, h: 0.75, margin: 0,
      fontFace: FONT_HEAD, fontSize: s.big === '393' ? 38 : 32, bold: true,
      color: s.color, align: 'center', fit: 'shrink'
    });
    slide.addText(s.title, {
      x: x + 0.18, y: 3.0, w: 1.72, h: 0.42, margin: 0,
      fontFace: FONT_BODY, fontSize: 12.3, bold: true, color: theme.primary,
      align: 'center', fit: 'shrink'
    });
    slide.addText(s.text, {
      x: x + 0.22, y: 3.63, w: 1.64, h: 0.56, margin: 0,
      fontFace: FONT_BODY, fontSize: 10.8, color: theme.secondary,
      align: 'center', fit: 'shrink'
    });
  });

  slide.addText('La evidencia combina producto instalable, dispositivo real, automatización y diseño táctil.', {
    x: 1.1, y: 4.84, w: 7.8, h: 0.28, margin: 0,
    fontFace: FONT_HEAD, fontSize: 15, bold: true, color: theme.primary, align: 'center'
  });

  addFooter(slide, pres, theme, 'BOOKLY · Avances destacados', 5);
  addNotes(slide, 4);
  return slide;
}

module.exports = { createSlide };
