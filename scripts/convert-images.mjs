// Convertit en WebP toutes les images matricielles déposées dans
// public/images (GIF, PNG, JPG) — les GIF deviennent des WebP ANIMÉS —
// puis réécrit les références /images/xxx.gif → /images/xxx.webp dans le
// contenu, et supprime les fichiers d'origine.
//
// Pensé pour tourner automatiquement en CI après chaque enregistrement
// d'image depuis le board (voir .github/workflows/deploy-vps.yml), mais
// utilisable à la main : `node scripts/convert-images.mjs`.
//
// Dépend uniquement de ffmpeg (présent sur les runners GitHub et en local).
import { readdirSync, readFileSync, writeFileSync, statSync, rmSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { execFileSync } from 'node:child_process';

const IMAGES_DIR = 'public/images';
// Extensions converties. Le favicon reste en PNG (certains navigateurs/OS
// le préfèrent) : on l'exclut explicitement.
const RASTER = new Set(['.gif', '.png', '.jpg', '.jpeg']);
const KEEP = new Set(['favicon-eagle.png']);
// Dossiers où chercher les références aux images à réécrire.
const CONTENT_ROOTS = ['src', 'public'];
const TEXT_EXT = new Set(['.md', '.mdx', '.astro', '.html', '.txt', '.xml', '.json']);

function ffmpeg(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
}

// 1) Convertir chaque image matricielle en WebP.
const converted = []; // [{ oldName, newName }]
let entries = [];
try {
  entries = readdirSync(IMAGES_DIR);
} catch {
  console.log(`${IMAGES_DIR} introuvable : rien à faire.`);
  process.exit(0);
}

for (const name of entries) {
  const abs = join(IMAGES_DIR, name);
  if (statSync(abs).isDirectory()) continue;
  const ext = extname(name).toLowerCase();
  if (!RASTER.has(ext) || KEEP.has(name)) continue;

  const newName = `${basename(name, extname(name))}.webp`;
  const out = join(IMAGES_DIR, newName);

  if (ext === '.gif') {
    // WebP animé : conserve l'animation du GIF.
    ffmpeg(['-i', abs, '-vcodec', 'libwebp_anim', '-loop', '0', '-lossless', '0',
      '-q:v', '70', '-compression_level', '6', '-preset', 'default', '-an', out]);
  } else {
    // Image fixe : WebP classique (préserve la transparence éventuelle).
    ffmpeg(['-i', abs, '-vcodec', 'libwebp', '-lossless', '0',
      '-q:v', '80', '-compression_level', '6', out]);
  }

  rmSync(abs);
  converted.push({ oldName: name, newName });
  console.log(`Converti : ${name} → ${newName}`);
}

if (converted.length === 0) {
  console.log('Aucune image à convertir.');
  process.exit(0);
}

// 2) Réécrire les références dans le contenu.
// On repère les chemins /images/<nom>.<ext> (nom éventuellement URL-encodé,
// ex. « Design%20sans%20titre%20%281%29.png ») et on remplace l'extension
// par .webp uniquement pour les fichiers réellement convertis.
const convertedLower = new Set(converted.map((c) => c.oldName.toLowerCase()));
const IMG_REF = /\/images\/([^\s"')]+?)\.(gif|png|jpe?g)/gi;

let filesTouched = 0;
function walk(dir) {
  let names;
  try { names = readdirSync(dir); } catch { return; }
  for (const name of names) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { walk(p); continue; }
    if (!TEXT_EXT.has(extname(name).toLowerCase())) continue;

    const text = readFileSync(p, 'utf8');
    const next = text.replace(IMG_REF, (match, rawName, ext) => {
      let decoded;
      try { decoded = decodeURIComponent(rawName); } catch { decoded = rawName; }
      const oldFile = `${decoded}.${ext}`.toLowerCase();
      return convertedLower.has(oldFile) ? `/images/${rawName}.webp` : match;
    });
    if (next !== text) { writeFileSync(p, next); filesTouched++; }
  }
}
for (const root of CONTENT_ROOTS) walk(root);

console.log(`${converted.length} image(s) convertie(s), ${filesTouched} fichier(s) de contenu mis à jour.`);
