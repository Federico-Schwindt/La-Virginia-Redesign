#!/usr/bin/env node
/**
 * Sincroniza el catálogo real de té y café de La Virginia desde la Store API pública
 * de WooCommerce de lavirginia.com.ar → src/data/products.json + imágenes optimizadas.
 *
 *   NODE_USE_ENV_PROXY=1 npm run sync   (la variable de proxy solo hace falta detrás de un proxy)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const API = 'https://www.lavirginia.com.ar/wp-json/wc/store/v1';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'src/data/products.json');
const IMG = path.join(ROOT, 'public/img/productos');
const UA = 'Mozilla/5.0 (compatible; lv-redesign-sync/1.0)';
const BRAND_CATEGORY = 69; // "La Virginia"
const CAFE = 89;
const TE = 90;

const get = async (u) => {
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${r.status} ${u}`);
  return r.json();
};
const decode = (s = '') =>
  s
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8220;|&ldquo;/g, '“')
    .replace(/&#8221;|&rdquo;/g, '”')
    .replace(/&#038;|&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
const paragraphs = (h = '') =>
  decode(h)
    .split(/<\/p>|<br\s*\/?>/i)
    .map((p) => p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 2);
const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// Orden y nombres de las líneas
const LINES = {
  'te-negro': { line: 'te', label: 'Té negro', order: 1 },
  'virgin-islands-te-negro': { line: 'te', label: 'Virgin Islands', order: 2 },
  'te-verde': { line: 'te', label: 'Té verde', order: 3 },
  saborizados: { line: 'te', label: 'Saborizados', order: 4 },
  especiales: { line: 'te', label: 'Especiales', order: 5 },
  herboristeria: { line: 'te', label: 'Herboristería', order: 6 },
  'herboristeria-la-virginia-equilibrio': { line: 'te', label: 'Equilibrio', order: 7 },
  'cafe-tostado': { line: 'cafe', label: 'Tostado', order: 1 },
  'cafe-torrado': { line: 'cafe', label: 'Torrado', order: 2 },
  'cafe-en-granos': { line: 'cafe', label: 'En granos', order: 3 },
  capsulas: { line: 'cafe', label: 'Cápsulas', order: 4 },
  'cafe-en-saquitos': { line: 'cafe', label: 'En saquitos', order: 5 },
  'cafe-instantaneo': { line: 'cafe', label: 'Instantáneo', order: 6 },
  mixes: { line: 'cafe', label: 'Mixes', order: 7 },
  filtros: { line: 'cafe', label: 'Accesorios', order: 8 },
};

/** Ficha sensorial de la página del producto: Color, Sabor, Aroma e Intensidad (íconos llenos / total). */
async function specs(permalink) {
  try {
    const h = await (await fetch(permalink, { headers: { 'User-Agent': UA } })).text();
    const m = h.match(/<div\s+id=["']?spec["']?>([\s\S]*?)<\/ul>/i);
    if (!m) return { notes: [], intensity: null };
    const notes = [];
    let intensity = null;
    for (const li of m[1].split(/<li/i).slice(1)) {
      const k = (li.match(/<strong>([^<:]+):?<\/strong>/i) || [])[1]?.trim();
      if (!k) continue;
      const icons = li.match(/<img[^>]+src=["']?[^"' >]+_0(\d)\.svg/gi) || [];
      if (icons.length) {
        const full = icons.filter((i) => /_01\.svg/i.test(i)).length;
        intensity = { label: decode(k), value: full, max: icons.length };
        continue;
      }
      const v = decode(li.replace(/^[^>]*>/, '').replace(/<strong>[\s\S]*?<\/strong>/i, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
      if (v) notes.push({ k: decode(k), v });
    }
    return { notes, intensity };
  } catch {
    return { notes: [], intensity: null };
  }
}

async function main() {
  const all = await get(`${API}/products?category=${BRAND_CATEGORY}&per_page=100`);
  const specMap = new Map();
  for (let i = 0; i < all.length; i += 6) {
    const chunk = all.slice(i, i + 6);
    const res = await Promise.all(chunk.map((p) => specs(p.permalink)));
    chunk.forEach((p, k) => specMap.set(p.id, res[k]));
  }
  await fs.mkdir(IMG, { recursive: true });
  const seen = new Set();
  const out = [];
  for (const p of all) {
    const sub = p.categories.find((c) => LINES[c.slug]);
    if (!sub) continue;
    const meta = LINES[sub.slug];
    const full = decode(p.name).replace(/\s+/g, ' ').trim();
    const name = full.replace(/^La Virginia\s*[–-]\s*/i, '').replace(/^Herboristería( Equilibrio)?\s*[–-]\s*/i, '').trim();
    let slug = slugify(full.replace(/^La Virginia\s*[–-]\s*/i, ''));
    while (seen.has(slug)) slug += '-2';
    seen.add(slug);
    const attr = Object.fromEntries(p.attributes.map((a) => [a.name, a.terms.map((t) => decode(t.name))]));

    let image = null;
    const src = p.images?.[0]?.src;
    if (src) {
      const target = path.join(IMG, `${slug}-800.webp`);
      try {
        await fs.access(target);
      } catch {
        const buf = Buffer.from(await (await fetch(src, { headers: { 'User-Agent': UA } })).arrayBuffer());
        const trimmed = await sharp(buf).flatten({ background: '#ffffff' }).trim({ threshold: 12 }).toBuffer();
        const square = (s) =>
          sharp(trimmed).resize(s, s, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).extend({ top: 0, bottom: 0, left: 0, right: 0 });
        await square(800).webp({ quality: 80, effort: 6 }).toFile(target);
        await square(420).webp({ quality: 78, effort: 6 }).toFile(path.join(IMG, `${slug}-420.webp`));
      }
      image = slug;
    }

    out.push({
      id: p.id,
      slug,
      name,
      fullName: full,
      brand: /^Virgin Islands/i.test(full) ? 'Virgin Islands' : 'La Virginia',
      line: meta.line,
      category: meta.label,
      categoryOrder: meta.order,
      description: paragraphs(p.short_description || p.description),
      claims: attr['Elaboración'] || [],
      notes: specMap.get(p.id)?.notes || [],
      intensity: specMap.get(p.id)?.intensity || null,
      sizes: attr['Presentaciones'] || [],
      image,
      source: p.permalink,
    });
    process.stdout.write('.');
  }
  out.sort((a, b) => (a.line === b.line ? a.categoryOrder - b.categoryOrder || a.name.localeCompare(b.name, 'es') : a.line === 'te' ? -1 : 1));
  await fs.writeFile(OUT, JSON.stringify(out, null, 1));
  console.log(`\n${out.length} productos → ${path.relative(ROOT, OUT)}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
