const fs = require('fs');
const path = require('path');
const pug = require('pug');

const root = path.join(__dirname, '..');
const outPath = path.join(root, 'index.html');
const html = pug.renderFile(path.join(root, 'index.pug'), {
  pretty: true,
});
fs.writeFileSync(outPath, html, 'utf8');
