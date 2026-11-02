import type { RoomId } from './kens';

export const TS = 16;
export const RW = 11;
export const RH = 13;
export const W = RW * TS;
export const H = RH * TS;

type Ctx = CanvasRenderingContext2D;
type Rect4 = [number, number, number, number];

export interface Env {
  minutes: number;
  night: number;
  skyTop: string;
  skyBot: string;
  tint: [number, number, number, number];
  rainy: boolean;
  t: number;
}
export interface Exit { x: number; y: number; w: number; h: number; to: RoomId; sx: number; sy: number; dir: 'up' | 'down' | 'left' | 'right'; label: string }
export interface Prop { id: string; x: number; y: number; w: number; h: number; solid?: Rect4 | null; interact?: string; label?: string }
export interface Light { x: number; y: number; r: number; c: string }
export interface RoomDef {
  id: RoomId;
  name: string;
  outdoor: boolean;
  skyRects: Rect4[];
  props: Prop[];
  blocks: Rect4[];
  exits: Exit[];
  spots: [number, number][];
  lights: Light[];
  solid: boolean[][];
  back: (c: Ctx) => void;
  front?: (c: Ctx) => void;
  skyline?: (c: Ctx, env: Env) => void;
  dynamic: (c: Ctx, env: Env) => void;
}

/* ---------------------------------------------------------------- color utils */
function hex(h: string): [number, number, number] {
  const n = parseInt(h.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
const KEYS: { m: number; top: string; bot: string; tint: [number, number, number, number] }[] = [
  { m: 360, top: '#f8b070', bot: '#fde4a8', tint: [255, 196, 110, 0.22] },
  { m: 480, top: '#8ccaf4', bot: '#fff0c4', tint: [255, 224, 150, 0.12] },
  { m: 600, top: '#58b4f8', bot: '#c8ecff', tint: [255, 255, 255, 0] },
  { m: 960, top: '#58b4f8', bot: '#c8ecff', tint: [255, 255, 255, 0] },
  { m: 1050, top: '#ffa060', bot: '#ffd8a0', tint: [255, 160, 80, 0.2] },
  { m: 1110, top: '#e0587a', bot: '#ff9c58', tint: [255, 110, 70, 0.28] },
  { m: 1200, top: '#3c2a74', bot: '#b8548c', tint: [80, 70, 160, 0.34] },
  { m: 1290, top: '#10143c', bot: '#2c3680', tint: [30, 40, 120, 0.46] },
  { m: 1440, top: '#0a0e30', bot: '#202870', tint: [24, 34, 110, 0.5] },
];
export function envAt(minutes: number, rainy: boolean, t: number): Env {
  let i = 0;
  while (i < KEYS.length - 2 && minutes >= KEYS[i + 1].m) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const k = Math.max(0, Math.min(1, (minutes - a.m) / (b.m - a.m)));
  let skyTop = mix(a.top, b.top, k);
  let skyBot = mix(a.bot, b.bot, k);
  const tint = a.tint.map((v, j) => v + (b.tint[j] - v) * k) as [number, number, number, number];
  if (rainy) {
    skyTop = mix(skyTop, '#6a7488', 0.65);
    skyBot = mix(skyBot, '#9aa4b4', 0.65);
    tint[0] = tint[0] * 0.5 + 40; tint[1] = tint[1] * 0.5 + 50; tint[2] = tint[2] * 0.5 + 70;
    tint[3] = Math.min(0.6, tint[3] + 0.14);
  }
  const night = minutes >= 1110 ? Math.min(1, (minutes - 1110) / 150) : minutes < 420 ? (0.35 * (420 - minutes)) / 60 : 0;
  return { minutes, night, skyTop, skyBot, tint, rainy, t };
}

/* ---------------------------------------------------------------- drawing helpers */
export const R = (c: Ctx, col: string, x: number, y: number, w: number, h: number) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
export const hash = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

export function woodFloor(c: Ctx, x: number, y: number, w: number, h: number, cols: [string, string, string, string]) {
  for (let py = y, r = 0; py < y + h; py += 8, r++) {
    for (let px = x - ((r * 13) % 32); px < x + w; px += 32) {
      const sx = Math.max(px, x), ex = Math.min(px + 32, x + w);
      const col = cols[Math.floor(hash(px * 0.37 + r * 3.1) * 3)];
      R(c, col, sx, py, ex - sx, 8);
      R(c, cols[3], sx, py + 7, ex - sx, 1);
      if (px >= x) R(c, cols[3], px, py, 1, 8);
    }
  }
}

const FONT: Record<string, string> = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  H: '101101111101101', I: '111010010010111', J: '001001001101010', L: '100100100100111', N: '111101101101101', O: '010101101101010',
  P: '110101110100100', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', X: '101101010101101', Y: '101101010010010',
};
export function pixText(c: Ctx, s: string, x: number, y: number, col: string) {
  c.fillStyle = col;
  for (let k = 0; k < s.length; k++) {
    const g = FONT[s[k]];
    if (!g) continue;
    for (let i = 0; i < 15; i++) if (g[i] === '1') c.fillRect(x + k * 4 + (i % 3), y + Math.floor(i / 3), 1, 1);
  }
}

/** Distant skyline silhouette with night-lit windows. */
export function skyline(c: Ctx, x: number, w: number, baseY: number, maxH: number, env: Env, seed: number, scale = 1) {
  const day = mix('#8aa4d0', '#6a7aa8', 0.3);
  const base = mix(day, '#161a44', Math.min(1, env.night * 1.2));
  const dusk = env.minutes > 1020 && env.minutes < 1200 ? 0.25 : 0;
  const col = mix(base, '#6a3a7a', dusk);
  let px = x;
  let i = 0;
  while (px < x + w) {
    const bw = Math.round((8 + hash(seed + i) * 10) * scale);
    const bh = Math.round((maxH * 0.35 + hash(seed + i * 3.3) * maxH * 0.65));
    R(c, col, px, baseY - bh, bw, bh);
    R(c, mix(col, '#ffffff', 0.08), px, baseY - bh, bw, 1);
    if (env.night > 0.25) {
      for (let wy = baseY - bh + 3; wy < baseY - 2; wy += 4) {
        for (let wx = px + 2; wx < px + bw - 2; wx += 4) {
          if (hash(wx * 1.7 + wy * 2.3 + seed) > 0.45) R(c, hash(wx + wy * 5) > 0.5 ? '#ffe6a0' : '#a0e0ff', wx, wy, 2, 2);
        }
      }
    }
    px += bw + 1;
    i++;
  }
}

/* ---------------------------------------------------------------- room builders */
const solidMask = (props: Prop[], blocks: Rect4[]) => {
  const m: boolean[][] = Array.from({ length: RH }, () => Array(RW).fill(false));
  const fill = (r: Rect4) => { for (let y = r[1]; y < r[1] + r[3]; y++) for (let x = r[0]; x < r[0] + r[2]; x++) if (m[y] && x >= 0 && x < RW) m[y][x] = true; };
  blocks.forEach(fill);
  props.forEach((p) => { if (p.solid === undefined) fill([p.x, p.y, p.w, p.h]); else if (p.solid) fill(p.solid); });
  return m;
};

/* ============================== BEDROOM ============================== */
function bedroomBack(c: Ctx) {
  // wall
  R(c, '#b79ad6', 0, 0, W, 48);
  for (let x = 0; x < W; x += 16) R(c, '#c6aae4', x, 0, 8, 32);
  R(c, '#e8b4cc', 0, 32, W, 14); R(c, '#fff0f6', 0, 32, W, 2); R(c, '#d890b0', 0, 44, W, 2);
  for (let x = 4; x < W; x += 16) R(c, '#d8a0bc', x, 36, 8, 8);
  R(c, '#8a5a6a', 0, 46, W, 2);
  c.clearRect(10, 8, 44, 26);
  // floor
  woodFloor(c, 0, 48, W, H - 48, ['#c98f5a', '#bf8450', '#d49a64', '#a8703f']);
  // rug
  R(c, '#d8708f', 46, 94, 84, 68); R(c, '#f6bcd0', 49, 97, 78, 62); R(c, '#fff0f6', 52, 100, 72, 56); R(c, '#f6bcd0', 55, 103, 66, 50);
  for (let i = 0; i < 6; i++) { R(c, '#e88ab0', 62 + i * 10, 118, 4, 4); R(c, '#fff0f6', 62 + i * 10, 118, 2, 2); }
  R(c, '#e88ab0', 82, 108, 12, 2); R(c, '#e88ab0', 82, 140, 12, 2);
  // window frame
  R(c, '#7a4a5a', 6, 4, 52, 5); R(c, '#7a4a5a', 6, 4, 5, 32); R(c, '#7a4a5a', 53, 4, 5, 32);
  R(c, '#f0e0d0', 4, 34, 56, 4); R(c, '#c8a890', 4, 37, 56, 1);
  R(c, '#e8dcd0', 30, 8, 3, 26); R(c, '#e8dcd0', 10, 20, 44, 2);
  // curtains
  for (const [cx, dir] of [[0, 1], [54, -1]] as const) {
    R(c, '#e88ab0', cx, 6, 10, 30);
    for (let i = 0; i < 5; i++) R(c, '#d06a96', cx + 1 + i * 2, 6, 1, 30);
    R(c, '#f4b0cc', cx + (dir > 0 ? 8 : 1), 6, 1, 30);
    R(c, '#f2c040', cx + (dir > 0 ? 6 : 2), 22, 3, 2);
  }
  R(c, '#e8c068', 0, 3, 64, 2); R(c, '#f8dc88', 0, 3, 64, 1); R(c, '#e8c068', 0, 1, 3, 6); R(c, '#e8c068', 61, 1, 3, 6);
  // vanity mirror
  R(c, '#e8c068', 70, 6, 36, 36); R(c, '#b88a38', 70, 6, 36, 2);
  R(c, '#bfe4f4', 73, 10, 30, 28); R(c, '#e8f8ff', 76, 12, 5, 16); R(c, '#e8f8ff', 84, 12, 2, 8);
  R(c, '#e8c068', 64, 14, 8, 26); R(c, '#bfe4f4', 66, 17, 4, 20); R(c, '#e8c068', 104, 14, 8, 26); R(c, '#bfe4f4', 106, 17, 4, 20);
  R(c, '#f8dc88', 85, 3, 6, 4); R(c, '#e8c068', 83, 5, 10, 3);
  // vanity table
  R(c, '#f6e0b8', 62, 46, 52, 7); R(c, '#fff0d8', 62, 46, 52, 2);
  R(c, '#e8c068', 62, 53, 52, 11); R(c, '#f6e0b8', 64, 53, 48, 9);
  R(c, '#e8c068', 70, 55, 14, 5); R(c, '#e8c068', 90, 55, 14, 5); R(c, '#8a5a3a', 76, 57, 2, 1); R(c, '#8a5a3a', 96, 57, 2, 1);
  R(c, '#e8c068', 62, 62, 4, 2); R(c, '#e8c068', 110, 62, 4, 2);
  // perfumes & brush
  R(c, '#ff7ab4', 68, 40, 4, 6); R(c, '#fff', 69, 38, 2, 2); R(c, '#7ad0ff', 100, 41, 5, 5); R(c, '#f2c040', 101, 39, 3, 2); R(c, '#c8a8ff', 78, 43, 6, 3); R(c, '#8a5a3a', 90, 44, 8, 2); R(c, '#ff5f8a', 98, 43, 2, 3);
  // wardrobe
  R(c, '#6a3e32', 128, 0, 48, 64); R(c, '#8a5a4a', 130, 6, 44, 56); R(c, '#a0705a', 130, 6, 44, 2);
  R(c, '#6a3e32', 150, 8, 2, 54); R(c, '#9a6a56', 133, 12, 15, 22); R(c, '#9a6a56', 154, 12, 18, 22); R(c, '#9a6a56', 133, 38, 15, 20); R(c, '#9a6a56', 154, 38, 18, 20);
  R(c, '#7a4a3a', 135, 14, 11, 18); R(c, '#7a4a3a', 156, 14, 14, 18);
  R(c, '#f2c040', 146, 28, 2, 5); R(c, '#f2c040', 154, 28, 2, 5); R(c, '#e8c068', 128, 0, 48, 4); R(c, '#f8dc88', 128, 0, 48, 1);
  // bookshelf
  R(c, '#6a3e32', 0, 50, 32, 48); R(c, '#4a2a22', 3, 53, 26, 42);
  const bc = ['#e0455a', '#3a8ae0', '#f2c040', '#58b858', '#a870e0', '#ff8a3c'];
  for (const sy of [53, 67, 81]) {
    R(c, '#7a4a3a', 3, sy + 11, 26, 3);
    for (let i = 0; i < 8; i++) R(c, bc[(i + sy) % 6], 4 + i * 3, sy + 3 + (i % 3), 2, 8 - (i % 3));
  }
  // bed
  R(c, '#7a4a3a', 0, 108, 48, 68); R(c, '#5a3426', 0, 108, 48, 4);
  R(c, '#fff0f6', 4, 114, 18, 12); R(c, '#fff0f6', 24, 114, 18, 12); R(c, '#e8c8d8', 4, 124, 18, 2); R(c, '#e8c8d8', 24, 124, 18, 2);
  R(c, '#e87aa8', 3, 128, 42, 44); R(c, '#f6a0c4', 3, 128, 42, 8); R(c, '#fff0f6', 3, 136, 42, 2);
  for (let i = 0; i < 5; i++) R(c, '#d85a8e', 6 + i * 8, 142, 4, 28);
  R(c, '#7a4a3a', 0, 172, 48, 6); R(c, '#e8c068', 2, 172, 4, 2); R(c, '#e8c068', 42, 172, 4, 2);
  // dresser + lamp
  R(c, '#6a3e32', 144, 100, 32, 30); R(c, '#8a5a4a', 146, 104, 30, 24); R(c, '#a0705a', 144, 100, 32, 4);
  R(c, '#6a3e32', 160, 106, 1, 22); R(c, '#f2c040', 150, 112, 3, 2); R(c, '#f2c040', 166, 112, 3, 2); R(c, '#f2c040', 150, 120, 3, 2); R(c, '#f2c040', 166, 120, 3, 2);
  R(c, '#e8c068', 158, 90, 4, 10); R(c, '#e8c068', 154, 98, 12, 3); R(c, '#fff0b0', 152, 80, 16, 11); R(c, '#ffe080', 154, 82, 12, 7);
  // plant
  R(c, '#58b858', 162, 158, 10, 8); R(c, '#3a9a48', 158, 164, 6, 8); R(c, '#58b858', 168, 162, 6, 10); R(c, '#78d878', 164, 154, 4, 8);
  R(c, '#c8643c', 160, 172, 14, 12); R(c, '#e08058', 160, 172, 14, 3); R(c, '#a04a2a', 160, 181, 14, 3);
  // door mat
  R(c, '#a85a7a', 62, 196, 52, 12); R(c, '#e88ab0', 64, 198, 48, 8);
  for (let i = 0; i < 4; i++) { R(c, '#fff0f6', 80 + i * 6, 199, 2, 1); R(c, '#fff0f6', 81 + i * 6, 200, 1, 1); }
  R(c, '#fff0f6', 86, 203, 4, 1); R(c, '#fff0f6', 87, 204, 2, 1);
}
function bedroomSky(c: Ctx, env: Env) { skyline(c, 10, 44, 34, 20, env, 7); }

/* ============================== TOWN ============================== */
function townBack(c: Ctx) {
  // pavement
  for (let ty = 4; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
    const alt = (tx + ty) % 2;
    R(c, alt ? '#d8c8ae' : '#e0d2ba', tx * 16, ty * 16, 16, 16);
    R(c, '#bfae92', tx * 16, ty * 16 + 15, 16, 1); R(c, '#bfae92', tx * 16 + 15, ty * 16, 1, 16);
    if (hash(tx * 9 + ty * 4) > 0.7) R(c, '#cbbba0', tx * 16 + 4, ty * 16 + 5, 3, 2);
  }
  // hedges & flowerbeds
  const hedge = (x: number, y: number, w: number, h: number) => {
    R(c, '#2f8a3c', x, y, w, h); R(c, '#48ac54', x, y, w, 3);
    for (let i = 0; i < w; i += 6) { R(c, '#3a9a48', x + i, y + 4, 3, h - 5); if (hash(i + x + y) > 0.5) R(c, ['#ff8ab5', '#fff070', '#ffffff'][Math.floor(hash(i * 3 + x) * 3)], x + i + 1, y + 2, 2, 2); }
  };
  hedge(0, 192, W, 16); hedge(0, 64, 16, 32); hedge(160, 64, 16, 32); hedge(0, 160, 16, 32); hedge(160, 160, 16, 32);
  // skyline silhouettes are dynamic. Mansion
  R(c, '#f0a8c0', 0, 16, 64, 48); R(c, '#f8c0d4', 0, 16, 64, 3); R(c, '#b05a82', 0, 16, 64, 10); R(c, '#e08aaa', 0, 24, 64, 2); R(c, '#e8c068', 0, 26, 64, 1);
  for (let i = 0; i < 8; i++) R(c, '#9a4a72', i * 8, 18, 4, 6);
  for (const wx of [6, 40]) { R(c, '#fff0f6', wx, 32, 18, 16); R(c, '#bfe4f4', wx + 2, 34, 14, 12); R(c, '#fff0f6', wx + 8, 34, 2, 12); R(c, '#fff0f6', wx + 2, 40, 14, 2); R(c, '#e88ab0', wx - 2, 48, 22, 3); }
  R(c, '#fff0f6', 14, 44, 36, 20); R(c, '#7a3a5a', 18, 46, 28, 18); R(c, '#9a4a72', 20, 46, 24, 4); R(c, '#e8c068', 18, 44, 28, 2); R(c, '#f2c040', 40, 56, 2, 3);
  R(c, '#f2c040', 28, 38, 8, 6); R(c, '#ff4f8a', 30, 39, 4, 3); pixText(c, 'BARBIE', 20, 28, '#fff0f6');
  // Cafe
  R(c, '#f4e0c0', 64, 36, 48, 28); R(c, '#e0c8a0', 64, 36, 48, 3);
  for (let i = 0; i < 6; i++) R(c, i % 2 ? '#fff' : '#e0455a', 64 + i * 8, 40, 8, 8);
  R(c, '#b83040', 64, 48, 48, 2); R(c, '#bfe4f4', 70, 52, 14, 12); R(c, '#7a4a3a', 92, 50, 14, 14); R(c, '#f2c040', 102, 58, 2, 2);
  pixText(c, 'CAFE', 80, 31, '#e0455a');
  // Tower
  R(c, '#4a6a8a', 112, 0, 64, 64); R(c, '#7ac8e8', 114, 4, 60, 48);
  for (let y = 6; y < 50; y += 8) for (let x = 116; x < 172; x += 10) { R(c, '#a8e4f8', x, y, 8, 6); R(c, '#d0f4ff', x, y, 8, 1); }
  R(c, '#2a3a5a', 112, 0, 64, 3); R(c, '#cfd8e8', 142, 0, 4, 3);
  R(c, '#2a3a5a', 124, 44, 40, 20); R(c, '#e8c068', 124, 44, 40, 2); R(c, '#1a2a4a', 128, 48, 15, 16); R(c, '#1a2a4a', 145, 48, 15, 16);
  R(c, '#e8c068', 143, 48, 2, 16); R(c, '#f8dc88', 128, 48, 15, 1);
  pixText(c, 'PENT', 130, 36, '#f8dc88');
  // fountain basin
  R(c, '#a8a8c0', 62, 100, 52, 46); R(c, '#c8c8dc', 64, 98, 48, 44); R(c, '#e0e0f0', 66, 98, 44, 3); R(c, '#8a8aa8', 62, 142, 52, 4);
  R(c, '#a8a8c0', 64, 142, 48, 2);
  // benches
  for (const bx of [48, 96]) { R(c, '#7a4a3a', bx, 176, 32, 6); R(c, '#a0705a', bx, 172, 32, 4); R(c, '#4a2a22', bx + 2, 182, 3, 6); R(c, '#4a2a22', bx + 27, 182, 3, 6); R(c, '#a0705a', bx, 166, 32, 3); }
  // lamp posts
  for (const lx of [48, 128]) { R(c, '#2a3a4a', lx + 6, 72, 4, 20); R(c, '#2a3a4a', lx + 3, 90, 10, 3); R(c, '#2a3a4a', lx + 4, 68, 8, 4); }
  // tree trunks
  for (const tx of [16, 144]) { R(c, '#6a4228', tx + 5, 172, 6, 20); R(c, '#4a2a18', tx + 5, 172, 2, 20); }
}
function townFront(c: Ctx) {
  for (const tx of [16, 144]) {
    R(c, '#2f8a3c', tx - 4, 150, 24, 24); R(c, '#48ac54', tx - 2, 146, 20, 12); R(c, '#2f8a3c', tx, 172, 16, 4); R(c, '#68c870', tx + 2, 148, 6, 4);
    R(c, '#3a9a48', tx + 10, 160, 8, 8); R(c, '#ff8ab5', tx + 4, 160, 2, 2); R(c, '#ff8ab5', tx + 12, 154, 2, 2);
  }
  for (const lx of [48, 128]) { R(c, '#fff0b0', lx + 4, 63, 8, 5); }
}
function townSky(c: Ctx, env: Env) { skyline(c, 0, W, 64, 34, env, 3); skyline(c, 0, W, 64, 22, env, 11, 0.8); }

function townDyn(c: Ctx, env: Env) {
  const t = env.t;
  // water
  R(c, '#58c0f0', 68, 104, 40, 34);
  for (let i = 0; i < 6; i++) { const wx = 70 + ((i * 11 + Math.floor(t / 200)) % 34); R(c, '#a8e8ff', wx, 106 + i * 5, 4, 1); }
  R(c, '#c8c8dc', 82, 112, 12, 12); R(c, '#e0e0f0', 84, 106, 8, 8); R(c, '#58c0f0', 86, 104, 4, 4);
  for (let i = 0; i < 6; i++) { const ph = (t / 400 + i * 0.7) % 3; R(c, '#c8f0ff', 88 - Math.sin(i * 2) * ph * 6 + (i % 2 ? 2 : 0), 100 + ph * 9, 2, 2); }
  // lit windows
  if (env.night > 0.3) {
    c.globalAlpha = Math.min(1, env.night * 1.2);
    for (const wx of [6, 40]) { R(c, '#ffe08a', wx + 2, 34, 14, 12); R(c, '#fff0f6', wx + 8, 34, 2, 12); R(c, '#fff0f6', wx + 2, 40, 14, 2); }
    R(c, '#ffe08a', 70, 52, 14, 12);
    for (let y = 6; y < 50; y += 8) for (let x = 116; x < 172; x += 10) if (hash(x + y * 3) > 0.35) R(c, '#ffe9a0', x, y, 8, 6);
    c.globalAlpha = 1;
  }
  // exit arrows
  const pulse = Math.floor(t / 300) % 2;
  R(c, '#ff4f9a', 3 + pulse, 124, 2, 8); R(c, '#ff4f9a', 5 + pulse, 122, 2, 12); R(c, '#ff4f9a', 7 + pulse, 120, 2, 16);
  R(c, '#ffd23c', 172 - pulse, 124, 2, 8); R(c, '#ffd23c', 170 - pulse, 122, 2, 12); R(c, '#ffd23c', 168 - pulse, 120, 2, 16);
}

/* ============================== BEACH ============================== */
function beachBack(c: Ctx) {
  R(c, '#2aa8d8', 0, 32, W, 48);
  R(c, '#f0dca0', 0, 80, W, H - 80);
  R(c, '#dcc486', 0, 80, W, 12); R(c, '#e8d296', 0, 92, W, 4);
  for (let i = 0; i < 70; i++) { const x = hash(i * 3.7) * W, y = 96 + hash(i * 9.1) * (H - 96); R(c, i % 3 ? '#e0c880' : '#fff0c0', x, y, 2, 1); }
  // shells, starfish
  R(c, '#ff8ab5', 40, 140, 3, 3); R(c, '#fff', 120, 120, 3, 2); R(c, '#ffb070', 150, 170, 4, 3); R(c, '#ff6a6a', 64, 182, 3, 3);
  // towel
  R(c, '#ff5f8a', 44, 148, 28, 14); for (let i = 0; i < 4; i++) R(c, '#fff', 48 + i * 7, 148, 3, 14);
  // sandcastle
  R(c, '#e0b870', 92, 118, 18, 8); R(c, '#e0b870', 94, 112, 4, 6); R(c, '#e0b870', 104, 112, 4, 6); R(c, '#e0b870', 98, 110, 4, 8); R(c, '#ff5f5f', 100, 106, 1, 4); R(c, '#ff5f5f', 100, 106, 4, 2);
  // chair
  R(c, '#2ec4c4', 118, 168, 18, 8); R(c, '#fff', 118, 172, 18, 2); R(c, '#2ec4c4', 118, 162, 4, 8);
  // palm trunks
  for (const [x, y] of [[16, 96], [144, 128]]) { R(c, '#a0703a', x + 2, y, 5, 18); for (let i = 0; i < 4; i++) R(c, '#7a4a22', x + 2, y + 2 + i * 4, 5, 1); }
  // umbrella pole
  R(c, '#fff', 56, 124, 2, 24); R(c, '#e0e0e0', 57, 124, 1, 24);
  R(c, '#fff', 120, 148, 2, 14);
  // tiki hut
  R(c, '#7a4a22', 0, 176, 48, 32); R(c, '#a0703a', 2, 184, 44, 6); R(c, '#e8c880', 2, 184, 44, 2);
  R(c, '#7a4a22', 4, 190, 3, 18); R(c, '#7a4a22', 40, 190, 3, 18);
  R(c, '#d8a850', 0, 168, 48, 12); for (let i = 0; i < 12; i++) R(c, i % 2 ? '#b88838' : '#e8c070', i * 4, 176, 4, 6);
  R(c, '#ff5f8a', 14, 176, 4, 6); R(c, '#58c8f0', 26, 172, 6, 4);
}
function beachFront(c: Ctx) {
  for (const [x, y] of [[16, 96], [144, 128]]) {
    const lc = ['#2f8a3c', '#48ac54', '#3a9a48'];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; for (let k = 0; k < 7; k++) R(c, lc[(i + k) % 3], x + 4 + Math.cos(a) * k * 2.4, y - 2 + Math.sin(a) * k * 1.3 + k * 0.4, 3, 2); }
    R(c, '#a06820', x + 3, y, 3, 3); R(c, '#a06820', x + 6, y + 1, 3, 3);
  }
  // umbrella canopies
  const umb = (cx: number, cy: number, r: number, cols: [string, string]) => {
    for (let i = -r; i <= r; i++) { const h = Math.round(Math.sqrt(r * r - i * i) * 0.5); R(c, Math.floor((i + r) / 4) % 2 ? cols[0] : cols[1], cx + i, cy - h, 1, h + 1); }
    R(c, '#c8c8c8', cx - r, cy + 1, r * 2 + 1, 1);
  };
  umb(57, 124, 17, ['#fff', '#ff5f8a']); umb(121, 148, 12, ['#fff', '#2ec4c4']);
}
function beachDyn(c: Ctx, env: Env) {
  const t = env.t;
  for (let row = 0; row < 6; row++) {
    const y = 34 + row * 8;
    R(c, row % 2 ? '#2eb4e4' : '#24a0d4', 0, y, W, 4);
    for (let x = -16; x < W; x += 24) {
      const wx = x + ((t / (30 + row * 8) + row * 9) % 24);
      R(c, '#7ad8f8', wx, y + 1 + Math.round(Math.sin(t / 400 + x + row) * 1), 12, 1);
    }
  }
  R(c, '#fff', 0, 32, W, 1);
  // boat on horizon
  const bx = (t / 120) % (W + 40) - 20;
  R(c, '#fff', bx, 28, 8, 4); R(c, '#e0455a', bx + 2, 20, 1, 8); R(c, '#fff', bx + 3, 20, 4, 6); R(c, '#7a4a22', bx - 1, 32, 10, 2);
  // sun glitter
  for (let i = 0; i < 12; i++) { const gx = hash(i * 7.3 + Math.floor(t / 500)) * W, gy = 36 + hash(i * 2.1 + Math.floor(t / 500)) * 40; R(c, '#ffffff', gx, gy, 2, 1); }
  // foam
  for (let x = 0; x < W; x += 4) { const o = Math.sin(t / 500 + x * 0.3) * 3 + 3; R(c, '#ffffff', x, 78 + o * 0.6, 4, 2); R(c, 'rgba(255,255,255,0.45)', x, 80 + o, 4, 3); }
  const pulse = Math.floor(t / 300) % 2;
  R(c, '#ffd23c', 3 + pulse, 124, 2, 8); R(c, '#ffd23c', 5 + pulse, 122, 2, 12); R(c, '#ffd23c', 7 + pulse, 120, 2, 16);
}

/* ============================== CLUB ============================== */
function clubBack(c: Ctx) {
  R(c, '#20143a', 0, 0, W, 48); R(c, '#2e1c52', 0, 40, W, 8);
  for (let x = 0; x < W; x += 12) R(c, '#281a48', x, 0, 2, 40);
  for (let ty = 3; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) { R(c, (tx + ty) % 2 ? '#2a1a44' : '#32204e', tx * 16, ty * 16, 16, 16); }
  R(c, '#120a22', 0, 48, W, 2);
  // bar back shelves
  R(c, '#4a2a5a', 2, 6, 92, 30); R(c, '#2a1a3a', 4, 8, 88, 26); R(c, '#6a4a7a', 4, 20, 88, 2);
  const bt = ['#ff4f9a', '#38e8ff', '#ffd23c', '#7a5aff', '#4aff9a'];
  for (let i = 0; i < 14; i++) { R(c, bt[i % 5], 7 + i * 6, 12 + (i % 2), 3, 8); R(c, bt[(i + 2) % 5], 7 + i * 6, 25 + (i % 2), 3, 8); }
  // bar counter
  R(c, '#8a4a6a', 0, 38, 96, 6); R(c, '#c47a9a', 0, 38, 96, 2); R(c, '#4a1a4a', 0, 44, 96, 20); R(c, '#3a1240', 4, 48, 88, 12);
  R(c, '#c47a9a', 0, 62, 96, 2);
  for (let i = 0; i < 4; i++) R(c, '#f4f0ff', 14 + i * 22, 33, 3, 5);
  // DJ booth
  R(c, '#14101e', 112, 18, 64, 46); R(c, '#2a2a3a', 114, 32, 60, 24); R(c, '#3a3a50', 114, 32, 60, 3);
  for (const dx of [124, 156]) { R(c, '#0a0a12', dx - 8, 36, 16, 16); R(c, '#2a2a3a', dx - 6, 38, 12, 12); R(c, '#8a8aa8', dx - 1, 43, 2, 2); R(c, '#4a4a60', dx - 6, 38, 12, 1); }
  R(c, '#0a0a12', 140, 38, 6, 14); R(c, '#ff4f9a', 141, 40, 4, 1); R(c, '#38e8ff', 141, 43, 4, 1); R(c, '#ffd23c', 141, 46, 4, 1);
  R(c, '#0a0a12', 112, 56, 64, 8); R(c, '#3a1240', 114, 20, 60, 10);
  pixText(c, 'DJ', 138, 22, '#38e8ff');
  // speakers
  for (const sx of [0, 160]) { R(c, '#0a0a12', sx, 62, 16, 22); R(c, '#2a2a3a', sx + 2, 64, 12, 18); R(c, '#4a4a60', sx + 4, 66, 8, 8); R(c, '#14141c', sx + 6, 68, 4, 4); R(c, '#4a4a60', sx + 5, 77, 6, 4); }
  // sofas
  const sofa = (x: number, flip: boolean) => {
    R(c, '#7a2a6a', x, 96, 18, 50); R(c, '#a03a8a', x + (flip ? 0 : 2), 98, 14, 46); R(c, '#c85aa8', x + (flip ? 2 : 4), 100, 10, 10);
    R(c, '#c85aa8', x + (flip ? 2 : 4), 114, 10, 10); R(c, '#c85aa8', x + (flip ? 2 : 4), 128, 10, 10);
    R(c, '#7a2a6a', x + (flip ? 12 : 0), 96, 6, 50);
  };
  sofa(0, false); sofa(158, true);
  // low tables
  for (const tx of [22, 140]) { R(c, '#14101e', tx, 150, 16, 8); R(c, '#4a3a6a', tx, 148, 16, 4); R(c, '#ffe080', tx + 7, 144, 2, 4); }
  // exit sign
  R(c, '#14101e', 148, 150, 24, 10); pixText(c, 'EXIT', 152, 153, '#4aff9a');
}
function clubDyn(c: Ctx, env: Env) {
  const t = env.t;
  const cols = ['#ff4f9a', '#38e8ff', '#ffd23c', '#7a5aff', '#4aff9a', '#ff8a3c'];
  for (let ty = 5; ty < 11; ty++) for (let tx = 2; tx < 9; tx++) {
    const k = Math.floor(t / 420 + tx * 0.9 + ty * 1.3 + Math.sin(tx * ty)) % 6;
    const on = (tx + ty + Math.floor(t / 420)) % 3 !== 0;
    R(c, on ? cols[(k + 6) % 6] : '#1c1032', tx * 16, ty * 16, 16, 16);
    if (on) { R(c, 'rgba(255,255,255,0.25)', tx * 16, ty * 16, 16, 2); R(c, 'rgba(0,0,0,0.25)', tx * 16, ty * 16 + 14, 16, 2); }
    R(c, '#120a22', tx * 16 + 15, ty * 16, 1, 16); R(c, '#120a22', tx * 16, ty * 16 + 15, 16, 1);
  }
  // neon strips
  const g = 0.6 + 0.4 * Math.sin(t / 250);
  c.globalAlpha = g; R(c, '#ff4f9a', 0, 46, 96, 2); R(c, '#38e8ff', 112, 64, 64, 1); c.globalAlpha = 1;
  R(c, cols[Math.floor(t / 300) % 6], 98, 8, 2, 30); R(c, cols[Math.floor(t / 300 + 3) % 6], 100, 8, 1, 30);
  // DJ leds
  for (let i = 0; i < 8; i++) R(c, cols[(i + Math.floor(t / 150)) % 6], 116 + i * 7, 58, 5, 2);
  // neon sign
  c.globalAlpha = 0.7 + 0.3 * Math.sin(t / 120);
  pixText(c, 'CLUB', 10, 1, '#ff4f9a'); pixText(c, 'CLUB', 11, 1, '#ff9ad0');
  c.globalAlpha = 1;
  // disco ball + beams
  R(c, '#8a8aa8', 88, 0, 1, 30);
  c.fillStyle = '#cfd8e8'; c.beginPath(); c.arc(88.5, 34, 7, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28 + t / 400; R(c, i % 2 ? '#ffffff' : '#8a9ab8', 88 + Math.cos(a) * 5, 34 + Math.sin(a * 2) * 5, 2, 2); }
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    const a = t / 900 + i * 0.9;
    c.globalAlpha = 0.16; c.fillStyle = cols[i % 6];
    const ex = 88 + Math.sin(a) * 80, ey = 150 + Math.cos(a * 1.3) * 28;
    c.beginPath(); c.moveTo(88, 38); c.lineTo(ex - 8, ey); c.lineTo(ex + 8, ey); c.closePath(); c.fill();
    c.globalAlpha = 0.35; c.beginPath(); c.arc(ex, ey, 5, 0, 6.28); c.fill();
  }
  c.restore();
  const pulse = Math.floor(t / 300) % 2;
  R(c, '#4aff9a', 172 - pulse, 176, 2, 8); R(c, '#4aff9a', 170 - pulse, 174, 2, 12); R(c, '#4aff9a', 168 - pulse, 172, 2, 16);
}

/* ============================== PENTHOUSE ============================== */
function penthouseBack(c: Ctx) {
  // deck
  woodFloor(c, 0, 96, W, H - 96, ['#5a4a58', '#524250', '#665664', '#3a2c3a']);
  woodFloor(c, 0, 64, W, 32, ['#5a4a58', '#524250', '#665664', '#3a2c3a']);
  // railing
  R(c, '#cfd8e8', 0, 46, W, 3); R(c, 'rgba(154,224,240,0.45)', 0, 49, W, 15); for (let x = 0; x < W; x += 16) R(c, '#cfd8e8', x, 49, 2, 15);
  R(c, '#8a96aa', 0, 62, W, 2);
  // pool
  R(c, '#e8e8f0', 12, 66, 152, 32); R(c, '#c8c8d8', 12, 96, 152, 2);
  // sofa
  R(c, '#d8d0e0', 0, 118, 30, 44); R(c, '#f4f0f8', 4, 120, 24, 40); R(c, '#fff', 6, 122, 20, 10); R(c, '#fff', 6, 134, 20, 10); R(c, '#fff', 6, 146, 20, 10); R(c, '#b8b0c8', 0, 118, 6, 44);
  R(c, '#ff8ab5', 20, 124, 6, 6); R(c, '#7ad0ff', 20, 148, 6, 6);
  // table
  R(c, '#2a2a3a', 66, 136, 44, 6); R(c, '#f8f8ff', 62, 128, 52, 18); R(c, '#e0e0f0', 62, 140, 52, 6);
  R(c, '#2a2a3a', 84, 146, 8, 8); R(c, '#f4f0f8', 72, 132, 8, 6); R(c, '#f4f0f8', 96, 132, 8, 6); R(c, '#ff4f8a', 86, 130, 4, 4);
  for (const [cx, cy] of [[56, 134], [112, 134]]) { R(c, '#2a2a3a', cx, cy, 6, 12); R(c, '#b8b0c8', cx + (cx < 80 ? 0 : 0), cy, 6, 4); }
  // plants
  for (const [px, py] of [[148, 118], [148, 164], [4, 172]]) { R(c, '#3a9a48', px, py, 14, 10); R(c, '#58b858', px + 2, py - 6, 10, 10); R(c, '#78d878', px + 4, py - 10, 6, 6); R(c, '#2a2a3a', px + 1, py + 10, 12, 14); R(c, '#4a4a60', px + 1, py + 10, 12, 3); }
  // elevator
  R(c, '#4a5a6a', 56, 184, 64, 24); R(c, '#8a96aa', 58, 186, 60, 22); R(c, '#cfd8e8', 60, 188, 26, 20); R(c, '#cfd8e8', 90, 188, 26, 20); R(c, '#a8b4c8', 85, 188, 6, 20);
  R(c, '#38e8ff', 84, 182, 8, 3);
}
function penthouseSky(c: Ctx, env: Env) { skyline(c, 0, W, 46, 40, env, 21); skyline(c, 0, W, 46, 26, env, 5, 0.8); }
function penthouseDyn(c: Ctx, env: Env) {
  const t = env.t;
  R(c, '#38b8e8', 14, 68, 148, 28); R(c, '#58d0f8', 14, 68, 148, 4);
  for (let i = 0; i < 14; i++) R(c, '#a8f0ff', 16 + ((i * 17 + t / 40) % 140), 74 + (i % 4) * 6, 8, 1);
  c.globalAlpha = 0.4 + 0.2 * Math.sin(t / 300); R(c, '#ffffff', 20, 88, 4, 4); R(c, '#ffffff', 150, 88, 4, 4); R(c, '#ffffff', 84, 90, 8, 3); c.globalAlpha = 1;
  // candle flame
  R(c, '#ffd23c', 86, 126 + (Math.floor(t / 150) % 2), 2, 4); R(c, '#fff', 87, 127, 1, 2);
  // string lights
  for (let i = 0; i < 22; i++) { const x = i * 8 + 2; const y = 52 + Math.sin(i * 0.9) * 2; R(c, '#222', x, y - 2, 8, 1); R(c, ['#ffd23c', '#ff8ab5', '#7ad0ff'][(i + Math.floor(t / 400)) % 3], x + 2, y, 3, 3); }
  const pulse = Math.floor(t / 300) % 2;
  R(c, '#38e8ff', 86, 200 + pulse, 4, 2);
}

/* ============================== BUILD ============================== */
const nothing = () => { /* none */ };

export function mkRoom(r: Omit<RoomDef, 'solid'>): RoomDef {
  return { ...r, solid: solidMask(r.props, r.blocks) };
}

export const ROOMS = {
  bedroom: mkRoom({
    id: 'bedroom', name: "Barbie's Mansion Bedroom", outdoor: false,
    skyRects: [[10, 8, 44, 26]],
    props: [
      { id: 'vanity', x: 4, y: 3, w: 3, h: 1, interact: 'vanity', label: 'Vanity · Dress Up' },
      { id: 'wardrobe', x: 8, y: 3, w: 3, h: 1, interact: 'wardrobe', label: 'Wardrobe' },
      { id: 'shelf', x: 0, y: 3, w: 2, h: 3 },
      { id: 'bed', x: 0, y: 7, w: 3, h: 4, interact: 'bed', label: 'Bed · Nightly Choice' },
      { id: 'dresser', x: 9, y: 6, w: 2, h: 2 },
      { id: 'plant', x: 10, y: 10, w: 1, h: 2 },
    ],
    blocks: [[0, 0, 11, 3]],
    exits: [{ x: 56, y: 202, w: 64, h: 6, to: 'town', sx: 32, sy: 78, dir: 'down', label: 'Town Square' }],
    spots: [[5, 5], [7, 5], [4, 8], [7, 9], [6, 11], [3, 11], [8, 4]],
    lights: [{ x: 160, y: 86, r: 52, c: '#ffd88a' }, { x: 88, y: 40, r: 44, c: '#ffc0e0' }],
    back: bedroomBack, skyline: bedroomSky, dynamic: nothing,
  }),
  town: mkRoom({
    id: 'town', name: 'Town Square', outdoor: true,
    skyRects: [[0, 0, W, 64]],
    props: [
      { id: 'mansion', x: 0, y: 1, w: 4, h: 3, interact: 'mansion', label: "Enter Barbie's Mansion", solid: [0, 1, 4, 3] },
      { id: 'cafe', x: 4, y: 2, w: 3, h: 2, interact: 'cafe', label: 'Enter Sweet Café' },
      { id: 'tower', x: 7, y: 0, w: 4, h: 4, interact: 'tower', label: 'Penthouse Tower' },
      { id: 'fountain', x: 4, y: 6, w: 3, h: 3, interact: 'fountain', label: 'Wishing Fountain' },
      { id: 'bench1', x: 3, y: 10, w: 2, h: 2, solid: [3, 11, 2, 1] },
      { id: 'bench2', x: 6, y: 10, w: 2, h: 2, solid: [6, 11, 2, 1] },
      { id: 'lamp1', x: 3, y: 4, w: 1, h: 2, solid: [3, 5, 1, 1] },
      { id: 'lamp2', x: 8, y: 4, w: 1, h: 2, solid: [8, 5, 1, 1] },
      { id: 'tree1', x: 1, y: 11, w: 1, h: 1 },
      { id: 'tree2', x: 9, y: 11, w: 1, h: 1 },
    ],
    blocks: [[0, 4, 1, 2], [10, 4, 1, 2], [0, 10, 1, 2], [10, 10, 1, 2], [0, 12, 5, 1], [6, 12, 5, 1]],
    exits: [
      { x: 0, y: 96, w: 4, h: 64, to: 'club', sx: 164, sy: 184, dir: 'left', label: 'Nightclub Lounge' },
      { x: 172, y: 96, w: 4, h: 64, to: 'beach', sx: 8, sy: 124, dir: 'right', label: 'Beach Resort' },
      { x: 72, y: 204, w: 32, h: 4, to: 'park', sx: 88, sy: 66, dir: 'down', label: 'Central Park' },
    ],
    spots: [[3, 4], [7, 4], [2, 7], [8, 7], [2, 9], [8, 9], [5, 10], [5, 5], [9, 8], [1, 8]],
    lights: [{ x: 56, y: 70, r: 44, c: '#ffe0a0' }, { x: 136, y: 70, r: 44, c: '#ffe0a0' }],
    back: townBack, front: townFront, skyline: townSky, dynamic: townDyn,
  }),
  beach: mkRoom({
    id: 'beach', name: 'Beach Resort', outdoor: true,
    skyRects: [[0, 0, W, 32]],
    props: [
      { id: 'palm1', x: 1, y: 6, w: 1, h: 1 },
      { id: 'palm2', x: 9, y: 8, w: 1, h: 1 },
      { id: 'umb1', x: 3, y: 8, w: 1, h: 1, solid: [3, 8, 1, 1] },
      { id: 'umb2', x: 7, y: 9, w: 1, h: 1 },
      { id: 'hut', x: 0, y: 11, w: 3, h: 2, interact: 'hut', label: 'Tiki Smoothie Bar' },
    ],
    blocks: [[0, 0, 11, 5]],
    exits: [{ x: 0, y: 84, w: 4, h: 110, to: 'town', sx: 164, sy: 124, dir: 'left', label: 'Town Square' }, { x: 172, y: 84, w: 4, h: 110, to: 'pier', sx: 12, sy: 150, dir: 'right', label: 'Sunset Pier' }],
    spots: [[3, 6], [5, 6], [7, 6], [5, 8], [8, 10], [2, 9], [6, 11], [8, 7], [5, 10], [4, 7]],
    lights: [],
    back: beachBack, front: beachFront, dynamic: beachDyn,
  }),
  club: mkRoom({
    id: 'club', name: 'Nightclub Lounge', outdoor: false,
    skyRects: [],
    props: [
      { id: 'bar', x: 0, y: 2, w: 6, h: 2, interact: 'bar', label: 'Sparkle Bar' },
      { id: 'dj', x: 7, y: 2, w: 4, h: 2, interact: 'dj', label: 'DJ Booth · Request a Song' },
      { id: 'spk1', x: 0, y: 4, w: 1, h: 1 },
      { id: 'spk2', x: 10, y: 4, w: 1, h: 1 },
      { id: 'sofa1', x: 0, y: 6, w: 1, h: 3 },
      { id: 'sofa2', x: 10, y: 6, w: 1, h: 3 },
    ],
    blocks: [[0, 0, 11, 2]],
    exits: [{ x: 172, y: 160, w: 4, h: 48, to: 'town', sx: 12, sy: 126, dir: 'right', label: 'Town Square' }],
    spots: [[3, 5], [5, 5], [7, 5], [3, 8], [7, 8], [5, 9], [3, 11], [7, 11], [2, 6], [8, 6]],
    lights: [{ x: 88, y: 110, r: 90, c: '#c060ff' }],
    back: clubBack, dynamic: clubDyn,
  }),
  penthouse: mkRoom({
    id: 'penthouse', name: "Rosan's Rooftop Penthouse", outdoor: true,
    skyRects: [[0, 0, W, 46]],
    props: [
      { id: 'pool', x: 1, y: 4, w: 9, h: 2 },
      { id: 'sofa', x: 0, y: 7, w: 2, h: 3 },
      { id: 'table', x: 4, y: 8, w: 3, h: 2, interact: 'dinner', label: 'Candlelit Table' },
      { id: 'pl1', x: 9, y: 7, w: 1, h: 1 },
      { id: 'pl2', x: 9, y: 10, w: 1, h: 1 },
      { id: 'pl3', x: 0, y: 11, w: 1, h: 1 },
    ],
    blocks: [[0, 0, 11, 4]],
    exits: [{ x: 56, y: 202, w: 64, h: 6, to: 'town', sx: 144, sy: 72, dir: 'down', label: 'Town Square' }],
    spots: [[5, 6], [7, 7], [3, 7]],
    lights: [{ x: 88, y: 130, r: 70, c: '#ffd0a0' }, { x: 88, y: 82, r: 80, c: '#58d0f8' }],
    back: penthouseBack, skyline: penthouseSky, dynamic: penthouseDyn,
  }),
} as Record<RoomId, RoomDef>;

export function buildLayers(room: RoomDef) {
  const mkc = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return cv; };
  const back = mkc();
  room.back(back.getContext('2d')!);
  const front = mkc();
  if (room.front) room.front(front.getContext('2d')!);
  return { back, front };
}

/** Draw sky, sun/moon, stars, clouds inside the room's sky rects. */
export function drawBackdrop(c: Ctx, room: RoomDef, env: Env) {
  if (!room.skyRects.length) return;
  c.save();
  c.beginPath();
  room.skyRects.forEach((r) => c.rect(r[0], r[1], r[2], r[3]));
  c.clip();
  const [x, y, w, h] = room.skyRects[0];
  const g = c.createLinearGradient(0, y, 0, y + Math.max(h, 40));
  g.addColorStop(0, env.skyTop); g.addColorStop(1, env.skyBot);
  c.fillStyle = g; c.fillRect(0, 0, W, 70);
  void x; void w;
  const t = env.t;
  if (env.night > 0.2) {
    c.globalAlpha = Math.min(1, env.night);
    for (let i = 0; i < 46; i++) {
      const sx = hash(i * 3.1) * W, sy = hash(i * 7.7) * 46;
      if (Math.sin(t / 400 + i * 2.3) > -0.4) R(c, '#ffffff', sx, sy, i % 5 === 0 ? 2 : 1, 1);
    }
    c.globalAlpha = 1;
  }
  const m = env.minutes;
  const sunP = (m - 360) / 780;
  if (sunP > 0 && sunP < 1 && !env.rainy) {
    const sx = 10 + sunP * (W - 20), sy = 34 - Math.sin(sunP * Math.PI) * 26;
    c.fillStyle = 'rgba(255,240,160,0.35)'; c.beginPath(); c.arc(sx, sy, 9, 0, 6.28); c.fill();
    R(c, '#fff3a0', sx - 4, sy - 4, 8, 8); R(c, '#ffffff', sx - 2, sy - 2, 4, 4);
  }
  if (env.night > 0.1 && !env.rainy) {
    const mp = m >= 1110 ? (m - 1110) / 690 : (m + 330) / 690;
    const mx = 12 + Math.min(1, mp) * (W - 24), my = 30 - Math.sin(Math.min(1, mp) * Math.PI) * 20;
    c.globalAlpha = Math.min(1, env.night * 1.5);
    R(c, '#fff8d8', mx - 4, my - 3, 8, 6); R(c, '#fff8d8', mx - 3, my - 4, 6, 8); R(c, env.skyTop, mx + 1, my - 3, 4, 5); c.globalAlpha = 1;
  }
  const cloud = env.rainy ? '#8a94a8' : mix('#ffffff', env.skyTop, env.night * 0.8);
  c.globalAlpha = env.rainy ? 0.95 : 0.7;
  for (let i = 0; i < (env.rainy ? 7 : 3); i++) {
    const cx = ((t / (260 + i * 60) + i * 70) % (W + 60)) - 30, cy = 6 + (i * 13) % 26;
    R(c, cloud, cx, cy, 24, 5); R(c, cloud, cx + 4, cy - 3, 14, 4); R(c, cloud, cx + 14, cy - 2, 10, 4);
  }
  c.globalAlpha = 1;
  room.skyline?.(c, env);
  c.restore();
}

export const rectDist = (px: number, py: number, x: number, y: number, w: number, h: number) => {
  const dx = Math.max(x - px, 0, px - (x + w));
  const dy = Math.max(y - py, 0, py - (y + h));
  return Math.hypot(dx, dy);
};
