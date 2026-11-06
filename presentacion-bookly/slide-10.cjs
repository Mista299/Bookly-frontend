const {
  theme, addNotes, addFooter, addCard, addCircle, addTitle, FONT_HEAD, FONT_BODY
} = require('./helpers.cjs');

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addTitle(slide, pres, theme, 'Del frontend web a Android sin reescribir la app', 'Capacitor');

  const boxes = [
    { x: 0.55, label: '1', title: 'Build web', sub: 'SPA estática', color: theme.primary },
    { x: 2.85, label: '2', title: 'Capacitor', sub: 'Sincroniza', color: theme.secondary },
    { x: 5.15, label: '3', title: 'Gradle', sub: 'Empaqueta', color: theme.accent },
    { x: 7.45, label: '4', title: 'Android', sub: 'APK / AAB', color: '3F6B52' }
  ];
  boxes.forEach((b, i) => {
    addCard(slide, pres, theme, b.x, 1.65, 1.95, 1.72, { fill: 'FFFFFF' });
    addCircle(slide, pres, theme, b.x + 0.17, 1.43, 0.48, b.color, b.label, 'FFFFFF', 13);
    slide.addText(b.title, { x: b.x + 0.2, y: 2.05, w: 1.55, h: 0.28, margin: 0, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: theme.primary, align: 'center' });
    slide.addText(b.sub, { x: b.x + 0.2, y: 2.5, w: 1.55, h: 0.22, margin: 0, fontFace: FONT_BODY, fontSize: 11, color: theme.secondary, align: 'center' });
    if (i < boxes.length - 1) slide.addShape(pres.shapes.LINE, { x: b.x + 1.98, y: 2.51, w: 0.3, h: 0, line: { color: theme.accent, width: 2.2, endArrowType: 'triangle' } });
  });

  addCard(slide, pres, theme, 0.65, 3.75, 4.1, 1.0, { fill: theme.primary, line: theme.primary, shadow: false });
  slide.addText('Lo que se conserva', { x: 0.9, y: 3.95, w: 1.7, h: 0.25, margin: 0, fontFace: FONT_HEAD, fontSize: 15, bold: true, color: 'FFFFFF' });
  slide.addText('SvelteKit · Svelte · TypeScript · SCSS', { x: 0.9, y: 4.32, w: 3.4, h: 0.2, margin: 0, fontFace: FONT_BODY, fontSize: 11.5, color: theme.light });

  addCard(slide, pres, theme, 5.15, 3.75, 4.1, 1.0, { fill: 'FFFFFF', shadow: false });
  slide.addText('Lo que se agrega', { x: 5.4, y: 3.95, w: 1.7, h: 0.25, margin: 0, fontFace: FONT_HEAD, fontSize: 15, bold: true, color: theme.accent });
  slide.addText('WebView nativo · plugins · firma · distribución', { x: 5.4, y: 4.32, w: 3.45, h: 0.2, margin: 0, fontFace: FONT_BODY, fontSize: 11.2, color: theme.secondary, fit: 'shrink' });

  slide.addText('Resultado: un APK universal firmado y un AAB preparado para Google Play.', {
    x: 1.4, y: 4.98, w: 7.2, h: 0.24, margin: 0,
    fontFace: FONT_BODY, fontSize: 12.5, bold: true, color: theme.primary, align: 'center'
  });

  addFooter(slide, pres, theme, 'BOOKLY · Del frontend web a Android', 10);
  addNotes(slide, 9);
  return slide;
}

module.exports = { createSlide };
