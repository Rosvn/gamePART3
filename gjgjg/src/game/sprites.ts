import { ITEM_BY_ID, HAIR_COLORS, type Look } from './items';
import type { KenLook } from './kens';

export type Dir = 'down' | 'up' | 'left' | 'right';
type Ctx = CanvasRenderingContext2D;
type RFn = (x: number, y: number, w: number, h: number, col: string) => void;

const SK = '#ecbc98';
const SKS = '#d29d7a';
const mk = (c: Ctx): RFn => (x, y, w, h, col) => {
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
};

export function shade(hex: string, f: number): string {
  if (hex.length < 7) return hex;
  const n = parseInt(hex.slice(1, 7), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (f < 1) { r *= f; g *= f; b *= f; } else { const k = f - 1; r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
const clear = (col: string) => col.length > 7 && col.endsWith('00');

function tex(R: RFn, x: number, y: number, w: number, h: number, col: string, mod = 5) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (((x + i) * 7 + (y + j) * 3) % mod === 0) R(x + i, y + j, 1, 1, col);
}

type HC = { m: string; s: string; h: string };

/* ------------------------------------------------------------------ BARBIE HAIR */
function hairBack(R: RFn, style: string, v: string, k: HC) {
  const { m, s } = k;
  switch (style) {
    case 'afro':
      if (v === 's') { R(4, 0, 7, 1, m); R(3, 1, 9, 9, m); R(2, 3, 1, 5, m); } else { R(5, 0, 6, 1, m); R(3, 1, 10, 1, m); R(2, 2, 12, 7, m); R(3, 9, 10, 1, m); }
      tex(R, 2, 1, 12, 9, s, 4); break;
    case 'longcurls':
      if (v === 's') R(3, 3, 6, 14, m); else R(3, 2, 10, 15, m);
      tex(R, 3, 3, 10, 14, s, 4); break;
    case 'waves':
      if (v === 's') R(3, 3, 6, 16, m); else R(2, 2, 12, 17, m);
      for (let y = 8; y < 19; y += 3) R(3, y, 10, 1, s); break;
    case 'straight':
      if (v === 's') R(4, 3, 4, 14, m); else R(4, 2, 8, 16, m); break;
    case 'braids':
      if (v === 's') { R(3, 6, 2, 1, m); for (let y = 6; y < 18; y++) R(3, y, 2, 1, y % 2 ? m : s); R(3, 18, 2, 1, '#ff8ab5'); } else R(4, 2, 8, 6, m); break;
    case 'ponytail':
      if (v === 's') { R(2, 1, 4, 3, m); R(1, 3, 3, 6, m); R(2, 9, 3, 5, m); R(2, 12, 2, 2, s); }
      else if (v === 'f') { R(10, 2, 3, 2, m); R(11, 4, 2, 7, m); R(10, 10, 2, 2, s); } break;
    case 'bob':
      if (v === 's') R(3, 3, 6, 8, m); else R(3, 3, 10, 8, m); break;
    default: break;
  }
}

function capF(R: RFn, k: HC) { R(4, 2, 8, 3, k.m); R(4, 5, 1, 2, k.m); R(11, 5, 1, 2, k.m); R(6, 2, 2, 1, k.h); }
function capB(R: RFn, k: HC) { R(4, 2, 8, 7, k.m); R(6, 3, 2, 1, k.h); }
function capS(R: RFn, k: HC) { R(4, 2, 7, 3, k.m); R(4, 5, 3, 4, k.m); R(9, 5, 1, 1, k.m); R(5, 2, 2, 1, k.h); }

function hairFront(R: RFn, style: string, v: string, k: HC) {
  const { m, s, h } = k;
  const cap = () => (v === 'f' ? capF(R, k) : v === 'b' ? capB(R, k) : capS(R, k));
  switch (style) {
    case 'afro':
      if (v === 'f') { R(4, 2, 8, 2, m); R(4, 4, 1, 1, m); R(11, 4, 1, 1, m); tex(R, 4, 2, 8, 2, s, 3); }
      else if (v === 'b') { R(5, 0, 6, 1, m); R(3, 1, 10, 1, m); R(2, 2, 12, 8, m); R(3, 10, 10, 1, m); tex(R, 2, 1, 12, 10, s, 4); }
      else { R(4, 1, 7, 3, m); R(4, 4, 3, 5, m); tex(R, 4, 1, 7, 8, s, 4); }
      break;
    case 'longcurls':
      cap();
      if (v === 'f') { R(3, 6, 2, 11, m); R(11, 6, 2, 11, m); tex(R, 3, 6, 2, 11, s, 4); tex(R, 11, 6, 2, 11, s, 4); }
      else if (v === 'b') { R(3, 2, 10, 16, m); tex(R, 3, 3, 10, 14, s, 4); R(5, 4, 1, 8, h); }
      else { R(4, 6, 3, 10, m); tex(R, 4, 6, 3, 10, s, 4); }
      break;
    case 'waves':
      cap();
      if (v === 'f') { for (let y = 6; y < 19; y++) { R(3 + ((y >> 1) & 1), y, 2, 1, m); R(11 - ((y >> 1) & 1), y, 2, 1, m); } R(4, 7, 1, 1, h); R(11, 9, 1, 1, h); }
      else if (v === 'b') { R(2, 2, 12, 17, m); for (let y = 6; y < 19; y += 3) R(3 + (y % 2), y, 9, 1, h); }
      else { R(4, 6, 3, 12, m); R(4, 8, 1, 1, h); R(5, 12, 1, 1, h); }
      break;
    case 'straight':
      cap();
      if (v === 'f') { R(4, 6, 1, 11, m); R(11, 6, 1, 11, m); R(5, 3, 1, 1, h); }
      else if (v === 'b') { R(4, 2, 8, 16, m); R(7, 4, 1, 10, h); }
      else R(4, 6, 2, 10, m);
      break;
    case 'braids':
      cap();
      if (v === 'f') { for (let y = 8; y < 18; y++) { R(3, y, 2, 1, y % 2 ? m : s); R(11, y, 2, 1, y % 2 ? m : s); } R(3, 18, 2, 1, '#ff8ab5'); R(11, 18, 2, 1, '#ff8ab5'); }
      else if (v === 'b') { for (let y = 9; y < 18; y++) { R(5, y, 2, 1, y % 2 ? m : s); R(9, y, 2, 1, y % 2 ? m : s); } R(5, 18, 2, 1, '#ff8ab5'); R(9, 18, 2, 1, '#ff8ab5'); }
      break;
    case 'ponytail':
      cap();
      if (v === 'f') { R(6, 0, 4, 2, m); R(7, 2, 2, 1, '#ff6aa8'); R(7, 0, 1, 1, h); }
      else if (v === 'b') { R(6, 1, 4, 3, m); R(7, 3, 2, 1, '#ff6aa8'); R(6, 4, 4, 11, m); R(7, 15, 2, 2, s); R(7, 5, 1, 7, h); }
      else { R(5, 1, 3, 1, m); R(5, 2, 1, 1, '#ff6aa8'); }
      break;
    case 'pixie':
      if (v === 'f') { R(4, 2, 8, 2, m); R(4, 4, 5, 1, m); R(4, 5, 1, 2, m); R(11, 5, 1, 1, m); R(6, 1, 2, 1, m); R(9, 1, 1, 1, m); R(5, 2, 1, 1, h); }
      else if (v === 'b') { R(4, 1, 8, 7, m); R(6, 0, 2, 1, m); R(9, 0, 1, 1, m); R(6, 3, 1, 1, h); }
      else { R(4, 1, 7, 3, m); R(4, 4, 3, 3, m); R(9, 3, 2, 1, m); R(6, 0, 2, 1, m); }
      break;
    case 'bob':
      cap();
      if (v === 'f') { R(3, 5, 2, 6, m); R(11, 5, 2, 6, m); }
      else if (v === 'b') { R(3, 2, 10, 9, m); R(5, 4, 1, 3, h); }
      else R(4, 5, 3, 6, m);
      break;
    case 'buns':
      cap();
      if (v === 's') { R(3, 0, 4, 3, m); R(3, 1, 1, 1, h); }
      else { R(2, 0, 4, 3, m); R(10, 0, 4, 3, m); R(3, 0, 1, 1, h); R(11, 0, 1, 1, h); R(5, 2, 1, 1, '#ff6aa8'); R(10, 2, 1, 1, '#ff6aa8'); }
      break;
    case 'topbun':
      cap();
      if (v === 's') { R(4, 0, 4, 3, m); R(4, 2, 4, 1, '#ff6aa8'); }
      else { R(6, 0, 4, 3, m); R(6, 2, 4, 1, '#ff6aa8'); R(7, 0, 1, 1, h); }
      break;
    default: cap();
  }
}

/* ------------------------------------------------------------------ SHOES */
function drawShoe(R: RFn, shape: string, cols: string[], x: number, y: number, ext: number, spark: boolean, t: number) {
  const [c0, c1] = cols;
  const sx = ext < 0 ? x - 1 : x;
  switch (shape) {
    case 'sneaker': R(sx, y, 3, 2, c0); R(sx, y + 1, 3, 1, c1); break;
    case 'heel': R(x, y, 2, 1, c0); R(x + (ext < 0 ? 0 : 1), y + 1, 1, 1, c1); R(x + (ext < 0 ? 1 : 0), y + 1, 1, 1, c0); break;
    case 'boot': R(x, y - 3, 2, 4, c0); R(sx, y + 1, 3, 1, c1); R(x, y - 3, 2, 1, c1); break;
    case 'slipper': R(x, y + 1, 2, 1, c0); R(x, y, 1, 1, c1); break;
    case 'sandal': R(x, y + 1, 2, 1, c0); R(x, y, 1, 1, c1); break;
    case 'flip': R(x, y + 1, 2, 1, c0); R(x + (ext < 0 ? 1 : 0), y, 1, 1, c1); break;
    case 'wedge': R(sx, y, 3, 1, c0); R(sx, y + 1, 3, 1, c1); break;
    case 'thigh': R(x, y - 6, 2, 7, c0); R(x, y - 6, 2, 1, c1); R(sx, y + 1, 3, 1, c1); break;
    default: R(x, y, 2, 2, c0);
  }
  if (spark && Math.floor(t / 200 + x) % 3 === 0) R(x, y + 1, 1, 1, '#ffffff');
}

/* ------------------------------------------------------------------ BARBIE OUTFITS */
const SLEEVE: Record<string, string> = { casual: 'long', pantsuit: 'long', blazer: 'long', rash: 'short' };
const LEGCOL: Record<string, number> = { casual: 1, jumpsuit: 0, pantsuit: 0 };

function drawOutfit(R: RFn, shape: string, a: string, b: string, v: string, sp: boolean, t: number) {
  const TX = v === 's' ? 6 : 5;
  const TW = v === 's' ? 4 : 6;
  const E = (n: number) => (v === 's' ? Math.ceil(n / 2) : n);
  const sh = shade(a, 0.78);
  const front = v === 'f';
  const neckline = () => { if (front) R(6, 10, 4, 1, SK); else if (v === 's') R(8, 10, 2, 1, SK); };
  switch (shape) {
    case 'casual':
      R(TX, 10, TW, 5, a); R(TX, 14, TW, 1, sh); if (front) R(6, 10, 4, 1, shade(a, 0.7));
      R(TX, 15, TW, 1, '#26344a'); R(TX, 16, TW, 2, b); if (front) R(7, 16, 1, 2, shade(b, 0.8));
      break;
    case 'mini':
      R(TX, 10, TW, 6, a); neckline(); R(TX - E(1), 16, TW + 2 * E(1), 2, a); R(TX - E(2), 18, TW + 2 * E(2), 1, b); R(TX, 15, TW, 1, sh);
      break;
    case 'slip':
      R(TX, 10, TW, 6, a); neckline(); R(TX - E(1), 16, TW + 2 * E(1), 5, a); R(TX - E(1), 20, TW + 2 * E(1), 1, b); if (front) R(TX + 1, 16, 1, 4, shade(a, 1.25));
      break;
    case 'gown':
      R(TX, 10, TW, 6, a); neckline();
      for (let y = 16; y < 24; y++) { const ex = E(1 + (y >= 19 ? 1 : 0) + (y >= 22 ? 1 : 0)); R(TX - ex, y, TW + 2 * ex, 1, a); }
      R(TX - E(2), 23, TW + 2 * E(2), 1, b); if (front) R(TX + TW - 2, 17, 1, 6, shade(a, 0.78));
      break;
    case 'ball':
      R(TX, 10, TW, 5, a); neckline(); R(TX, 15, TW, 1, b);
      for (let y = 16; y < 24; y++) { const ex = E(1 + Math.floor((y - 16) * 0.6)); R(TX - ex, y, TW + 2 * ex, 1, y % 3 === 0 ? shade(a, 0.88) : a); }
      R(TX - E(5), 23, TW + 2 * E(5), 1, b); if (front) R(7, 16, 1, 7, shade(a, 1.2));
      break;
    case 'cape':
      R(TX, 10, TW, 6, a); neckline();
      for (let y = 16; y < 24; y++) { const ex = E(1 + (y >= 19 ? 1 : 0) + (y >= 22 ? 1 : 0)); R(TX - ex, y, TW + 2 * ex, 1, a); }
      R(TX - E(1), 10, TW + 2 * E(1), 2, b); if (front) { R(TX - 1, 12, 1, 11, b); R(TX + TW, 12, 1, 11, b); R(7, 12, 2, 1, b); }
      break;
    case 'jumpsuit':
      R(TX, 10, TW, 6, a); neckline(); R(TX, 15, TW, 1, b); R(TX, 16, TW, 2, a);
      break;
    case 'pantsuit':
      R(TX, 10, TW, 6, a); R(TX, 16, TW, 2, a);
      if (front) { R(7, 10, 2, 3, b); R(6, 10, 1, 3, shade(a, 1.4)); R(9, 10, 1, 3, shade(a, 1.4)); R(7, 13, 1, 1, '#f2b630'); R(7, 15, 1, 1, '#f2b630'); }
      break;
    case 'bikini':
      if (v === 's') { R(TX, 11, TW, 2, a); } else { R(TX, 11, 2, 2, a); R(TX + TW - 2, 11, 2, 2, a); R(TX + 2, 12, 2, 1, b); R(TX + 1, 10, 1, 1, a); R(TX + TW - 2, 10, 1, 1, a); }
      R(TX, 15, TW, 2, a); if (v !== 's') { R(TX - 1, 15, 1, 1, b); R(TX + TW, 15, 1, 1, b); }
      break;
    case 'mono':
      R(TX, 10, TW, 5, a); R(TX, 15, TW, 1, b); R(TX + 1, 16, TW - 2, 1, a); if (front) { R(7, 12, 2, 2, SK); R(TX, 10, 1, 1, b); R(TX + TW - 1, 10, 1, 1, b); } neckline();
      break;
    case 'wrap':
      if (v === 's') R(TX, 11, TW, 2, a); else { R(TX, 11, 2, 2, a); R(TX + TW - 2, 11, 2, 2, a); R(TX + 1, 10, 1, 1, a); R(TX + TW - 2, 10, 1, 1, a); }
      R(TX, 15, TW, 1, a); R(TX - E(1), 15, TW + 2 * E(1), 5, b); R(TX - E(1), 15, TW + 2 * E(1), 1, shade(b, 0.8)); if (front) { R(TX + TW, 15, 2, 2, a); R(TX + 1, 17, 1, 3, shade(b, 1.2)); }
      break;
    case 'bodysuit':
      R(TX, 10, TW, 7, a); neckline(); if (front) R(TX + 1, 11, 1, 3, b); R(TX, 16, TW, 1, shade(a, 0.85));
      break;
    case 'rash':
      R(TX, 10, TW, 6, a); R(TX, 13, TW, 1, b); neckline(); R(TX, 16, TW, 3, b); R(TX, 16, TW, 1, shade(b, 0.8));
      break;
    case 'stripe':
      R(TX, 10, TW, 6, a); for (const y of [11, 13, 15]) R(TX, y, TW, 1, b); neckline(); R(TX, 16, TW, 1, b);
      break;
    case 'blazer':
      R(TX, 10, TW, 6, a); R(TX, 16, TW, 4, a); R(TX, 19, TW, 1, b);
      if (front) { R(7, 10, 2, 2, b); R(7, 12, 1, 1, '#8a6a3a'); R(7, 14, 1, 1, '#8a6a3a'); }
      break;
    default: R(TX, 10, TW, 6, a);
  }
  if (sp) {
    const k = Math.floor(t / 170);
    for (let i = 0; i < 7; i++) {
      const px = TX + ((i * 5 + ((k + i) % 3)) % TW);
      const py = 10 + ((i * 3 + k) % 10);
      R(px, py, 1, 1, i % 2 ? '#ffffff' : b);
    }
  }
}

/* ------------------------------------------------------------------ BARBIE */
export function drawBarbie(c: Ctx, fx: number, fy: number, dir: Dir, frame: number, look: Look, t = 0) {
  const ox = Math.round(fx - 8);
  const oy = Math.round(fy - 24);
  c.save();
  if (dir === 'left') { c.translate(ox + 16, oy); c.scale(-1, 1); } else c.translate(ox, oy);
  const v = dir === 'down' ? 'f' : dir === 'up' ? 'b' : 's';
  const R = mk(c);
  const hc = HAIR_COLORS.find((h) => h.id === look.hairColor) || HAIR_COLORS[0];
  const out = ITEM_BY_ID[look.outfit];
  const shoe = ITEM_BY_ID[look.shoes];
  const shape = out?.shape || 'casual';
  const oa = out?.colors[0] || '#888';
  const ob = out?.colors[1] || '#aaa';
  const bob = frame === 1 || frame === 3 ? -1 : 0;

  hairBack(R, look.hair, v, hc);

  // legs
  const legs: { x: number; yo: number; back?: boolean }[] =
    v === 's'
      ? frame === 1 ? [{ x: 5, yo: 0, back: true }, { x: 9, yo: -1 }]
        : frame === 3 ? [{ x: 9, yo: 0, back: true }, { x: 5, yo: -1 }]
          : [{ x: 7, yo: 0, back: true }, { x: 7, yo: 0 }]
      : [{ x: 6, yo: frame === 1 ? -1 : 0 }, { x: 8, yo: frame === 3 ? -1 : 0 }];
  const lc = LEGCOL[shape];
  const legCol = lc === undefined ? SK : out.colors[lc];
  for (const lg of legs) {
    const col = lg.back ? (lc === undefined ? SKS : shade(legCol, 0.8)) : legCol;
    R(lg.x, 16 + lg.yo, 2, 7, col);
    if (lc !== undefined && v !== 's') { R(lg.x < 7 ? lg.x - 1 : lg.x + 1, 21 + lg.yo, 1, 2, col); }
  }
  for (const lg of legs) {
    const ext = v === 's' ? 1 : lg.x < 7 ? -1 : 1;
    drawShoe(R, shoe?.shape || 'sneaker', shoe?.colors || ['#fff', '#ccc'], lg.x, 22 + lg.yo, ext, !!shoe?.sparkle, t);
  }

  c.translate(0, bob);
  // torso + arms (skin)
  R(5, 9, 6, 1, SKS);
  if (v === 's') R(6, 10, 4, 6, SK); else R(5, 10, 6, 6, SK);
  const sleeve = SLEEVE[shape];
  const armCol = (row: number) => (sleeve === 'long' ? (row < 5 ? oa : SK) : sleeve === 'short' ? (row < 2 ? oa : SK) : SK);
  const swing = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const drawArm = (x: number, w: number, off: number) => { for (let r = 0; r < 6; r++) R(x, 10 + r + off, w, 1, armCol(r)); };

  if (v !== 's') { drawArm(4, 1, swing); drawArm(11, 1, -swing); }
  drawOutfit(R, shape, oa, ob, v, !!out?.sparkle, t);
  if (v === 's') drawArm(7 + (frame === 1 ? 1 : frame === 3 ? -1 : 0), 2, 0);

  // head
  R(7, 9, 2, 1, SKS);
  R(5, 3, 6, 6, SK); R(5, 8, 1, 1, SKS);
  const mk2 = ITEM_BY_ID[look.makeup];
  const [lip, shadow, blush] = mk2?.colors || ['#e07a86', '#00000000', '#00000000'];
  if (v === 'f') {
    if (!clear(shadow)) { R(5, 5, 2, 1, shadow); R(9, 5, 2, 1, shadow); if (look.makeup === 'smokey' || look.makeup === 'glitter') { R(6, 7, 1, 1, shadow); R(9, 7, 1, 1, shadow); } }
    R(6, 6, 1, 1, '#2f4a96'); R(9, 6, 1, 1, '#2f4a96'); R(5, 6, 1, 1, '#3a2a2a'); R(10, 6, 1, 1, '#3a2a2a');
    if (!clear(blush)) { R(5, 7, 1, 1, blush); R(10, 7, 1, 1, blush); }
    R(7, 8, 2, 1, lip);
    if (look.makeup === 'glitter' && Math.floor(t / 200) % 2) R(6, 4, 1, 1, '#ffffff');
  } else if (v === 's') {
    if (!clear(shadow)) R(8, 5, 2, 1, shadow);
    R(9, 6, 1, 1, '#2f4a96'); R(10, 6, 1, 1, '#3a2a2a'); R(10, 7, 1, 1, SKS);
    if (!clear(blush)) R(8, 7, 1, 1, blush);
    R(10, 8, 1, 1, lip);
  }
  hairFront(R, look.hair, v, hc);

  // jewellery & accessories
  const eyes = look.eyes ? ITEM_BY_ID[look.eyes] : null;
  if (eyes && v !== 'b') {
    const [e0, e1] = eyes.colors;
    if (eyes.id === 'cateye') {
      if (v === 'f') { R(4, 5, 3, 2, e0); R(9, 5, 3, 2, e0); R(6, 6, 1, 1, '#bfe0ff'); R(9, 6, 1, 1, '#bfe0ff'); R(7, 6, 2, 1, e0); R(4, 4, 1, 1, e0); R(11, 4, 1, 1, e0); }
      else { R(8, 5, 3, 2, e0); R(9, 6, 1, 1, '#bfe0ff'); R(5, 5, 3, 1, e0); R(10, 4, 1, 1, e0); }
    } else if (v === 'f') { R(5, 5, 2, 2, e0); R(9, 5, 2, 2, e0); R(7, 5, 2, 1, e1); R(5, 5, 1, 1, e1 === '#f2b630' ? '#8a8aa8' : e1); R(9, 5, 1, 1, '#8a8aa8'); }
    else { R(8, 5, 3, 2, e0); R(5, 5, 3, 1, e1); R(8, 5, 1, 1, '#8a8aa8'); }
  }
  const neck = look.neck ? ITEM_BY_ID[look.neck] : null;
  if (neck) {
    const [n0, n1] = neck.colors;
    if (v === 'b') R(6, 9, 4, 1, n1);
    else if (neck.id === 'pearl') { R(6, 9, 4, 1, n0); R(7, 9, 1, 1, n1); R(9, 9, 1, 1, n1); }
    else if (v === 's') { R(8, 10, 2, 1, neck.id === 'chain' ? n0 : n1); R(9, 11, 1, 1, n0); }
    else {
      const vc = neck.id === 'chain' ? n0 : n1;
      R(6, 10, 1, 1, vc); R(7, 11, 2, 1, vc); R(9, 10, 1, 1, vc);
      if (neck.id !== 'chain') { R(7, 12, 2, 1, n0); if (Math.floor(t / 250) % 3 === 0) R(8, 12, 1, 1, '#ffffff'); }
    }
  }
  const ears = look.ears ? ITEM_BY_ID[look.ears] : null;
  if (ears) {
    const [e0, e1] = ears.colors;
    const xs = v === 's' ? [7] : [4, 11];
    for (const ex of xs) {
      if (ears.id === 'hoops') R(ex, 7, 1, 3, e0);
      else if (ears.id === 'studs') R(ex, 7, 1, 1, e0);
      else if (ears.id === 'pearldrops') { R(ex, 7, 1, 1, e1); R(ex, 8, 1, 1, e0); R(ex, 9, 1, 1, e0); }
      else { R(ex, 7, 1, 3, e0); R(ex, 10, 1, 1, e1); if (Math.floor(t / 200) % 2) R(ex, 8, 1, 1, '#ffffff'); }
    }
  }
  const head = look.head ? ITEM_BY_ID[look.head] : null;
  if (head) {
    const [h0, h1] = head.colors;
    switch (head.id) {
      case 'crown': R(5, 2, 6, 1, h0); R(5, 1, 1, 1, h0); R(7, 0, 2, 2, h0); R(10, 1, 1, 1, h0); R(6, 2, 1, 1, h1); R(9, 2, 1, 1, h1); R(7, 2, 2, 1, '#ffffff'); break;
      case 'tiara': R(5, 2, 6, 1, h0); R(6, 1, 4, 1, h0); R(7, 0, 2, 2, h1); R(7, 0, 1, 1, '#ffffff'); break;
      case 'flowers': R(5, 2, 1, 1, '#58b858'); R(7, 2, 1, 1, '#58b858'); R(9, 2, 1, 1, '#58b858'); R(4, 2, 1, 1, h0); R(6, 1, 1, 2, h1); R(8, 2, 1, 1, h0); R(10, 1, 1, 2, h1); R(11, 2, 1, 1, h0); break;
      case 'bow': R(5, 2, 6, 1, h0); R(9, 0, 3, 3, h0); R(10, 1, 1, 1, h1); R(9, 0, 1, 1, h1); break;
      default: { const g = 0.5 + 0.5 * Math.sin(t / 300); R(4, -1, 1, 1, h0); R(5, -2, 6, 1, h0); R(11, -1, 1, 1, h0); R(5, 0, 6, 1, h1 === '#ffffff' ? h0 : h1); c.globalAlpha = 0.35 * g; R(3, -3, 10, 5, '#fff6a0'); c.globalAlpha = 1; }
    }
  }
  const hand = look.hand ? ITEM_BY_ID[look.hand] : null;
  if (hand) {
    const [p0, p1] = hand.colors;
    const hx = v === 'f' ? 11 : v === 'b' ? 2 : 9;
    switch (hand.id) {
      case 'clutch': R(hx, 14, 3, 2, p0); R(hx + 1, 14, 1, 1, p1); break;
      case 'tote': R(hx, 15, 4, 5, p0); R(hx, 15, 4, 1, p1); R(hx + 1, 13, 1, 2, p1); R(hx + 2, 13, 1, 2, p1); break;
      case 'fan': R(hx + 1, 12, 2, 4, p0); R(hx, 10, 4, 3, p1); R(hx + 1, 10, 2, 1, p0); break;
      default: R(hx, 13, 3, 4, p0); R(hx, 13, 1, 4, p1); R(hx + 1, 14, 1, 1, p1);
    }
  }
  c.restore();
}

/* ------------------------------------------------------------------ KEN */
function kenHairBack(R: RFn, style: string, v: string, col: string) {
  const m = col;
  if (style === 'long') { if (v === 's') R(3, 3, 6, 10, m); else R(3, 3, 10, 10, m); }
  if (style === 'wig') { if (v === 's') R(3, 2, 6, 8, m); else R(2, 2, 12, 8, m); }
}
function kenHairFront(R: RFn, style: string, v: string, col: string, t: number) {
  const m = col, s = shade(col, 0.7), h = shade(col, 1.35);
  const cap = (top = 2) => {
    if (v === 'f') { R(4, top, 8, 5 - top, m); R(4, 5, 1, 2, m); R(11, 5, 1, 2, m); }
    else if (v === 'b') R(4, top, 8, 9 - top, m);
    else { R(4, top, 7, 5 - top, m); R(4, 5, 3, 3, m); }
  };
  switch (style) {
    case 'short': cap(); R(6, 2, 2, 1, h); break;
    case 'slick': if (v === 'f') { R(5, 2, 6, 2, m); R(4, 3, 1, 3, m); R(11, 3, 1, 3, m); R(6, 2, 3, 1, h); } else cap(); break;
    case 'spiky': cap(); R(5, 0, 1, 2, m); R(7, 0, 1, 2, m); R(9, 0, 1, 2, m); R(6, 1, 1, 1, h); R(10, 1, 1, 1, m); break;
    case 'long': cap(); if (v === 'f') { R(3, 5, 2, 8, m); R(11, 5, 2, 8, m); } else if (v === 'b') R(3, 2, 10, 11, m); else R(4, 5, 3, 8, m); break;
    case 'beanie': if (v === 's') { R(4, 1, 7, 4, m); R(4, 4, 7, 1, s); } else { R(4, 1, 8, 4, m); R(4, 4, 8, 1, s); } R(7, 0, 2, 1, h); if (v === 'b') R(4, 5, 8, 3, '#4a3020'); break;
    case 'beret': R(3, 1, v === 's' ? 8 : 9, 3, m); R(7, 0, 1, 1, m); R(4, 4, 8, 1, '#2a1a10'); R(5, 1, 2, 1, h); if (v === 'b') R(4, 4, 8, 4, '#2a1a10'); break;
    case 'toque': R(5, -1, 6, 1, '#fcfcfc'); R(4, 0, 8, 2, '#fcfcfc'); R(4, 2, 8, 2, '#e8e8f0'); R(6, 0, 1, 2, '#d0d0dc'); R(9, 0, 1, 2, '#d0d0dc'); R(4, 4, 1, 2, '#3a2a1a'); R(11, 4, 1, 2, '#3a2a1a'); if (v === 'b') R(4, 4, 8, 3, '#3a2a1a'); break;
    case 'pilot': R(4, 1, v === 's' ? 7 : 8, 3, m); R(4, 4, 8, 1, s); if (v === 'f') R(7, 2, 2, 1, '#f2c030'); if (v === 's') R(9, 4, 3, 1, s); if (v === 'b') R(4, 4, 8, 4, m); break;
    case 'bowl': if (v === 'f') { R(4, 2, 8, 3, m); R(4, 5, 2, 3, m); R(10, 5, 2, 3, m); R(7, 2, 1, 3, h); } else if (v === 'b') { R(4, 2, 8, 8, m); R(7, 3, 1, 4, h); } else { R(4, 2, 7, 3, m); R(4, 5, 3, 4, m); R(9, 3, 2, 2, m); } break;
    case 'crown': if (v === 'b') R(4, 2, 8, 7, m); else { R(4, 3, 8, 2, m); R(4, 5, 1, 2, m); R(11, 5, 1, 2, m); } R(5, 1, 6, 2, '#f2c030'); R(5, 0, 1, 1, '#f2c030'); R(7, 0, 2, 1, '#f2c030'); R(10, 0, 1, 1, '#f2c030'); R(7, 1, 2, 1, '#e0243c'); break;
    case 'wig':
      if (v === 'f') { R(3, 1, 10, 4, m); R(2, 4, 2, 4, m); R(12, 4, 2, 4, m); tex(R, 2, 1, 12, 7, s, 3); }
      else if (v === 'b') { R(2, 1, 12, 9, m); tex(R, 2, 1, 12, 9, s, 3); }
      else { R(3, 1, 8, 4, m); R(3, 5, 3, 5, m); tex(R, 3, 1, 8, 9, s, 3); }
      break;
    default: break;
  }
  void t;
}

export function drawKen(c: Ctx, fx: number, fy: number, dir: Dir, frame: number, k: KenLook, t = 0) {
  const ox = Math.round(fx - 8);
  const oy = Math.round(fy - 24);
  c.save();
  if (dir === 'left') { c.translate(ox + 16, oy); c.scale(-1, 1); } else c.translate(ox, oy);
  const v = dir === 'down' ? 'f' : dir === 'up' ? 'b' : 's';
  const R = mk(c);
  const skin = k.skin, skinS = k.skinShade;
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const { style, a, b = '#ffffff', c: tc = '#ffffff' } = k.top;
  const TX = v === 's' ? 5 : 4, TW = v === 's' ? 6 : 8;
  const accOf = (n: string) => k.acc.find((x) => x === n || x.startsWith(n + ':'));
  const accCol = (n: string) => (accOf(n) || '').split(':')[1] || '#ffffff';

  // back items
  const cape = accOf('cape');
  if (cape && v !== 'b') { const cc = accCol('cape'); if (v === 'f') { R(2, 10, 12, 13, cc); R(2, 10, 1, 13, shade(cc, 0.7)); R(13, 10, 1, 13, shade(cc, 0.7)); } else R(3, 10, 4, 12, cc); }
  kenHairBack(R, k.hair.style, v, k.hair.color);

  // legs
  const legs: { x: number; yo: number; back?: boolean }[] =
    v === 's'
      ? frame === 1 ? [{ x: 4, yo: 0, back: true }, { x: 8, yo: -1 }]
        : frame === 3 ? [{ x: 8, yo: 0, back: true }, { x: 4, yo: -1 }]
          : [{ x: 6, yo: 0, back: true }, { x: 6, yo: 0 }]
      : [{ x: 5, yo: frame === 1 ? -1 : 0 }, { x: 8, yo: frame === 3 ? -1 : 0 }];
  const pc = k.pants.color;
  for (const lg of legs) {
    const pcol = lg.back ? shade(pc, 0.8) : pc;
    const w = v === 's' ? 3 : 3;
    if (k.pants.style === 'shorts') { R(lg.x, 17 + lg.yo, w, 3, pcol); R(lg.x, 20 + lg.yo, w, 3, lg.back ? skinS : skin); }
    else R(lg.x, 17 + lg.yo, w, 6, pcol);
    if (v !== 's') R(lg.x < 7 ? lg.x : lg.x + 2, 17 + lg.yo, 1, 6, shade(pcol, 0.88));
    const sc = k.shoes;
    if (!clear(sc)) { R(lg.x - (v === 's' ? 0 : 0), 22 + lg.yo, v === 's' ? 4 : 3, 2, sc); R(lg.x, 23 + lg.yo, v === 's' ? 4 : 3, 1, shade(sc, 0.65)); }
    else R(lg.x, 23 + lg.yo, 3, 1, skinS);
  }

  c.translate(0, bob);
  // torso
  R(TX, 10, TW, 7, skin);
  const swing = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const sleeveType = ['tee', 'polo', 'apron'].includes(style) ? 'short' : ['tank', 'shirtless'].includes(style) ? 'none' : 'long';
  const armC = (row: number) => (sleeveType === 'long' ? (row < 6 ? a : skin) : sleeveType === 'short' ? (row < 3 ? a : skin) : skin);
  const arm = (x: number, w: number, off: number) => { for (let r = 0; r < 7; r++) R(x, 10 + r + off, w, 1, armC(r)); };
  if (v !== 's') { arm(3, 1, swing); arm(12, 1, -swing); }
  // top
  const f = v === 'f';
  switch (style) {
    case 'tee': R(TX, 10, TW, 6, a); if (f) R(6, 10, 4, 1, skin); break;
    case 'tank': R(TX + 1, 10, TW - 2, 6, a); if (f) R(6, 10, 4, 1, skin); break;
    case 'shirtless': if (f) { R(5, 12, 3, 1, skinS); R(8, 12, 3, 1, skinS); R(7, 14, 2, 1, skinS); R(7, 10, 2, 2, skinS); } break;
    case 'hoodie': R(TX, 10, TW, 6, a); R(5, 9, 6, 1, b); if (f) { R(6, 13, 4, 2, shade(a, 0.8)); R(7, 11, 1, 2, '#f0f0f0'); R(8, 11, 1, 2, '#f0f0f0'); } break;
    case 'apron': R(TX, 10, TW, 6, a); if (f) { R(5, 11, 6, 5, b); R(5, 10, 1, 1, b); R(10, 10, 1, 1, b); R(7, 13, 2, 1, shade(b, 1.3)); } else R(TX, 13, TW, 1, b); break;
    case 'polo': R(TX, 10, TW, 6, a); if (f) { R(6, 10, 1, 1, b); R(9, 10, 1, 1, b); R(7, 10, 2, 1, skin); R(7, 11, 1, 2, b); } break;
    case 'sweater': R(TX, 10, TW, 6, a); R(5, 9, 6, 1, a); if (f) R(5, 12, 6, 1, shade(a, 1.2)); break;
    case 'coat': R(TX, 10, TW, 11, a); if (f) { R(6, 12, 1, 1, b); R(9, 12, 1, 1, b); R(6, 14, 1, 1, b); R(9, 14, 1, 1, b); R(6, 16, 1, 1, b); R(9, 16, 1, 1, b); R(7, 10, 2, 11, shade(a, 0.9)); R(6, 10, 4, 1, b); } R(TX, 20, TW, 1, shade(a, 0.85)); break;
    case 'suit': R(TX, 10, TW, 7, a); if (f) { R(6, 10, 4, 5, b); R(7, 11, 2, 4, tc); R(5, 10, 1, 5, shade(a, 0.75)); R(10, 10, 1, 5, shade(a, 0.75)); R(7, 16, 2, 1, '#f2c030'); } break;
    case 'jacket': R(TX, 10, TW, 7, a); if (f) { R(6, 10, 4, 4, b); R(7, 10, 2, 7, shade(a, 0.7)); R(5, 10, 1, 3, shade(a, 1.3)); R(10, 10, 1, 3, shade(a, 1.3)); } if (a === '#fff0f8') { const kk = Math.floor(t / 160); for (let i = 0; i < 6; i++) R(TX + ((i * 3 + kk) % TW), 10 + ((i * 5 + kk) % 7), 1, 1, i % 2 ? '#ffffff' : '#ffc0e8'); } break;
    case 'uniform': R(TX, 10, TW, 7, a); if (f) { R(7, 10, 2, 3, '#f4f4f8'); R(7, 11, 2, 3, '#101828'); R(6, 12, 1, 1, b); R(9, 12, 1, 1, b); R(6, 14, 1, 1, b); R(9, 14, 1, 1, b); } R(3, 10, 2, 1, b); R(11, 10, 2, 1, b); R(TX, 16, TW, 1, b); break;
    case 'tech': {
      R(TX, 10, TW, 7, a);
      const glow = 0.6 + 0.4 * Math.sin(t / 220);
      c.globalAlpha = glow;
      if (f) { R(TX, 10, 1, 7, b); R(TX + TW - 1, 10, 1, 7, b); R(6, 12, 4, 1, b); R(7, 13, 1, 3, b); R(8, 11, 1, 1, tc); } else R(7, 11, 2, 5, b);
      R(3, 13, 1, 1, b); R(12, 13, 1, 1, b);
      c.globalAlpha = 1;
      break;
    }
    case 'royal': R(TX, 10, TW, 7, a); if (f) { for (let i = 0; i < 6; i++) { R(5 + i, 10 + i, 2, 1, b); } R(7, 11, 1, 1, tc); R(7, 13, 1, 1, tc); R(6, 10, 4, 1, tc); } R(3, 10, 2, 1, tc); R(11, 10, 2, 1, tc); break;
    default: R(TX, 10, TW, 6, a);
  }
  if (v === 's') {
    const ax = 7 + swing;
    for (let r = 0; r < 7; r++) R(ax, 10 + r, 3, 1, armC(r));
  }
  // belt / pants top
  if (!['coat'].includes(style)) R(TX, 16, TW, 1, shade(pc, 0.7));
  const swd = accOf('sweater');
  if (swd) { const sc = accCol('sweater'); if (f) { R(3, 10, 10, 1, sc); R(4, 11, 1, 2, sc); R(11, 11, 1, 2, sc); R(6, 11, 1, 3, sc); R(9, 11, 1, 3, sc); R(7, 10, 2, 1, shade(sc, 0.8)); } else R(TX, 10, TW, 1, sc); }
  const lei = accOf('sash');
  if (lei && f) { const lc = accCol('sash'); R(5, 10, 1, 1, lc); R(6, 11, 1, 1, '#ff5f8a'); R(7, 12, 2, 1, lc); R(9, 11, 1, 1, '#ff5f8a'); R(10, 10, 1, 1, lc); }

  // head
  R(7, 9, 2, 1, skinS);
  R(5, 3, 6, 6, skin); R(5, 8, 1, 1, skinS);
  const hairC = k.hair.color;
  if (f) {
    R(6, 6, 1, 1, '#1c1820'); R(9, 6, 1, 1, '#1c1820'); R(6, 5, 1, 1, shade(hairC.length < 7 || hairC === '#f8f8f8' ? '#3a2a1a' : hairC, 0.7)); R(9, 5, 1, 1, shade(hairC === '#f8f8f8' ? '#3a2a1a' : hairC, 0.7));
    R(7, 8, 2, 1, skinS);
    if (accOf('stubble')) { R(5, 8, 6, 1, 'rgba(0,0,0,0.25)'); R(5, 7, 1, 1, 'rgba(0,0,0,0.2)'); R(10, 7, 1, 1, 'rgba(0,0,0,0.2)'); }
    if (accOf('mustache')) R(6, 7, 4, 1, '#3a2a1a');
  } else if (v === 's') {
    R(9, 6, 1, 1, '#1c1820'); R(9, 5, 1, 1, '#3a2a1a'); R(10, 8, 1, 1, skinS); R(11, 6, 1, 1, skin);
    if (accOf('stubble')) R(8, 8, 3, 1, 'rgba(0,0,0,0.25)');
    if (accOf('mustache')) R(9, 7, 2, 1, '#3a2a1a');
  }
  kenHairFront(R, k.hair.style, v, k.hair.color, t);
  if (accOf('band')) R(4, 3, 8, 1, '#f4f4fc');
  if (accOf('headphones')) { R(4, 2, 8, 1, '#2a2a34'); R(3, 4, 2, 4, '#2a2a34'); R(11, 4, 2, 4, '#2a2a34'); R(3, 5, 1, 2, '#ff3fa8'); R(12, 5, 1, 2, '#ff3fa8'); }
  if (accOf('earring') && v !== 'b') R(v === 's' ? 7 : 4, 7, 1, 1, '#f2c030');
  if (v !== 'b') {
    if (accOf('glasses')) { if (f) { R(5, 5, 2, 1, '#2a2a30'); R(8, 5, 2, 1, '#2a2a30'); R(5, 7, 2, 1, '#2a2a30'); R(8, 7, 2, 1, '#2a2a30'); R(7, 6, 1, 1, '#2a2a30'); R(5, 6, 1, 1, '#2a2a30'); R(10, 5, 1, 3, '#2a2a30'); R(7, 5, 1, 1, '#2a2a30'); } else { R(8, 5, 3, 1, '#2a2a30'); R(8, 7, 3, 1, '#2a2a30'); R(8, 6, 1, 1, '#2a2a30'); R(5, 5, 3, 1, '#2a2a30'); } }
    if (accOf('shades')) { if (f) { R(5, 5, 6, 2, '#14141c'); R(5, 5, 1, 1, '#8a8aa8'); R(9, 5, 1, 1, '#8a8aa8'); } else { R(8, 5, 3, 2, '#14141c'); R(5, 5, 3, 1, '#14141c'); } }
    if (accOf('visor')) { const g = 0.7 + 0.3 * Math.sin(t / 150); c.globalAlpha = g; if (f) { R(4, 5, 8, 2, '#38e8ff'); R(4, 5, 8, 1, '#b0faff'); } else { R(8, 5, 4, 2, '#38e8ff'); R(5, 5, 3, 1, '#38e8ff'); } c.globalAlpha = 1; }
  }
  if (cape && v === 'b') { const cc = accCol('cape'); R(3, 10, 10, 13, cc); R(7, 10, 2, 13, shade(cc, 0.8)); }
  c.restore();
}

/* ------------------------------------------------------------------ EMOTES & PIXEL SHAPES */
const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
const ANGER = ['#.....#', '.#...#.', '..#.#..', '.#...#.', '#..#..#'];
const QUESTION = ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'];

export function drawMask(c: Ctx, mask: string[], x: number, y: number, col: string) {
  c.fillStyle = col;
  for (let j = 0; j < mask.length; j++) for (let i = 0; i < mask[j].length; i++) if (mask[j][i] === '#') c.fillRect(x + i, y + j, 1, 1);
}
export function drawHeart(c: Ctx, x: number, y: number, col = '#ff4f8a') {
  drawMask(c, HEART, Math.round(x), Math.round(y), col);
  c.fillStyle = '#ffffff';
  c.fillRect(Math.round(x) + 1, Math.round(y) + 1, 1, 1);
}
export function drawSparkle(c: Ctx, x: number, y: number, col: string, s = 1) {
  c.fillStyle = col;
  x = Math.round(x); y = Math.round(y);
  c.fillRect(x, y, 1, 1);
  if (s > 0.5) { c.fillRect(x - 1, y, 1, 1); c.fillRect(x + 1, y, 1, 1); c.fillRect(x, y - 1, 1, 1); c.fillRect(x, y + 1, 1, 1); }
}

export type EmoteType = 'heart' | 'anger' | 'question' | 'gem' | 'star';
export function drawEmote(c: Ctx, x: number, headY: number, type: EmoteType, t: number) {
  const bob = Math.round(Math.sin(t / 160) * 1.2);
  const bw = type === 'anger' ? 11 : type === 'question' ? 9 : 11;
  const bh = type === 'question' ? 11 : 9;
  const bx = Math.round(x - bw / 2);
  const by = Math.round(headY - bh - 3 + bob);
  c.fillStyle = '#3a2a3e';
  c.fillRect(bx, by + 1, bw, bh - 1);
  c.fillRect(bx + 1, by, bw - 2, bh + 1);
  c.fillStyle = '#ffffff';
  c.fillRect(bx + 1, by + 2, bw - 2, bh - 3);
  c.fillRect(bx + 2, by + 1, bw - 4, bh - 1);
  c.fillStyle = '#3a2a3e';
  c.fillRect(Math.round(x) - 1, by + bh + 1, 3, 1);
  c.fillStyle = '#ffffff';
  c.fillRect(Math.round(x) - 1, by + bh, 3, 1);
  c.fillRect(Math.round(x), by + bh + 1, 1, 1);
  if (type === 'heart') drawMask(c, HEART, bx + 2, by + 2, '#ff3d78');
  else if (type === 'anger') drawMask(c, ANGER, bx + 2, by + 3, '#e02828');
  else if (type === 'question') drawMask(c, QUESTION, bx + 2, by + 2, '#4a6ae0');
  else if (type === 'gem') { drawMask(c, ['..#..', '.###.', '#####', '.###.', '..#..'], bx + 3, by + 2, '#38c8f8'); }
  else drawMask(c, ['..#..', '..#..', '#####', '.###.', '.#.#.'], bx + 3, by + 2, '#f2b630');
}
