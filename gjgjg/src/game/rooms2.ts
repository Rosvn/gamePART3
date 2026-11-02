import { ROOMS, R, hash, woodFloor, mkRoom, skyline, pixText, W, H, type RoomDef, type Env } from './world';

type Ctx = CanvasRenderingContext2D;
const nothing = () => { /* none */ };

/* ---------------------------------------------------------------- shared bits */
function grass(c: Ctx, y: number, h: number, a = '#6cc860', b = '#5cb850') {
  R(c, a, 0, y, W, h);
  for (let i = 0; i < 260; i++) { const x = Math.floor(hash(i * 1.3) * W), yy = y + Math.floor(hash(i * 2.7) * h); R(c, b, x, yy, 1, 2); }
  for (let i = 0; i < 26; i++) { const x = Math.floor(hash(i * 5.1) * W), yy = y + Math.floor(hash(i * 9.3) * h); R(c, ['#ffffff', '#ff9ac8', '#ffe070'][i % 3], x, yy, 1, 1); }
}
function tree(c: Ctx, x: number, y: number, col = '#3c9a48') {
  R(c, 'rgba(0,0,0,0.2)', x - 2, y + 14, 20, 4);
  R(c, '#7a4a2a', x + 6, y + 6, 4, 12);
  R(c, col, x, y - 6, 16, 14); R(c, col, x + 2, y - 10, 12, 4);
  R(c, '#58b860', x + 3, y - 8, 5, 4); R(c, '#2a7a38', x, y + 6, 16, 2);
}
function tiles(c: Ctx, y: number, h: number, a: string, b: string, s = 16) {
  for (let ty = y; ty < y + h; ty += s) for (let tx = 0; tx < W; tx += s) R(c, ((tx + ty) / s) % 2 ? a : b, tx, ty, s, s);
}
function wall(c: Ctx, h: number, a: string, b: string, trim: string) {
  R(c, a, 0, 0, W, h);
  for (let x = 0; x < W; x += 12) R(c, b, x, 0, 6, h - 6);
  R(c, trim, 0, h - 6, W, 6); R(c, '#ffffff', 0, h - 6, W, 1);
}
function table(c: Ctx, x: number, y: number, cloth: string) {
  R(c, 'rgba(0,0,0,0.18)', x, y + 12, 28, 4);
  R(c, cloth, x, y, 28, 12); R(c, '#ffffff', x, y, 28, 2); R(c, '#6a4a3a', x + 3, y + 12, 2, 4); R(c, '#6a4a3a', x + 23, y + 12, 2, 4);
}
function sign(c: Ctx, x: number, y: number, text: string, bg = '#ff5fa8') {
  const w = text.length * 4 + 5;
  R(c, '#3a1f2a', x - 1, y - 1, w + 2, 9); R(c, bg, x, y, w, 7); pixText(c, text, x + 3, y + 1, '#ffffff');
}

/* ============================== CENTRAL PARK ============================== */
function parkBack(c: Ctx) {
  grass(c, 0, H);
  for (let x = -4; x < W; x += 18) tree(c, x, 30, x % 36 ? '#3c9a48' : '#2f8a40');
  // paths
  R(c, '#e8d4a8', 72, 48, 32, H - 48); R(c, '#e8d4a8', 0, 112, W, 32);
  R(c, '#d4bc88', 72, 48, 2, H - 48); R(c, '#d4bc88', 102, 48, 2, H - 48);
  for (let i = 0; i < 30; i++) R(c, '#d8c294', 74 + hash(i) * 28, 50 + hash(i * 3) * 150, 2, 1);
  // pond
  R(c, '#a07850', 94, 78, 52, 36); R(c, '#4ab0e8', 96, 80, 48, 32); R(c, '#7ad0ff', 100, 84, 14, 2); R(c, '#7ad0ff', 120, 98, 18, 2);
  // picnic blanket
  for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 4; xx++) R(c, (xx + yy) % 2 ? '#ff5f7a' : '#ffffff', 18 + xx * 7, 84 + yy * 6, 7, 6);
  R(c, '#c8843a', 26, 80, 10, 6); R(c, '#8a5a2a', 26, 80, 10, 2);
  // bandstand
  R(c, '#ffffff', 14, 150, 44, 22); R(c, '#e8e0f0', 14, 168, 44, 4); R(c, '#ff8ab5', 10, 140, 52, 10); R(c, '#ff5fa8', 10, 148, 52, 2);
  R(c, '#ffffff', 16, 150, 3, 18); R(c, '#ffffff', 52, 150, 3, 18); R(c, '#ffd23c', 34, 156, 6, 6);
  // flowerbeds
  for (let i = 0; i < 6; i++) { R(c, '#58b858', 120 + i * 8, 166, 6, 6); R(c, ['#ff5fa8', '#ffe070', '#b57bff'][i % 3], 122 + i * 8, 166, 2, 2); }
  tree(c, 146, 184); tree(c, 4, 184);
  sign(c, 108, 52, 'TOWN'); sign(c, 2, 102, 'LIBRARY', '#7a5aff'); sign(c, 150, 102, 'MALL', '#25b0d8'); sign(c, 108, 192, 'ROSES', '#e0243c');
}
function parkDyn(c: Ctx, env: Env) {
  const t = env.t;
  // ducks
  for (let i = 0; i < 3; i++) { const x = 100 + ((t / 60 + i * 30) % 40), y = 90 + i * 6; R(c, '#ffffff', x, y, 5, 3); R(c, '#2a8a3a', x + 4, y - 2, 2, 2); R(c, '#ffa020', x + 6, y - 1, 2, 1); }
  // fountain sparkle on pond
  if (Math.floor(t / 300) % 2) R(c, '#ffffff', 118, 92, 2, 2);
}

/* ============================== CAFE ============================== */
function cafeBack(c: Ctx) {
  wall(c, 48, '#f4dcc0', '#ecd0b0', '#a0603a');
  woodFloor(c, 0, 48, W, H - 48, ['#b07a4a', '#a06a3a', '#c08a5a', '#8a5a30']);
  // menu board
  R(c, '#3a2a22', 10, 6, 52, 26); R(c, '#2a3a2a', 12, 8, 48, 22); pixText(c, 'LATTE', 16, 11, '#ffffff'); pixText(c, 'CAKE', 16, 19, '#ffd0e0');
  R(c, '#ff8ab5', 44, 12, 10, 10); R(c, '#ffffff', 46, 14, 6, 2);
  // window
  R(c, '#8a5a3a', 112, 6, 54, 30); R(c, '#bfe4f4', 115, 9, 48, 24); R(c, '#e8f8ff', 118, 11, 6, 14);
  R(c, '#ff8ab5', 110, 4, 58, 4); for (let i = 0; i < 7; i++) R(c, i % 2 ? '#ffffff' : '#ff5fa8', 110 + i * 8, 4, 8, 6);
  // counter
  R(c, '#8a5a3a', 0, 48, 96, 18); R(c, '#c08a5a', 0, 48, 96, 4); R(c, '#e8e0d0', 0, 46, 96, 3);
  R(c, '#c8c8d0', 10, 36, 14, 12); R(c, '#2a2a30', 12, 40, 10, 6); R(c, '#ffffff', 30, 40, 6, 6); R(c, '#ff8ab5', 40, 40, 6, 6);
  // cake case
  R(c, '#e8e0f0', 112, 48, 64, 18); R(c, '#bfeaff', 114, 50, 60, 10);
  for (let i = 0; i < 5; i++) { R(c, ['#ffd0e0', '#8a4a2a', '#fff0a0', '#ff8ab5', '#ffffff'][i], 117 + i * 12, 53, 8, 6); R(c, '#e0243c', 120 + i * 12, 52, 2, 2); }
  // tables
  table(c, 22, 112, '#ff9ac8'); table(c, 118, 112, '#9ad0ff'); table(c, 22, 160, '#fff0a0'); table(c, 118, 160, '#c8a8ff');
  // rug at door
  R(c, '#e0607a', 64, 192, 48, 14); R(c, '#ffb0c4', 66, 194, 44, 10);
}

/* ============================== MALL ============================== */
function mallBack(c: Ctx) {
  wall(c, 48, '#f0f0fa', '#e4e4f4', '#c8b0f0');
  tiles(c, 48, H - 48, '#f8f4ff', '#ece4fa');
  // boutique front
  R(c, '#ff5fa8', 0, 4, 64, 10); pixText(c, 'BOUTIQUE', 8, 6, '#ffffff');
  R(c, '#bfeaff', 4, 16, 56, 32); R(c, '#ffffff', 6, 18, 8, 26);
  for (let i = 0; i < 3; i++) { R(c, '#d8c8e8', 18 + i * 14, 20, 1, 4); R(c, ['#e83fb4', '#f6a7d2', '#0f9a62'][i], 14 + i * 14, 24, 10, 18); }
  // claw machine
  R(c, '#ffd23c', 80, 10, 28, 38); R(c, '#bfeaff', 83, 14, 22, 20); R(c, '#ff5fa8', 83, 36, 22, 10);
  R(c, '#888', 93, 14, 1, 8); R(c, '#c8c8c8', 90, 22, 7, 3);
  for (let i = 0; i < 6; i++) R(c, ['#ff8ab5', '#7ad0ff', '#ffe070', '#b57bff'][i % 4], 85 + (i % 3) * 7, 28 + Math.floor(i / 3) * 3, 5, 4);
  // spa door
  R(c, '#2ec4c4', 124, 4, 52, 10); pixText(c, 'GLOW SPA', 130, 6, '#ffffff');
  R(c, '#e0fff8', 132, 16, 36, 32); R(c, '#a0e0e0', 148, 16, 2, 32); R(c, '#58b8b8', 144, 30, 2, 4); R(c, '#58b8b8', 152, 30, 2, 4);
  // central planter and benches
  R(c, '#c8b0f0', 76, 124, 24, 18); R(c, '#58b858', 78, 116, 20, 10); R(c, '#ff5fa8', 82, 114, 4, 4); R(c, '#ffe070', 90, 116, 4, 4);
  R(c, '#ffffff', 20, 176, 32, 6); R(c, '#c8b0f0', 20, 182, 32, 4); R(c, '#ffffff', 124, 176, 32, 6); R(c, '#c8b0f0', 124, 182, 32, 4);
  // shopping bags decor
  R(c, '#ff5fa8', 150, 100, 8, 10); R(c, '#2ec4c4', 160, 102, 8, 8);
}
function mallDyn(c: Ctx, env: Env) {
  const t = env.t;
  const on = Math.floor(t / 250) % 2;
  R(c, on ? '#ffffff' : '#ffd23c', 80, 8, 28, 2);
  if (on) R(c, '#ffffff', 22, 30, 2, 2);
}

/* ============================== SPA ============================== */
function spaBack(c: Ctx) {
  wall(c, 48, '#e0f4f0', '#d0ece8', '#58b8b8');
  tiles(c, 48, H - 48, '#f4fffc', '#e4f6f2');
  // bamboo
  for (let x = 4; x < W; x += 22) { R(c, '#7ac860', x, 4, 4, 40); for (let y = 10; y < 44; y += 10) R(c, '#5aa848', x, y, 4, 1); R(c, '#9ae080', x + 4, 12, 6, 3); }
  // hot spring pool
  R(c, '#b8a898', 30, 78, 116, 52); R(c, '#9a8a7a', 30, 126, 116, 4); R(c, '#58d0e8', 34, 82, 108, 42); R(c, '#a0f0ff', 40, 88, 30, 2); R(c, '#a0f0ff', 96, 108, 34, 2);
  for (let i = 0; i < 8; i++) R(c, '#c8c0b0', 30 + i * 15, 76, 10, 6);
  // massage beds
  R(c, '#ffffff', 2, 162, 30, 14); R(c, '#e0f0f0', 2, 172, 30, 4); R(c, '#ffd0e0', 4, 160, 10, 6);
  R(c, '#ffffff', 2, 186, 30, 14); R(c, '#e0f0f0', 2, 196, 30, 4); R(c, '#ffd0e0', 4, 184, 10, 6);
  // candles & stones
  for (let i = 0; i < 4; i++) { R(c, '#f8f0e0', 150 + (i % 2) * 10, 160 + Math.floor(i / 2) * 14, 4, 6); }
  R(c, '#4a4a54', 146, 190, 10, 6); R(c, '#5a5a64', 156, 192, 8, 5);
}
function spaDyn(c: Ctx, env: Env) {
  const t = env.t;
  c.globalAlpha = 0.35;
  for (let i = 0; i < 8; i++) { const y = 80 - ((t / 40 + i * 12) % 40); R(c, '#ffffff', 40 + i * 13 + Math.sin(t / 500 + i) * 3, y + 4, 4, 3); }
  c.globalAlpha = 1;
  for (let i = 0; i < 4; i++) R(c, '#ffd23c', 151 + (i % 2) * 10, 157 + Math.floor(i / 2) * 14 + (Math.floor(t / 160 + i) % 2), 2, 3);
}

/* ============================== LIBRARY ============================== */
function libraryBack(c: Ctx) {
  wall(c, 48, '#6a4a3a', '#5a3a2a', '#3a2418');
  woodFloor(c, 0, 48, W, H - 48, ['#8a5a3a', '#7a4a2a', '#9a6a4a', '#6a3a1a']);
  const bc = ['#e0455a', '#3a8ae0', '#f2c040', '#58b858', '#a870e0', '#ff8a3c', '#f4f0e6'];
  for (let sx = 0; sx < 64; sx += 64) {
    R(c, '#3a2418', sx, 2, 64, 62);
    for (const sy of [6, 22, 38]) { R(c, '#5a3a2a', sx + 2, sy + 13, 60, 2); for (let i = 0; i < 19; i++) R(c, bc[(i * 3 + sy) % 7], sx + 3 + i * 3, sy + 2 + (i % 3), 2, 11 - (i % 3)); }
  }
  // star chart desk
  R(c, '#1c1f4e', 116, 6, 56, 30); for (let i = 0; i < 20; i++) R(c, '#ffffff', 118 + hash(i) * 52, 8 + hash(i * 4) * 26, 1, 1);
  R(c, '#ffe070', 140, 18, 2, 2); R(c, '#ffe070', 150, 14, 2, 2); R(c, '#7ad0ff', 130, 26, 2, 2);
  R(c, '#8a5a3a', 112, 48, 64, 16); R(c, '#a07050', 112, 48, 64, 3); R(c, '#c8a060', 150, 36, 4, 12); R(c, '#e8c068', 140, 32, 20, 6);
  // reading tables + lamps
  table(c, 28, 112, '#2a6a3a'); table(c, 116, 112, '#2a6a3a'); table(c, 28, 160, '#2a6a3a'); table(c, 116, 160, '#2a6a3a');
  for (const [x, y] of [[38, 104], [126, 104], [38, 152], [126, 152]]) { R(c, '#c8a020', x, y, 2, 8); R(c, '#2a8a3a', x - 3, y - 3, 8, 4); }
  R(c, '#8a2a3a', 0, 96, 176, 4);
}

/* ============================== SUNSET PIER ============================== */
function pierBack(c: Ctx) {
  R(c, '#2a9ad8', 0, 30, W, H - 30);
  for (let i = 0; i < 60; i++) R(c, '#5ac0f0', hash(i) * W, 34 + hash(i * 3) * 170, 6, 1);
  // boardwalk
  R(c, '#8a5a30', 0, 96, W, 112); for (let y = 96; y < H; y += 8) { R(c, '#a06a3a', 0, y, W, 7); R(c, '#6a4020', 0, y + 7, W, 1); }
  for (let x = 6; x < W; x += 40) R(c, '#5a3418', x, 90, 4, 10);
  R(c, '#6a4020', 0, 94, W, 3);
  // boat
  R(c, '#ffffff', 112, 62, 44, 10); R(c, '#e0243c', 112, 70, 44, 4); R(c, '#8a5a30', 132, 38, 2, 24); R(c, '#fff0e0', 134, 40, 16, 18);
  // lighthouse
  R(c, '#ffffff', 16, 18, 14, 40); for (let y = 22; y < 58; y += 10) R(c, '#e0243c', 16, y, 14, 5); R(c, '#3a3a4a', 14, 12, 18, 6); R(c, '#ffe070', 18, 8, 10, 6);
  // seafood shack
  R(c, '#f4f0e6', 0, 160, 48, 34); R(c, '#2a8ac8', 0, 152, 52, 10); for (let i = 0; i < 6; i++) R(c, i % 2 ? '#ffffff' : '#2a8ac8', i * 9, 160, 9, 4);
  R(c, '#8a5a3a', 0, 182, 48, 8); pixText(c, 'FISH', 14, 168, '#2a6a9a');
  // fishing spot
  R(c, '#6a4020', 64, 96, 48, 4); R(c, '#c8a060', 86, 100, 4, 6);
  // crates
  R(c, '#b07a3a', 140, 170, 14, 12); R(c, '#8a5a2a', 140, 175, 14, 1); R(c, '#b07a3a', 154, 176, 12, 10);
}
function pierSky(c: Ctx, env: Env) { skyline(c, 40, 70, 30, 14, env, 31, 0.7); }
function pierDyn(c: Ctx, env: Env) {
  const t = env.t;
  for (let i = 0; i < 10; i++) { const x = (i * 23 + t / 30) % W; R(c, '#a0e0ff', x, 40 + (i % 5) * 10, 5, 1); }
  // gull
  const gx = (t / 25) % (W + 40) - 20; R(c, '#ffffff', gx, 22, 2, 1); R(c, '#ffffff', gx + 3, 22, 2, 1); R(c, '#ffffff', gx + 2, 23, 1, 1);
  if (env.night > 0.3) { c.globalAlpha = 0.4 + 0.3 * Math.sin(t / 200); R(c, '#ffe070', 8, 6, 30, 10); c.globalAlpha = 1; }
  // bobber
  R(c, '#e0243c', 88, 112 + Math.round(Math.sin(t / 300)), 3, 3);
}

/* ============================== ROSE GARDEN ============================== */
function gardenBack(c: Ctx) {
  grass(c, 0, H, '#5cb850', '#4ca840');
  // hedges top
  R(c, '#2a7a38', 0, 0, W, 48); for (let x = 0; x < W; x += 8) R(c, '#3a8a48', x, 2 + (x % 16 ? 2 : 0), 6, 40);
  R(c, '#1f6a2c', 0, 44, W, 4);
  // path
  R(c, '#f0e0c8', 76, 48, 24, H - 48); R(c, '#f0e0c8', 24, 120, 128, 16);
  // gazebo
  R(c, '#ffffff', 60, 66, 56, 30); R(c, '#ff9ac8', 54, 56, 68, 12); R(c, '#ff5fa8', 60, 50, 56, 8); R(c, '#ffd0e0', 82, 44, 12, 6);
  R(c, '#ffffff', 62, 68, 4, 28); R(c, '#ffffff', 110, 68, 4, 28); R(c, '#e8d8f0', 60, 92, 56, 4);
  // rose bushes
  for (const [bx, by] of [[0, 96], [144, 96], [0, 160], [144, 160]]) {
    R(c, '#2a7a38', bx, by, 32, 30); R(c, '#3a8a48', bx + 2, by + 2, 28, 24);
    for (let i = 0; i < 9; i++) R(c, i % 3 === 0 ? '#ffffff' : '#e0243c', bx + 4 + (i % 3) * 9, by + 4 + Math.floor(i / 3) * 8, 4, 4);
  }
  // fountain statue
  R(c, '#d8d8e0', 78, 176, 20, 12); R(c, '#7ad0ff', 80, 178, 16, 6); R(c, '#e8e8f0', 85, 162, 6, 14);
}
function gardenDyn(c: Ctx, env: Env) {
  const t = env.t;
  // butterflies
  for (let i = 0; i < 3; i++) { const x = 30 + i * 50 + Math.sin(t / 600 + i) * 18, y = 110 + Math.cos(t / 450 + i * 2) * 20; const f = Math.floor(t / 120 + i) % 2; R(c, ['#ff8ab5', '#ffe070', '#b57bff'][i], x, y, f ? 2 : 1, 2); R(c, ['#ff8ab5', '#ffe070', '#b57bff'][i], x + 3, y, f ? 2 : 1, 2); }
  if (Math.floor(t / 250) % 2) R(c, '#ffffff', 87, 176, 2, 2);
}

/* ============================== DEFINITIONS ============================== */
export const NEW_ROOMS: Record<string, RoomDef> = {
  park: mkRoom({
    id: 'park', name: 'Central Park', outdoor: true, skyRects: [[0, 0, W, 24]],
    props: [
      { id: 'picnic', x: 1, y: 5, w: 2, h: 2, interact: 'picnic', label: 'Picnic Blanket · Snack', solid: null },
      { id: 'pond', x: 6, y: 5, w: 3, h: 2, interact: 'pond', label: 'Feed the Ducks' },
      { id: 'band', x: 1, y: 9, w: 2, h: 2, interact: 'busk', label: 'Bandstand · Perform' },
      { id: 'flowers', x: 7, y: 10, w: 3, h: 1, solid: null },
      { id: 't1', x: 9, y: 11, w: 1, h: 1 }, { id: 't2', x: 0, y: 11, w: 1, h: 1 },
    ],
    blocks: [[0, 0, 4, 3], [7, 0, 4, 3]],
    exits: [
      { x: 64, y: 30, w: 48, h: 6, to: 'town', sx: 88, sy: 184, dir: 'up', label: 'Town Square' },
      { x: 0, y: 112, w: 4, h: 32, to: 'library', sx: 164, sy: 132, dir: 'left', label: 'City Library' },
      { x: 172, y: 112, w: 4, h: 32, to: 'mall', sx: 12, sy: 132, dir: 'right', label: 'Glamour Mall' },
      { x: 64, y: 204, w: 48, h: 4, to: 'garden', sx: 56, sy: 62, dir: 'down', label: 'Rose Garden' },
    ],
    spots: [[3, 4], [7, 4], [4, 8], [8, 8], [3, 11], [6, 11], [9, 7], [2, 7], [5, 10], [8, 4]],
    lights: [{ x: 88, y: 120, r: 50, c: '#ffe0a0' }],
    back: parkBack, dynamic: parkDyn,
  }),
  cafe: mkRoom({
    id: 'cafe', name: 'Sweet Café', outdoor: false, skyRects: [],
    props: [
      { id: 'counter', x: 0, y: 3, w: 6, h: 1, interact: 'latte', label: 'Order a Latte · 20💎' },
      { id: 'cakes', x: 7, y: 3, w: 4, h: 1, interact: 'cake', label: 'Cake Counter · Gift Cake' },
      { id: 'tb1', x: 1, y: 7, w: 2, h: 1 }, { id: 'tb2', x: 7, y: 7, w: 2, h: 1 },
      { id: 'tb3', x: 1, y: 10, w: 2, h: 1 }, { id: 'tb4', x: 7, y: 10, w: 2, h: 1 },
    ],
    blocks: [[0, 0, 11, 3]],
    exits: [{ x: 56, y: 202, w: 64, h: 6, to: 'town', sx: 88, sy: 76, dir: 'down', label: 'Town Square' }],
    spots: [[4, 5], [6, 5], [3, 8], [6, 8], [4, 11], [9, 5], [1, 5], [9, 9]],
    lights: [{ x: 88, y: 100, r: 70, c: '#ffd8a0' }],
    back: cafeBack, dynamic: nothing,
  }),
  mall: mkRoom({
    id: 'mall', name: 'Glamour Mall', outdoor: false, skyRects: [],
    props: [
      { id: 'shop', x: 0, y: 3, w: 4, h: 1, interact: 'shop', label: 'Luxury Boutique · Shop' },
      { id: 'claw', x: 5, y: 3, w: 2, h: 1, interact: 'claw', label: 'Claw Machine · 50💎' },
      { id: 'spadoor', x: 8, y: 3, w: 3, h: 1, interact: 'spadoor', label: 'Enter Glow Spa' },
      { id: 'plant', x: 5, y: 7, w: 1, h: 2 },
      { id: 'bn1', x: 1, y: 11, w: 2, h: 1 }, { id: 'bn2', x: 8, y: 11, w: 2, h: 1 },
      { id: 'catwalk', x: 7, y: 6, w: 3, h: 1, interact: 'runway', label: 'Runway · Strike a Pose', solid: null },
    ],
    blocks: [[0, 0, 11, 3]],
    exits: [{ x: 0, y: 112, w: 4, h: 32, to: 'park', sx: 164, sy: 128, dir: 'left', label: 'Central Park' }],
    spots: [[2, 5], [4, 5], [7, 5], [3, 9], [8, 9], [5, 10], [2, 7], [9, 8]],
    lights: [{ x: 88, y: 110, r: 80, c: '#ffffff' }],
    back: mallBack, dynamic: mallDyn,
  }),
  spa: mkRoom({
    id: 'spa', name: 'Glow Spa', outdoor: false, skyRects: [],
    props: [
      { id: 'spring', x: 2, y: 5, w: 7, h: 3, interact: 'soak', label: 'Hot Spring · Soak' },
      { id: 'massage', x: 0, y: 10, w: 2, h: 3, interact: 'massage', label: 'Massage · Cure Heartbreak' },
      { id: 'candles', x: 9, y: 10, w: 2, h: 2 },
    ],
    blocks: [[0, 0, 11, 3]],
    exits: [{ x: 56, y: 202, w: 64, h: 6, to: 'mall', sx: 152, sy: 76, dir: 'down', label: 'Glamour Mall' }],
    spots: [[3, 4], [5, 4], [7, 4], [4, 9], [7, 9], [5, 11]],
    lights: [{ x: 88, y: 100, r: 70, c: '#a0fff0' }],
    back: spaBack, dynamic: spaDyn,
  }),
  library: mkRoom({
    id: 'library', name: 'City Library', outdoor: false, skyRects: [],
    props: [
      { id: 'books', x: 0, y: 3, w: 4, h: 1, interact: 'study', label: 'Study · Earn Gems' },
      { id: 'stars', x: 7, y: 3, w: 4, h: 1, interact: 'stars', label: 'Star Charts · Read' },
      { id: 'tb1', x: 1, y: 7, w: 2, h: 1 }, { id: 'tb2', x: 7, y: 7, w: 2, h: 1 },
      { id: 'tb3', x: 1, y: 10, w: 2, h: 1 }, { id: 'tb4', x: 7, y: 10, w: 2, h: 1 },
    ],
    blocks: [[0, 0, 11, 3]],
    exits: [{ x: 172, y: 112, w: 4, h: 32, to: 'park', sx: 12, sy: 128, dir: 'right', label: 'Central Park' }],
    spots: [[4, 5], [6, 5], [4, 8], [6, 9], [4, 11], [9, 5], [9, 9]],
    lights: [{ x: 40, y: 110, r: 40, c: '#ffe0a0' }, { x: 130, y: 110, r: 40, c: '#ffe0a0' }],
    back: libraryBack, dynamic: nothing,
  }),
  pier: mkRoom({
    id: 'pier', name: 'Sunset Pier', outdoor: true, skyRects: [[0, 0, W, 30]],
    props: [
      { id: 'fish', x: 4, y: 6, w: 3, h: 1, interact: 'fish', label: 'Fishing Spot · Cast' },
      { id: 'shack', x: 0, y: 10, w: 3, h: 2, interact: 'shack', label: 'Seafood Shack' },
      { id: 'crates', x: 9, y: 10, w: 2, h: 2 },
    ],
    blocks: [[0, 0, 11, 6]],
    exits: [{ x: 0, y: 100, w: 4, h: 56, to: 'beach', sx: 164, sy: 124, dir: 'left', label: 'Beach Resort' }],
    spots: [[2, 7], [8, 7], [5, 9], [7, 11], [4, 12], [9, 8]],
    lights: [{ x: 20, y: 20, r: 40, c: '#ffe070' }],
    back: pierBack, skyline: pierSky, dynamic: pierDyn,
  }),
  garden: mkRoom({
    id: 'garden', name: 'Rose Garden', outdoor: true, skyRects: [],
    props: [
      { id: 'gazebo', x: 4, y: 4, w: 3, h: 2, interact: 'gazebo', label: 'Gazebo · Daydream' },
      { id: 'rose1', x: 0, y: 6, w: 2, h: 2, interact: 'rose', label: 'Pick a Rose 🌹' },
      { id: 'rose2', x: 9, y: 6, w: 2, h: 2, interact: 'rose', label: 'Pick a Rose 🌹' },
      { id: 'rose3', x: 0, y: 10, w: 2, h: 2 }, { id: 'rose4', x: 9, y: 10, w: 2, h: 2 },
      { id: 'statue', x: 5, y: 11, w: 1, h: 1 },
    ],
    blocks: [[0, 0, 4, 3], [7, 0, 4, 3]],
    exits: [{ x: 64, y: 30, w: 48, h: 6, to: 'park', sx: 88, sy: 190, dir: 'up', label: 'Central Park' }],
    spots: [[3, 7], [7, 7], [3, 9], [7, 9], [5, 8], [3, 12], [7, 12]],
    lights: [{ x: 88, y: 80, r: 50, c: '#ffd0e0' }],
    back: gardenBack, dynamic: gardenDyn,
  }),
};

Object.assign(ROOMS, NEW_ROOMS);

// Town: draw a little path sign toward the park
const townDyn = ROOMS.town.dynamic;
ROOMS.town.dynamic = (c: Ctx, env: Env) => { townDyn(c, env); R(c, '#e8d4a8', 80, 196, 16, 12); sign(c, 98, 198, 'PARK', '#58b858'); };
