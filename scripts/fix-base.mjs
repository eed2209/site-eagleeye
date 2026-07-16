// Réécrit les chemins absolus (/...) pour un déploiement en sous-dossier
// (GitHub Pages projet). Ne fait rien si BASE_PATH n'est pas défini :
// la production sur domaine racine n'est pas affectée.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BASE = (process.env.BASE_PATH || '').replace(/\/$/, '');
if (!BASE) {
  console.log('BASE_PATH non défini : aucun réécriture (build racine).');
  process.exit(0);
}

let count = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!name.endsWith('.html')) continue;
    let html = readFileSync(p, 'utf8');
    const before = html;
    html = html.replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`);
    if (html !== before) { writeFileSync(p, html); count++; }
  }
}
walk('dist');
console.log(`Base ${BASE}/ appliquée à ${count} fichier(s) HTML.`);
