#!/usr/bin/env node
// Construye la versión que se abre y se comparte de cada página de diseño.
//
//   node scripts/build.mjs                      todas las *.src.html de esta carpeta
//   node scripts/build.mjs lenguaje-de-diseno   solo esa
//
// Lee <nombre>.src.html (la que se edita, con rutas relativas a assets/)
// y escribe <nombre>.html con cada imagen embebida, para que se vea igual
// abierta desde el panel de archivos, un correo, un adjunto o un artifact.
//
// Falla (código 1, sin escribir nada) si una imagen no existe, si una
// imagen apunta a internet, o si queda alguna ruta local sin embeber.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif' };

const wanted = process.argv.slice(2).map((n) => n.replace(/(\.src)?\.html$/, ''));
const sources = readdirSync(root)
  .filter((f) => f.endsWith('.src.html'))
  .filter((f) => !wanted.length || wanted.includes(f.replace(/\.src\.html$/, '')));

if (!sources.length) {
  console.error('No hay archivos .src.html que construir' + (wanted.length ? ` con el nombre ${wanted.join(', ')}` : '') + '.');
  process.exit(1);
}

let failed = false;

for (const src of sources) {
  const html = readFileSync(join(root, src), 'utf8');
  const problems = [];
  const cache = new Map();

  const toData = (ref, where) => {
    if (/^data:/.test(ref)) return ref;
    if (/^(https?:)?\/\//.test(ref)) { problems.push(`${where}: imagen remota (${ref}); descárgala a assets/img`); return ref; }
    const clean = ref.split(/[?#]/)[0];
    const file = resolve(root, clean);
    if (!existsSync(file)) { problems.push(`${where}: no existe ${clean}`); return ref; }
    const type = MIME[extname(file).toLowerCase()];
    if (!type) { problems.push(`${where}: tipo no soportado ${clean}`); return ref; }
    if (!cache.has(file)) cache.set(file, `data:${type};base64,${readFileSync(file).toString('base64')}`);
    return cache.get(file);
  };

  let out = html
    // <img src="..."> y <source src="...">
    .replace(/(<(?:img|source)\b[^>]*?\ssrc=")([^"]+)(")/g, (_, a, ref, b) => a + toData(ref, '<img src>') + b)
    // srcset: se reduce a una sola imagen embebida (la primera)
    .replace(/\s(srcset|sizes)="[^"]*"/g, '')
    // url(...) en CSS
    .replace(/url\((['"]?)(?!data:|#)([^'")]+\.(?:jpe?g|png|webp|svg|gif)(?:[?#][^'")]*)?)\1\)/gi,
      (_, q, ref) => `url(${q}${toData(ref, 'css url()')}${q})`);

  const leftover = [...out.matchAll(/(?:src="|url\(['"]?)((?!data:|https?:|#)[^"')]+\.(?:jpe?g|png|webp|svg|gif))/gi)].map((m) => m[1]);
  for (const l of leftover) problems.push(`quedó sin embeber: ${l}`);

  if (problems.length) {
    failed = true;
    console.error(`✗ ${src}: ${problems.length} problema(s), no se escribió nada`);
    for (const p of [...new Set(problems)]) console.error('   - ' + p);
    continue;
  }

  out = out.replace(/<!doctype html>/i, (m) => `${m}\n<!-- Generado por scripts/build.mjs desde ${src}. No editar aquí: edita ${src} y vuelve a construir. -->`);
  const dest = join(root, src.replace(/\.src\.html$/, '.html'));
  writeFileSync(dest, out);
  const kb = (statSync(dest).size / 1024).toFixed(0);
  console.log(`✓ ${basename(dest)}: ${cache.size} imágenes distintas embebidas, ${kb} KB`);
}

process.exit(failed ? 1 : 0);
