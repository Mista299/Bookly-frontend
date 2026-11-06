const path = require('path');
const fs = require('fs');
const { pptxgen, theme } = require('./helpers.cjs');

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'Equipo BOOKLY';
pres.subject = 'Avances del proyecto BOOKLY — Computación Móvil';
pres.title = 'BOOKLY — Avances del proyecto';
pres.company = 'Universidad de Antioquia';
pres.lang = 'es-CO';
pres.theme = {
  headFontFace: 'Georgia',
  bodyFontFace: 'Calibri',
  lang: 'es-CO'
};
pres.defineLayout({ name: 'BOOKLY_WIDE', width: 10, height: 5.625 });
pres.layout = 'BOOKLY_WIDE';

for (let i = 1; i <= 16; i++) {
  const n = String(i).padStart(2, '0');
  const mod = require(`./slide-${n}.cjs`);
  mod.createSlide(pres, theme);
}

const out = path.join(__dirname, 'output');
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, 'BOOKLY-Avances-Computacion-Movil.pptx');
pres.writeFile({ fileName: file });
console.log(file);
