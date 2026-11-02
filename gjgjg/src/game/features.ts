import type { Game } from './engine';
import { audio } from './audio';
import { KENS } from './kens';
import type { RoomId } from './kens';
import { ROOMS, mkRoom, R, TS, W, H, type Prop } from './world';
import './rooms2';
import { drawBarbie, drawEmote } from './sprites';
import {
  FISH, FISH_BY_ID, REAL_FISH, RODS, BAITS, BAIT_BY_ID, QUESTS, QUEST_BY_ID, PETS, PET_BY_ID, TROPHIES, SPOT_INFO,
  RARITY_COL, RARITY_XP, rarityIdx, bondLevel,
  type FishDef, type SpotId, type BagFish, type QuestState,
} from './extras';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

export const BAG_MAX = 40;

/* =====================================================================
 *  HELPERS
 * ===================================================================== */
export function timeBucket(g: Game): 'day' | 'dusk' | 'night' {
  const m = g.minutes;
  if (m >= 1260 || m < 400) return 'night';
  if (m >= 1050) return 'dusk';
  return 'day';
}
export const bondOf = (g: Game, id: string) => bondLevel(g.ex.pets[id] || 0);
export const activePetId = (g: Game) => (g.ex.pet && g.ex.pets[g.ex.pet] !== undefined ? g.ex.pet : null);
const petBond = (g: Game, id: string) => (activePetId(g) === id ? bondOf(g, id) : -1);

export function luckOf(g: Game): number {
  const ex = g.ex;
  let l = RODS[ex.rod].luck + BAIT_BY_ID[ex.bait].luck;
  const fox = petBond(g, 'fox'); if (fox >= 0) l += 0.12 * (fox + 1);
  if (g.weather === 'rainy') l += 0.15;
  if (timeBucket(g) === 'dusk') l += 0.1;
  return l;
}
export function biteOf(g: Game): number {
  const ex = g.ex;
  let b = RODS[ex.rod].bite + BAIT_BY_ID[ex.bait].bite;
  const pu = petBond(g, 'puppy'); if (pu >= 0) b += 0.06 + 0.04 * pu;
  return Math.max(-0.6, Math.min(0.78, b));
}
export function barOf(g: Game): number {
  const pu = petBond(g, 'puppy');
  return RODS[g.ex.rod].bar + (pu >= 0 ? 2 + pu * 2 : 0);
}
export function fishValue(g: Game, it: BagFish) {
  const fotd = it.id === g.ex.fotd ? 1.5 : 1;
  const fox = petBond(g, 'fox'); const fm = fox >= 0 ? 1 + 0.05 * (fox + 1) : 1;
  return Math.round(it.v * fotd * fm);
}

/* =====================================================================
 *  NOTIFICATIONS, QUESTS, TROPHIES
 * ===================================================================== */
export function notify(g: Game, text: string) { g.notes.push(text); }

export function checkTrophies(g: Game) {
  const ex = g.ex;
  for (const t of TROPHIES) {
    if (ex.trophies.includes(t.id)) continue;
    if (!t.test(ex.stats, ex)) continue;
    ex.trophies.push(t.id);
    g.gems += t.gems;
    notify(g, `🏆 Trophy: ${t.name}! +${t.gems.toLocaleString()} 💎`);
    audio.play('masterpiece');
    if (g.mode === 'play') g.confetti(g.player.x, g.player.y - 20, 24);
  }
}

function completeQuest(g: Game, q: QuestState) {
  const d = QUEST_BY_ID[q.id];
  const ex = g.ex;
  q.done = true;
  g.gems += d.gems; g.charm += d.charm; g.dailyPoints += d.charm;
  ex.stats.quests = (ex.stats.quests || 0) + 1;
  notify(g, `📋 Quest done: ${d.text} · +${d.gems} 💎 +${d.charm} ✨`);
  audio.play('unlock');
  if (ex.quests.length && ex.quests.every((x) => x.done)) {
    ex.streak = ex.allDoneDay === g.day - 1 ? ex.streak + 1 : 1;
    ex.allDoneDay = g.day;
    const bonus = 200 + 100 * Math.min(ex.streak, 5);
    g.gems += bonus;
    notify(g, `🎉 ALL daily quests clear! Streak ${ex.streak} 🔥 · +${bonus} 💎 bonus`);
  }
}

export function track(g: Game, key: string, n = 1) {
  const ex = g.ex;
  ex.stats[key] = (ex.stats[key] || 0) + n;
  for (const q of ex.quests) {
    const d = QUEST_BY_ID[q.id];
    if (q.done || d.key !== key) continue;
    q.prog = Math.min(d.goal, q.prog + n);
    if (q.prog >= d.goal) completeQuest(g, q);
  }
  checkTrophies(g);
}

export function onEnterRoom(g: Game, room: RoomId) {
  const ex = g.ex;
  if (!ex.visited.includes(room)) {
    ex.visited.push(room);
    track(g, 'visit');
    if (ex.visited.length >= 6 && !ex.stats.visit6) { ex.stats.visit6 = 1; checkTrophies(g); }
  }
  const p = g.petS; p.x = g.player.x; p.y = g.player.y + 2;
  // kitten senses stars
  if (activePetId(g) === 'kitten' && ex.stars.some((s) => s.room === room)) g.say('🐱 Mochi perks up... a Lucky Star is nearby!', 2400);
}

/** Roll quests, lucky stars and fish-of-the-day for the current day. */
export function rollDaily(g: Game) {
  const ex = g.ex;
  if (ex.allDoneDay < g.day - 1) ex.streak = 0;
  const qs: QuestState[] = [];
  const keys = new Set<string>();
  for (const q of shuffle(QUESTS)) {
    if (keys.has(q.key)) continue;
    keys.add(q.key); qs.push({ id: q.id, prog: 0, done: false });
    if (qs.length >= 3) break;
  }
  ex.quests = qs; ex.questDay = g.day; ex.visited = []; ex.fotd = pick(REAL_FISH).id;
  const rooms = shuffle((Object.keys(ROOMS) as RoomId[]).filter((r) => r !== 'penthouse')).slice(0, 4);
  ex.stars = rooms.map((room) => {
    const def = ROOMS[room];
    for (let i = 0; i < 80; i++) {
      const x = rnd(20, W - 20), y = rnd(60, H - 18);
      if (!g.boxFree(def, x, y, 4)) continue;
      if (def.exits.some((e) => x > e.x - 14 && x < e.x + e.w + 14 && y > e.y - 14 && y < e.y + e.h + 14)) continue;
      if (def.props.some((p) => p.interact && x > p.x * TS - 12 && x < (p.x + p.w) * TS + 12 && y > p.y * TS - 6 && y < (p.y + p.h) * TS + 14)) continue;
      return { room, x: Math.round(x), y: Math.round(y) };
    }
    return { room, x: 88, y: 150 };
  });
}

/* =====================================================================
 *  LUCKY STARS
 * ===================================================================== */
export function findStar(g: Game): { idx: number; dist: number } | null {
  let best: { idx: number; dist: number } | null = null;
  g.ex.stars.forEach((s, idx) => {
    if (s.room !== g.room) return;
    const d = Math.hypot(g.player.x - s.x, g.player.y - 4 - s.y);
    if (d < 17 && (!best || d < best.dist)) best = { idx, dist: d };
  });
  return best;
}
export function collectStar(g: Game, idx: number) {
  const s = g.ex.stars[idx];
  if (!s) return;
  g.ex.stars.splice(idx, 1);
  let gems = Math.round(25 + g.day * 3 + rnd(0, 35));
  if (petBond(g, 'kitten') >= 3) gems = Math.round(gems * 1.5);
  g.gems += gems; g.charm += 80; g.dailyPoints += 80;
  audio.play('gem'); setTimeout(() => audio.play('chime'), 120);
  g.burst(s.x, s.y - 8, 16, ['#ffe080', '#ffffff', '#ff9ad0'], 'spark', 45);
  g.popup(`+${gems} 💎`, s.x, s.y - 14, '#ffe080', true);
  g.say(`⭐ Lucky Star found! +${gems} 💎 (${4 - g.ex.stars.length}/4 today)`);
  track(g, 'star');
  if (!g.ex.stars.length) {
    g.gems += 300; g.charm += 600; g.dailyPoints += 600;
    notify(g, '🌟 ALL 4 Lucky Stars found! +300 💎 +600 ✨');
    g.confetti(g.player.x, g.player.y - 20, 40);
  }
}
export function drawStars(c: CanvasRenderingContext2D, g: Game) {
  g.ex.stars.forEach((s, i) => {
    if (s.room !== g.room) return;
    const t = g.t;
    const bob = Math.sin(t / 300 + i) * 2;
    const x = Math.round(s.x), y = Math.round(s.y - 9 + bob);
    const gr = c.createRadialGradient(x, y, 1, x, y, 11);
    gr.addColorStop(0, `rgba(255,230,120,${0.55 + 0.2 * Math.sin(t / 200)})`); gr.addColorStop(1, 'rgba(255,230,120,0)');
    c.fillStyle = gr; c.fillRect(x - 12, y - 12, 24, 24);
    const rows = ['..X..', '..X..', 'XXXXX', '.XXX.', '.X.X.'];
    rows.forEach((r, ry) => { for (let rx = 0; rx < 5; rx++) if (r[rx] === 'X') { c.fillStyle = rx === 2 && ry === 2 ? '#ffffff' : '#ffd23c'; c.fillRect(x - 2 + rx, y - 2 + ry, 1, 1); } });
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x - 3, s.y - 1, 6, 1);
    if (Math.floor(t / 400 + i) % 3 === 0) { c.fillStyle = '#fff'; c.fillRect(x + 4, y - 4, 1, 1); c.fillRect(x - 5, y + 3, 1, 1); }
  });
}

/* =====================================================================
 *  PET COMPANION
 * ===================================================================== */
export interface PetState { x: number; y: number; dir: 'left' | 'right'; ft: number; moving: boolean; heartT: number; stuck: number }
export const newPetState = (): PetState => ({ x: 88, y: 150, dir: 'right', ft: 0, moving: false, heartT: 4, stuck: 0 });

export function updatePet(g: Game, dt: number) {
  const id = activePetId(g);
  if (!id) return;
  const p = g.petS, pl = g.player;
  const back = pl.dir === 'left' ? 1 : pl.dir === 'right' ? -1 : 0;
  const tx = pl.x + back * 11 + (back === 0 ? (p.dir === 'left' ? 9 : -9) : 0);
  const ty = pl.y + (pl.dir === 'up' ? 8 : pl.dir === 'down' ? -2 : 1);
  const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
  if (d > 110) { p.x = pl.x; p.y = pl.y + 2; return; }
  if (d > 7) {
    const sp = Math.min(d * 3.2, 74) * dt;
    const nx = p.x + (dx / d) * sp, ny = p.y + (dy / d) * sp;
    const def = g.roomDef;
    let moved = false;
    if (g.boxFree(def, nx, p.y, 2)) { p.x = nx; moved = true; }
    if (g.boxFree(def, p.x, ny, 2)) { p.y = ny; moved = true; }
    p.stuck = moved ? 0 : p.stuck + dt;
    if (p.stuck > 1.2) { p.x = pl.x; p.y = pl.y + 1; p.stuck = 0; }
    p.moving = moved;
    if (Math.abs(dx) > 1.5) p.dir = dx > 0 ? 'right' : 'left';
    p.ft += dt * 10;
  } else {
    p.moving = false; p.stuck = 0;
    p.heartT -= dt;
    if (p.heartT <= 0) { p.heartT = rnd(5, 9); g.hearts(p.x, p.y - 12, 1); }
  }
}

export function drawPet(c: CanvasRenderingContext2D, g: Game) {
  const id = activePetId(g);
  if (!id) return;
  const def = PET_BY_ID[id];
  const p = g.petS;
  const f = p.dir === 'right' ? 1 : -1;
  const hop = p.moving ? -Math.abs(Math.sin(p.ft)) * 1.6 : 0;
  const bx = Math.round(p.x), by = Math.round(p.y + hop);
  const rr = (dx: number, dy: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(f > 0 ? bx + dx : bx - dx - w, by + dy, w, h); };
  c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(Math.round(p.x) - 5, Math.round(p.y) - 1, 10, 2);
  const leg = p.moving ? Math.floor(p.ft) % 2 : 0;
  const dark = '#00000030';
  rr(-4, -2, 2, 2 + (leg ? 0 : 0), def.body); rr(-4 + (leg ? 1 : 0), -1, 2, 1, '#3a2a2a');
  rr(2, -2, 2, 2, def.body); rr(2 - (leg ? 1 : 0), -1, 2, 1, '#3a2a2a');
  rr(-5, -7, 10, 6, def.body);
  rr(-3, -3, 6, 2, def.accent);
  // tail
  if (def.ear === 'long') rr(-7, -5, 3, 3, '#ffffff');
  else if (id === 'fox') { rr(-9, -8, 4, 4, def.body); rr(-10, -8, 2, 3, '#ffffff'); }
  else rr(-7, -9 + (Math.floor(g.t / 250) % 2), 2, 5, def.body);
  // head
  rr(3, -11, 6, 6, def.body);
  rr(6, -7, 3, 2, def.accent);
  if (def.ear === 'point') { rr(3, -13, 2, 2, def.body); rr(7, -13, 2, 2, def.body); rr(4, -12, 1, 1, '#ff9ab0'); }
  else if (def.ear === 'long') { rr(4, -17, 2, 6, def.body); rr(7, -16, 2, 5, def.body); rr(4, -16, 1, 4, def.accent); }
  else { rr(2, -11, 2, 4, '#7a4a2a'); rr(8, -11, 1, 3, '#7a4a2a'); }
  rr(6, -10, 1, 1, '#2a1a2a'); rr(9, -8, 1, 1, '#2a1a2a');
  void dark;
  if (id === 'kitten' && g.ex.stars.some((s) => s.room === g.room) && Math.floor(g.t / 1500) % 2 === 0) drawEmote(c, p.x, p.y - 12, 'star', g.t);
}

/* =====================================================================
 *  FISHING
 * ===================================================================== */
export interface FishResult { fish: FishDef; size: number; v: number; perfect: boolean; isNew: boolean; record: boolean; note: string; soldAuto: boolean }
export interface FishState {
  spot: SpotId; stage: 'ready' | 'wait' | 'bite' | 'fight' | 'result'; t: number; wait: number; msg: string; window: number;
  fish: FishDef | null; zone: number; zv: number; fpos: number; ftgt: number; fre: number; prog: number; perfect: boolean; fightT: number; grace: number;
  result: FishResult | null; casts: number;
}
const MX = 150, MY = 70, MH = 104, MW = 14;

export function startFishing(g: Game, spot: SpotId) {
  if (g.mode !== 'play' || g.fade) return;
  const info = SPOT_INFO[spot];
  if (g.room !== info.room) return;
  g.player.x = info.stand[0]; g.player.y = info.stand[1]; g.player.dir = 'up'; g.player.frame = 0; g.player.moving = false;
  g.target = null; g.input.ax = 0; g.input.ay = 0;
  g.mode = 'fishing';
  g.fish = { spot, stage: 'ready', t: 0, wait: 0, msg: '', window: 1, fish: null, zone: 0, zv: 0, fpos: 0, ftgt: 0, fre: 0, prog: 0, perfect: true, fightT: 0, grace: 0, result: null, casts: 0 };
  audio.play('swipe');
  g.emit();
}
export function leaveFishing(g: Game) {
  if (g.mode !== 'fishing') return;
  g.fish = null; g.mode = 'play';
  audio.play('select');
  if (g.minutes >= 1440) { g.beginNight(true); return; }
  g.save(); g.emit();
}
export function cycleBait(g: Game) {
  const ex = g.ex;
  const owned = BAITS.filter((b) => b.id === 'none' || (ex.baits[b.id] || 0) > 0).map((b) => b.id);
  ex.bait = owned[(owned.indexOf(ex.bait) + 1) % owned.length];
  audio.play('select'); g.emit();
}
function ensureBait(g: Game) {
  const ex = g.ex;
  if (ex.bait !== 'none' && (ex.baits[ex.bait] || 0) <= 0) {
    const next = BAITS.find((b) => b.id !== 'none' && (ex.baits[b.id] || 0) > 0);
    ex.bait = next ? next.id : 'none';
  }
}
function castLine(g: Game) {
  const f = g.fish!; const ex = g.ex;
  ensureBait(g);
  const bait = BAIT_BY_ID[ex.bait];
  if (ex.bait !== 'none') { ex.baits[ex.bait] = Math.max(0, (ex.baits[ex.bait] || 0) - 1); }
  const b = biteOf(g);
  f.wait = rnd(1.6, 4.8) * (1 - b) * (g.weather === 'rainy' ? 0.85 : 1);
  f.stage = 'wait'; f.t = 0; f.msg = ''; f.casts++;
  const [bx, by] = SPOT_INFO[f.spot].bob;
  g.burst(bx, by, 10, ['#ffffff', '#bfe4ff', '#7ad0ff'], 'px', 30);
  audio.play('swipe');
  void bait;
  g.emit();
}
function startFight(g: Game) {
  const f = g.fish!;
  const fd = f.fish!;
  f.stage = 'fight'; f.t = 0; f.fightT = 0; f.grace = 1.6; f.perfect = true; f.prog = 0.34;
  f.zone = MH - barOf(g) - 4; f.zv = 0; f.fpos = rnd(20, MH - 20); f.ftgt = f.fpos; f.fre = 0.4;
  void fd;
  audio.play('chime');
  g.kick(2);
  g.emit();
}
export function fishPress(g: Game) {
  const f = g.fish;
  if (!f || g.mode !== 'fishing') return;
  switch (f.stage) {
    case 'ready': castLine(g); break;
    case 'wait': f.stage = 'ready'; f.msg = 'Too early! You pulled the line.'; audio.play('error'); g.emit(); break;
    case 'bite': startFight(g); break;
    case 'result': continueFishing(g); break;
    default: break;
  }
}
export function fishCancel(g: Game) {
  const f = g.fish;
  if (!f) return;
  if (f.stage === 'fight') { f.stage = 'ready'; f.msg = 'You cut the line.'; audio.play('error'); g.emit(); return; }
  leaveFishing(g);
}
function continueFishing(g: Game) {
  const f = g.fish!;
  g.minutes += 10;
  if (g.minutes >= 1440) { leaveFishing(g); return; }
  f.stage = 'ready'; f.result = null; f.msg = ''; f.fish = null;
  audio.play('select'); g.emit();
}
function rollFish(g: Game, spot: SpotId): FishDef {
  const tb = timeBucket(g); const rainy = g.weather === 'rainy'; const luck = Math.max(-0.5, luckOf(g));
  const pool: [FishDef, number][] = []; let total = 0;
  for (const f of FISH) {
    if (f.spots !== 'any' && !f.spots.includes(spot)) continue;
    if (f.time && f.time !== tb) continue;
    if (f.weather === 'rainy' && !rainy) continue;
    if (f.weather === 'sunny' && rainy) continue;
    const ri = rarityIdx(f.rarity);
    let w = f.w;
    if (ri >= 3) w *= 1 + luck * (ri >= 4 ? 1.6 : 1);
    if (ri === 0) w /= 1 + Math.max(0, luck) * 0.5;
    if (f.id === g.ex.fotd) w *= 1.7;
    w = Math.max(0.05, w);
    pool.push([f, w]); total += w;
  }
  let r = Math.random() * total;
  for (const [f, w] of pool) { r -= w; if (r <= 0) return f; }
  return pool[0][0];
}
function finishCatch(g: Game) {
  const f = g.fish!; const fd = f.fish!; const ex = g.ex;
  const frac = Math.pow(Math.random(), 1.25);
  const size = Math.round(fd.min + (fd.max - fd.min) * frac);
  const perfect = f.perfect;
  const v = Math.round(fd.value * (0.75 + 0.5 * frac) * (perfect ? 1.25 : 1));
  const j = ex.journal[fd.id] || (ex.journal[fd.id] = { n: 0, best: 0 });
  const isNew = j.n === 0; j.n++;
  const record = size > j.best; if (record) j.best = size;
  let note = ''; let soldAuto = false;
  const [bx, by] = SPOT_INFO[f.spot].bob;
  const ri = rarityIdx(fd.rarity);
  if (fd.rarity === 'junk') { g.gems += v; note = `Sold for scrap · +${v} 💎`; }
  else if (fd.treasure) {
    g.gems += v; note = `Treasure! +${v.toLocaleString()} 💎`;
    if (fd.id === 'chest' && Math.random() < 0.4) { const s = g.grantSecret(); if (s) note += ` · Found ${s}!`; }
  } else {
    if (ex.bag.length >= BAG_MAX) { g.gems += v; soldAuto = true; note = `Bag full — sold on the spot · +${v} 💎`; }
    else { ex.bag.push({ id: fd.id, size, v, perfect }); note = `Added to your bag (${ex.bag.length}/${BAG_MAX})`; }
    g.fishCaught++;
    track(g, 'fish');
    if (ri >= 3) { track(g, 'rare'); }
    if (fd.rarity === 'legendary') ex.stats.legend = (ex.stats.legend || 0) + 1;
  }
  if (perfect) track(g, 'perfect');
  else checkTrophies(g);
  f.result = { fish: fd, size, v, perfect, isNew, record, note, soldAuto };
  f.stage = 'result'; f.t = 0;
  if (ri >= 3 || fd.treasure) { audio.play('unlock'); g.confetti(bx, by, ri >= 5 ? 60 : 30); g.kick(ri >= 4 ? 4 : 2); }
  else audio.play('coin');
  g.burst(bx, by, 14, ['#ffffff', '#7ad0ff', '#ffe080'], 'spark', 40);
  g.emit();
}

export function updateFishing(g: Game, dt: number) {
  const f = g.fish;
  if (!f) { g.mode = 'play'; return; }
  g.ambient(dt);
  f.t += dt;
  if (f.stage === 'wait') {
    f.wait -= dt;
    if (f.wait <= 0) {
      f.fish = rollFish(g, f.spot);
      f.stage = 'bite'; f.t = 0; f.window = Math.max(0.65, 1.25 - f.fish.diff * 0.045);
      audio.play('caught'); g.kick(2);
      const [bx, by] = SPOT_INFO[f.spot].bob;
      g.burst(bx, by, 8, ['#ffffff', '#bfe4ff'], 'px', 36);
      g.emit();
    }
  } else if (f.stage === 'bite') {
    if (f.t > f.window) { f.stage = 'ready'; f.msg = '🐟 It got away — too slow!'; audio.play('error'); g.minutes += 3; g.emit(); }
  } else if (f.stage === 'fight') {
    const fd = f.fish!;
    f.fightT += dt; f.grace -= dt;
    const bar = barOf(g);
    const hold = g.held;
    f.zv += (hold ? -300 : 190) * dt;
    f.zv *= 1 - 1.3 * dt;
    f.zv = Math.max(-100, Math.min(120, f.zv));
    f.zone += f.zv * dt;
    if (f.zone < 0) { f.zone = 0; f.zv = Math.abs(f.zv) * 0.25; }
    if (f.zone > MH - bar) { f.zone = MH - bar; f.zv = -Math.abs(f.zv) * 0.25; }
    f.fre -= dt;
    if (f.fre <= 0) {
      f.ftgt = rnd(6, MH - 6);
      if (fd.diff >= 7 && Math.random() < 0.3) f.ftgt = Math.random() < 0.5 ? 4 : MH - 4;
      f.fre = rnd(0.45, 1.3) * (1.35 - fd.diff * 0.085);
    }
    const sp = 20 + fd.diff * 11;
    const dd = f.ftgt - f.fpos;
    f.fpos += Math.sign(dd) * Math.min(Math.abs(dd), sp * dt);
    const inside = f.fpos >= f.zone - 2 && f.fpos <= f.zone + bar + 2;
    if (inside) f.prog += dt * (0.2 + (60 - Math.min(60, 60 - bar * 0.3)) * 0.0015);
    else { f.prog -= dt * (0.12 + fd.diff * 0.011) * (f.grace > 0 ? 0.3 : 1); f.perfect = false; }
    f.prog = Math.min(1, f.prog);
    if (f.prog >= 1) finishCatch(g);
    else if (f.prog <= 0 || f.fightT > 45) {
      f.stage = 'ready'; f.msg = '💨 The fish broke free!'; audio.play('error'); g.kick(3); g.minutes += 5; g.emit();
    }
  }
}

function pxLine(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string, sag = 0) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  c.fillStyle = col;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    c.fillRect(Math.round(x0 + (x1 - x0) * k), Math.round(y0 + (y1 - y0) * k + Math.sin(Math.PI * k) * sag), 1, 1);
  }
}
export function drawFishing(c: CanvasRenderingContext2D, g: Game) {
  const f = g.fish;
  if (!f) return;
  const p = g.player; const t = g.t;
  const [bx, by0] = SPOT_INFO[f.spot].bob;
  const tipX = p.x + 9, tipY = p.y - 33;
  pxLine(c, p.x + 3, p.y - 12, tipX, tipY, '#7a4a22');
  c.fillStyle = '#ff7ab4'; c.fillRect(tipX, tipY - 1, 1, 2);
  if (f.stage === 'ready') { pxLine(c, tipX, tipY, tipX + 2, tipY + 12, 'rgba(255,255,255,0.7)', 1); return; }
  let dip = 0;
  if (f.stage === 'bite') dip = 2 + Math.round(Math.sin(t / 25));
  if (f.stage === 'wait') dip = Math.round(Math.sin(t / 380));
  if (f.stage === 'fight') dip = Math.round(Math.sin(t / 60)) + 1;
  const by = by0 + dip;
  const taut = f.stage === 'fight' || f.stage === 'bite';
  pxLine(c, tipX, tipY, bx, by, 'rgba(255,255,255,0.85)', taut ? 1 : 7);
  // ripples
  if (f.stage !== 'result') {
    for (let i = 0; i < 2; i++) {
      const r = ((t / 90 + i * 6) % 12) + 2;
      c.globalAlpha = Math.max(0, 1 - r / 14) * (f.stage === 'wait' ? 0.5 : 0.9);
      c.strokeStyle = '#ffffff'; c.lineWidth = 1;
      c.strokeRect(Math.round(bx - r) + 0.5, Math.round(by + 2 - r / 3) + 0.5, Math.round(r * 2), Math.round(r * 0.66));
    }
    c.globalAlpha = 1;
  }
  c.fillStyle = '#ffffff'; c.fillRect(bx - 1, by + 1, 3, 2);
  c.fillStyle = '#ff2a4a'; c.fillRect(bx - 1, by - 2, 3, 3);
  // bite alert
  if (f.stage === 'bite') {
    const bw = 12, bh = 14, ax = Math.round(p.x - bw / 2), ay = Math.round(p.y - 50 + Math.sin(t / 50));
    c.fillStyle = '#3a2a3e'; c.fillRect(ax - 1, ay - 1, bw + 2, bh + 2);
    c.fillStyle = '#fff6a0'; c.fillRect(ax, ay, bw, bh);
    c.fillStyle = '#e0243c'; c.fillRect(ax + 5, ay + 2, 2, 7); c.fillRect(ax + 5, ay + 10, 2, 2);
  }
  if (f.stage === 'fight') {
    const fd = f.fish!; const bar = barOf(g);
    c.fillStyle = '#1c0f2a'; c.fillRect(MX - 3, MY - 3, MW + 6 + 9, MH + 6);
    c.fillStyle = '#2a5a98'; c.fillRect(MX, MY, MW, MH);
    for (let y = 0; y < MH; y += 6) { c.fillStyle = '#3a78b8'; c.fillRect(MX, MY + y + ((Math.floor(t / 200) + y) % 2), MW, 1); }
    // zone
    c.fillStyle = '#4aff7a'; c.globalAlpha = 0.85; c.fillRect(MX, MY + Math.round(f.zone), MW, bar); c.globalAlpha = 1;
    c.fillStyle = '#1a8a3a'; c.fillRect(MX, MY + Math.round(f.zone), MW, 1); c.fillRect(MX, MY + Math.round(f.zone + bar) - 1, MW, 1);
    // fish
    const fy = MY + Math.round(f.fpos);
    const col = RARITY_COL[fd.rarity];
    c.fillStyle = '#10182a'; c.fillRect(MX + 1, fy - 3, 11, 7);
    c.fillStyle = col; c.fillRect(MX + 2, fy - 2, 7, 5); c.fillRect(MX + 9, fy - 3, 2, 2); c.fillRect(MX + 9, fy + 1, 2, 2);
    c.fillStyle = '#ffffff'; c.fillRect(MX + 3, fy - 1, 1, 1);
    // progress
    const px = MX + MW + 3;
    c.fillStyle = '#3a1f4a'; c.fillRect(px, MY, 5, MH);
    const ph = Math.round(MH * f.prog);
    c.fillStyle = f.prog > 0.66 ? '#4aff7a' : f.prog > 0.33 ? '#ffd23c' : '#ff4f6a';
    c.fillRect(px, MY + MH - ph, 5, ph);
    c.fillStyle = '#fff'; c.fillRect(px - 1, MY + MH - Math.round(MH * 0.5), 1, 1);
  }
}

/* =====================================================================
 *  DANCE BATTLE (rhythm game)
 * ===================================================================== */
export interface DNote { lane: number; t: number; res: 0 | 1 | 2 | 3 }
export interface DanceResult { grade: string; acc: number; perfect: number; good: number; miss: number; combo: number; score: number; gems: number; charm: number; win: boolean }
export interface DanceState {
  diff: 0 | 1 | 2; notes: DNote[]; time: number; fall: number; score: number; combo: number; best: number;
  cnt: [number, number, number]; flash: number[]; judge: { text: string; col: string; t: number } | null;
  stage: 'play' | 'result'; result: DanceResult | null; end: number;
}
export const DIFF_NAME = ['Easy', 'Normal', 'Hard'];
const LANE_X0 = 24, LANE_W = 32, LTOP = 52, HIT = 154;
const LANE_COL = ['#ff4f9a', '#38e8ff', '#ffd23c', '#7aff7a'];
export const dancesLeft = (g: Game) => ['dn1', 'dn2', 'dn3'].filter((k) => !g.daily.has(k)).length;

export function startDance(g: Game, diff: 0 | 1 | 2) {
  if (dancesLeft(g) <= 0) { g.say('💃 You are exhausted! Dance again tomorrow.'); return; }
  g.daily.add(['dn1', 'dn2', 'dn3'].find((k) => !g.daily.has(k))!);
  const bpm = [92, 112, 132][diff]; const beat = 60 / bpm; const n = [26, 38, 52][diff];
  const notes: DNote[] = []; let t = 1.4; let last = -1;
  for (let i = 0; i < n; i++) {
    let lane = Math.floor(Math.random() * 4);
    let guard = 0;
    while (lane === last && Math.random() < 0.75 && guard++ < 5) lane = Math.floor(Math.random() * 4);
    last = lane;
    notes.push({ lane, t, res: 0 });
    if (diff === 2 && Math.random() < 0.12) notes.push({ lane: (lane + 1 + Math.floor(Math.random() * 3)) % 4, t, res: 0 });
    t += diff === 0 ? beat : diff === 1 ? beat * (Math.random() < 0.18 ? 0.5 : 1) : beat * (Math.random() < 0.35 ? 0.5 : 1);
  }
  g.dance = { diff, notes, time: -2.2, fall: [1.6, 1.35, 1.1][diff], score: 0, combo: 0, best: 0, cnt: [0, 0, 0], flash: [0, 0, 0, 0], judge: null, stage: 'play', result: null, end: t };
  g.mode = 'dance'; g.card = null;
  audio.setMood('club');
  g.emit();
}
export function danceHit(g: Game, lane: number) {
  const d = g.dance;
  if (!d || d.stage !== 'play' || d.time < -0.3) return;
  d.flash[lane] = 1;
  let best: DNote | null = null;
  for (const n of d.notes) if (n.lane === lane && n.res === 0 && Math.abs(n.t - d.time) <= 0.21 && (!best || Math.abs(n.t - d.time) < Math.abs(best.t - d.time))) best = n;
  audio.play('blip', [330, 392, 494, 587][lane]);
  if (!best) return;
  const err = Math.abs(best.t - d.time);
  const perfect = err <= (d.diff === 2 ? 0.075 : 0.095);
  best.res = perfect ? 1 : 2;
  d.combo++; d.best = Math.max(d.best, d.combo);
  d.cnt[perfect ? 0 : 1]++;
  d.score += (perfect ? 100 : 55) + Math.floor(d.combo / 5) * 5;
  d.judge = { text: perfect ? 'PERFECT!' : 'GOOD', col: perfect ? '#ffe080' : '#7ae8ff', t: g.t };
  if (perfect) audio.play('gem');
}
function finishDance(g: Game) {
  const d = g.dance!;
  const total = d.notes.length;
  const acc = (d.cnt[0] + d.cnt[1] * 0.6) / total;
  const grade = acc >= 0.93 ? 'S' : acc >= 0.8 ? 'A' : acc >= 0.6 ? 'B' : acc >= 0.4 ? 'C' : 'D';
  const mult = [1, 1.5, 2.1][d.diff];
  const gems = Math.round((d.score / 9) * mult);
  const charm = Math.round(d.score * 0.6 * mult);
  const win = grade === 'S' || grade === 'A' || grade === 'B';
  g.gems += gems; g.charm += charm; g.dailyPoints += charm;
  d.result = { grade, acc, perfect: d.cnt[0], good: d.cnt[1], miss: d.cnt[2], combo: d.best, score: d.score, gems, charm, win };
  d.stage = 'result';
  ensureDjMorale(g, grade);
  g.ex.stats.bestCombo = Math.max(g.ex.stats.bestCombo || 0, d.best);
  track(g, 'dances');
  if (grade === 'S') track(g, 'sRank');
  if (win) track(g, 'dancewin');
  audio.play(win ? 'unlock' : 'chime');
  if (win) g.confetti(88, 80, 40);
  g.emit();
}
function ensureDjMorale(g: Game, grade: string) {
  const i = KENS.findIndex((k) => k.name === 'DJ Ken');
  if (i >= 0 && g.kens[i].unlocked && (grade === 'S' || grade === 'A')) g.kens[i].morale = Math.min(10, g.kens[i].morale + 0.5);
}
export function leaveDance(g: Game) {
  if (g.mode !== 'dance') return;
  g.dance = null; g.mode = 'play'; g.minutes += 15;
  g.updateMood();
  if (g.minutes >= 1440) { g.beginNight(true); return; }
  g.save(); g.emit();
}
export function updateDance(g: Game, dt: number) {
  const d = g.dance;
  if (!d) { g.mode = 'play'; return; }
  g.ambient(dt);
  d.flash = d.flash.map((v) => Math.max(0, v - dt * 4));
  if (d.stage !== 'play') return;
  const before = Math.floor(d.time);
  d.time += dt;
  if (d.time < 0 && Math.floor(d.time) !== before) audio.play('blip', 300 + (Math.floor(d.time) + 3) * 100);
  for (const n of d.notes) {
    if (n.res === 0 && d.time - n.t > 0.21) { n.res = 3; d.cnt[2]++; d.combo = 0; d.judge = { text: 'MISS', col: '#ff6a8a', t: g.t }; }
  }
  if (d.time > d.end + 0.7) finishDance(g);
}
function drawArrow(c: CanvasRenderingContext2D, cx: number, cy: number, lane: number, col: string, a = 1) {
  const up = ['....X....', '...XXX...', '..XXXXX..', '.XXXXXXX.', 'XXXXXXXXX', '...XXX...', '...XXX...', '...XXX...', '...XXX...'];
  c.globalAlpha = a;
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
    if (up[y][x] !== 'X') continue;
    let ox = x, oy = y;
    if (lane === 0) { ox = y; oy = 8 - x; }          // left
    else if (lane === 1) { oy = 8 - y; }              // down
    else if (lane === 3) { ox = 8 - y; oy = x; }      // right
    c.fillStyle = col; c.fillRect(Math.round(cx) - 4 + ox, Math.round(cy) - 4 + oy, 1, 1);
  }
  c.globalAlpha = 1;
}
function txt(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, col: string, align: CanvasTextAlign = 'center') {
  c.font = `${size}px "Press Start 2P", monospace`; c.textAlign = align; c.textBaseline = 'middle';
  c.fillStyle = '#10062a'; c.fillText(s, x + 1, y + 1);
  c.fillStyle = col; c.fillText(s, x, y);
}
export function drawDance(c: CanvasRenderingContext2D, g: Game) {
  const d = g.dance;
  if (!d) return;
  const t = g.t;
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, 'rgba(24,6,50,0.93)'); bg.addColorStop(1, 'rgba(60,10,70,0.93)');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  // disco sweeps
  for (let i = 0; i < 6; i++) { c.globalAlpha = 0.08 + 0.05 * Math.sin(t / 300 + i); c.fillStyle = LANE_COL[i % 4]; const x = (i * 34 + t / 40) % (W + 40) - 20; c.fillRect(x, 0, 6, H); }
  c.globalAlpha = 1;
  // lanes
  for (let l = 0; l < 4; l++) {
    const x = LANE_X0 + l * LANE_W;
    c.fillStyle = l % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)'; c.fillRect(x, LTOP - 6, LANE_W, HIT - LTOP + 36);
    if (d.flash[l] > 0) { const gr = c.createLinearGradient(0, HIT + 6, 0, LTOP); gr.addColorStop(0, LANE_COL[l]); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = d.flash[l] * 0.6; c.fillStyle = gr; c.fillRect(x + 1, LTOP, LANE_W - 2, HIT - LTOP + 8); c.globalAlpha = 1; }
  }
  c.fillStyle = '#ffffff'; c.fillRect(LANE_X0, HIT + 10, LANE_W * 4, 1);
  for (let l = 0; l < 4; l++) drawArrow(c, LANE_X0 + l * LANE_W + LANE_W / 2, HIT, l, LANE_COL[l], 0.32 + d.flash[l] * 0.68);
  // notes
  for (const n of d.notes) {
    if (n.res === 1 || n.res === 2) continue;
    const y = HIT - ((n.t - d.time) / d.fall) * (HIT - LTOP);
    if (y < LTOP - 10 || y > HIT + 24) continue;
    const cx = LANE_X0 + n.lane * LANE_W + LANE_W / 2;
    c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(cx - 7, Math.round(y) - 7, 14, 14);
    drawArrow(c, cx, y, n.lane, n.res === 3 ? '#6a5a7a' : LANE_COL[n.lane]);
    if (n.res === 0) { c.fillStyle = '#ffffff'; c.fillRect(Math.round(cx) - 1, Math.round(y) - 1, 2, 2); }
  }
  // dancer
  const sway = Math.sin(t / 220) * (d.combo > 5 ? 8 : 4);
  const fr = Math.floor(t / (d.combo > 10 ? 130 : 260)) % 2 ? 0 : 2;
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(Math.round(88 + sway) - 6, 41, 12, 2);
  drawBarbie(c, 88 + sway, 41, 'down', fr, g.look, t);
  // HUD
  txt(c, `${DIFF_NAME[d.diff].toUpperCase()}`, 6, 8, 6, '#ffd0f0', 'left');
  txt(c, d.score.toLocaleString(), W - 6, 8, 7, '#ffe080', 'right');
  if (d.combo >= 3) txt(c, `${d.combo} COMBO`, 6, 20, 6, '#7af0ff', 'left');
  if (d.judge && t - d.judge.t < 600) { c.globalAlpha = 1 - (t - d.judge.t) / 700; txt(c, d.judge.text, 88, 112, 9, d.judge.col); c.globalAlpha = 1; }
  if (d.time < 0 && d.stage === 'play') { const n = Math.ceil(-d.time); if (d.time > -2.05) txt(c, n > 3 ? '3' : String(n), 88, 100, 22, '#ffffff'); }
  else if (d.time < 0.5 && d.stage === 'play') txt(c, 'GO!', 88, 100, 18, '#ffe080');
}

/* =====================================================================
 *  GIFTS
 * ===================================================================== */
export function applyGift(g: Game, i: number) {
  const gift = g.ex.gift;
  if (!gift) return;
  const f = FISH_BY_ID[gift.id];
  g.ex.gift = null;
  const ks = g.kens[i];
  const isFisher = KENS[i].name === 'Fisherman Ken';
  const base = 1 + (rarityIdx(f.rarity) >= 3 ? 1 : 0);
  const m = base * (isFisher ? 2 : 1);
  ks.morale = Math.min(10, ks.morale + m);
  g.hearts(ks.x, ks.y - 20, 4 + m * 2);
  audio.play('chime');
  g.say(`🎁 ${KENS[i].name} loves the ${f.icon} ${f.name}! +${m} ♥${isFisher ? ' — a fisherman after all!' : ''}`, 3200);
  track(g, 'gift');
}

/* =====================================================================
 *  MENUS (cards): Seafood shack, bait/rod shops, pets, DJ, pond
 * ===================================================================== */
type Opt = { id: string; label: string; sub?: string; disabled?: boolean };
function menu(g: Game, stage: string, title: string, emoji: string, body: string[], opts: Opt[]) {
  g.mode = 'night'; g.cardStage = stage;
  g.setCard({ title, emoji, fx: 'none', tone: 'neutral', body, opts });
}
function closeMenu(g: Game) { g.card = null; g.mode = 'play'; g.emit(); }

export const MENU_STAGES = new Set(['shack', 'baits', 'rods', 'petshop', 'djmenu', 'pondmenu', 'sellmenu']);

export function openShack(g: Game) {
  const ex = g.ex; const fo = FISH_BY_ID[ex.fotd];
  const all = ex.bag.reduce((s, it) => s + fishValue(g, it), 0);
  const cheap = ex.bag.filter((it) => rarityIdx(FISH_BY_ID[it.id].rarity) <= 2);
  const cheapV = cheap.reduce((s, it) => s + fishValue(g, it), 0);
  menu(g, 'shack', 'Captain Pearl\'s Seafood Shack', '🦞', [
    `🌟 Fish of the Day: ${fo.icon} ${fo.name} — worth +50% today!`,
    `${RODS[ex.rod].icon} ${RODS[ex.rod].name} · ${BAIT_BY_ID[ex.bait].icon} ${BAIT_BY_ID[ex.bait].name}${ex.bait === 'none' ? '' : ` ×${ex.baits[ex.bait] || 0}`} · 🎒 ${ex.bag.length}/${BAG_MAX}`,
  ], [
    { id: 'roll', label: '🦞 Free lobster roll (daily)', sub: '+22 💎', disabled: g.daily.has('shack') },
    { id: 'sell_all', label: `💰 Sell ALL fish (${ex.bag.length})`, sub: `${all.toLocaleString()} 💎`, disabled: !ex.bag.length },
    { id: 'sell_cheap', label: `🐟 Sell commons only (${cheap.length})`, sub: `${cheapV.toLocaleString()} 💎 · keeps rare+ for gifts/pets`, disabled: !cheap.length },
    { id: 'baits', label: '🐛 Bait shop', sub: 'Better bait = rarer fish & faster bites' },
    { id: 'rods', label: '🎣 Rod shop', sub: 'Wider reel bar, luck and bite speed' },
    { id: 'leave', label: '👋 Leave' },
  ]);
}
function sellBag(g: Game, onlyCheap: boolean) {
  const ex = g.ex;
  const keep: BagFish[] = []; let sum = 0; let n = 0;
  for (const it of ex.bag) {
    if (onlyCheap && rarityIdx(FISH_BY_ID[it.id].rarity) > 2) { keep.push(it); continue; }
    sum += fishValue(g, it); n++;
  }
  ex.bag = keep;
  g.gems += sum; ex.stats.fishEarn = (ex.stats.fishEarn || 0) + sum;
  audio.play('coin'); setTimeout(() => audio.play('gem'), 120);
  g.say(`💰 Sold ${n} fish for ${sum.toLocaleString()} 💎`, 2800);
  track(g, 'sell', n);
}
export function openBaitShop(g: Game) {
  const ex = g.ex;
  menu(g, 'baits', 'Bait Shop', '🐛', [`You have ${g.gems.toLocaleString()} 💎`, 'Pick the bait on the fishing screen (tap the bait chip).'], [
    ...BAITS.filter((b) => b.pack > 0).map((b) => ({ id: b.id, label: `${b.icon} ${b.name} ×${b.pack}`, sub: `${b.price} 💎 · you have ${ex.baits[b.id] || 0} · ${b.desc}`, disabled: g.gems < b.price })),
    { id: 'back', label: '◀ Back' },
  ]);
}
export function openRodShop(g: Game) {
  const ex = g.ex;
  menu(g, 'rods', 'Rod Shop', '🎣', [`You have ${g.gems.toLocaleString()} 💎`], [
    ...RODS.map((r, i) => {
      const owned = ex.rods.includes(r.id);
      return { id: r.id, label: `${r.icon} ${r.name}${ex.rod === i ? ' ✔ equipped' : ''}`, sub: owned ? `${ex.rod === i ? 'In use' : 'Tap to equip'} · ${r.desc}` : `${r.price.toLocaleString()} 💎 · ${r.desc}`, disabled: ex.rod === i || (!owned && g.gems < r.price) };
    }),
    { id: 'back', label: '◀ Back' },
  ]);
}
export function openPetShop(g: Game) {
  const ex = g.ex; const act = activePetId(g);
  menu(g, 'petshop', 'Pet Corner', '🐾', [
    act ? `${PET_BY_ID[act].icon} ${PET_BY_ID[act].name} is with you — bond ${bondOf(g, act)}/5 · ${PET_BY_ID[act].perk}` : 'Adopt a companion! Pets follow you everywhere and give special perks.',
    `You have ${g.gems.toLocaleString()} 💎 · Feed pets fish from your bag to build their bond.`,
  ], [
    ...PETS.map((p) => {
      const owned = ex.pets[p.id] !== undefined;
      return { id: p.id, label: owned ? `${p.icon} ${p.name} the ${p.species}${act === p.id ? ' ✔' : ''}` : `${p.icon} Adopt ${p.name} the ${p.species}`, sub: owned ? `Bond ${bondOf(g, p.id)}/5 · ${p.perk}: ${p.desc}` : `${p.price.toLocaleString()} 💎 · ${p.perk}: ${p.desc}`, disabled: owned ? act === p.id : g.gems < p.price };
    }),
    { id: 'feed', label: '🍤 Feed your pet a fish', sub: 'Uses the cheapest non-junk fish in your bag', disabled: !act || !ex.bag.length },
    { id: 'dismiss', label: '🏠 Send pet home', disabled: !act },
    { id: 'leave', label: '👋 Leave' },
  ]);
}
export function openDjMenu(g: Game) {
  const left = dancesLeft(g);
  menu(g, 'djmenu', 'DJ Booth', '🎧', [`💃 Dance Battles left today: ${left}/3`, 'Hit the arrows as they reach the glowing line!'], [
    { id: 'request', label: '🎶 Request a song', sub: 'Free daily treat · +25 💎', disabled: g.daily.has('dj') },
    ...[0, 1, 2].map((d) => ({ id: `d${d}`, label: `💃 Dance Battle — ${DIFF_NAME[d]}`, sub: ['Slow beat · 1x rewards', 'Faster · 1.5x rewards', 'Double notes! · 2.1x rewards'][d], disabled: left <= 0 })),
    { id: 'leave', label: '👋 Leave' },
  ]);
}
export function openPondMenu(g: Game) {
  menu(g, 'pondmenu', 'Park Pond', '🦆', ['Calm water, happy ducks. Rainy days bring something special...'], [
    { id: 'duck', label: '🦆 Feed the ducks', sub: 'Free daily treat · +18 💎', disabled: g.daily.has('pond') },
    { id: 'fish', label: '🎣 Fish in the pond', sub: 'Goldfish, carp, frogs and koi' },
    { id: 'leave', label: '👋 Leave' },
  ]);
}

/** Return true if this card stage was handled here. */
export function cardChoice(g: Game, stage: string, id: string): boolean {
  if (!MENU_STAGES.has(stage)) return false;
  const ex = g.ex;
  if (stage === 'shack') {
    if (id === 'leave') { closeMenu(g); return true; }
    if (id === 'roll') { closeMenu(g); g.freebie('shack', '🦞 Free lobster roll from the shack!', 22, 24, 170); return true; }
    if (id === 'sell_all') { sellBag(g, false); openShack(g); return true; }
    if (id === 'sell_cheap') { sellBag(g, true); openShack(g); return true; }
    if (id === 'baits') { openBaitShop(g); return true; }
    if (id === 'rods') { openRodShop(g); return true; }
  } else if (stage === 'baits') {
    if (id === 'back') { openShack(g); return true; }
    const b = BAIT_BY_ID[id];
    if (b && g.gems >= b.price) {
      g.gems -= b.price; ex.baits[b.id] = (ex.baits[b.id] || 0) + b.pack;
      if (ex.bait === 'none') ex.bait = b.id;
      audio.play('coin'); g.say(`${b.icon} Bought ${b.pack}× ${b.name}`);
    } else audio.play('error');
    openBaitShop(g); return true;
  } else if (stage === 'rods') {
    if (id === 'back') { openShack(g); return true; }
    const i = RODS.findIndex((r) => r.id === id);
    if (i >= 0) {
      const r = RODS[i];
      if (!ex.rods.includes(r.id)) {
        if (g.gems < r.price) { audio.play('error'); openRodShop(g); return true; }
        g.gems -= r.price; ex.rods.push(r.id); audio.play('unlock'); g.say(`${r.icon} You bought the ${r.name}!`);
      }
      ex.rod = i; audio.play('chime');
      checkTrophies(g);
    }
    openRodShop(g); return true;
  } else if (stage === 'petshop') {
    if (id === 'leave') { closeMenu(g); return true; }
    if (id === 'dismiss') { ex.pet = null; openPetShop(g); return true; }
    if (id === 'feed') {
      const act = activePetId(g);
      if (act) {
        let bi = -1;
        ex.bag.forEach((it, i) => { if (bi < 0 || it.v < ex.bag[bi].v) bi = i; });
        if (bi >= 0) {
          const it = ex.bag.splice(bi, 1)[0]; const f = FISH_BY_ID[it.id];
          const before = bondOf(g, act);
          ex.pets[act] += Math.max(1, RARITY_XP[f.rarity]);
          const after = bondOf(g, act);
          audio.play('chime'); g.hearts(g.player.x, g.player.y - 20, 6);
          g.say(`${PET_BY_ID[act].icon} ${PET_BY_ID[act].name} munches the ${f.icon} ${f.name}!${after > before ? ` Bond level UP → ${after}/5 💕` : ''}`, 2800);
          checkTrophies(g);
        }
      }
      openPetShop(g); return true;
    }
    const p = PET_BY_ID[id];
    if (p) {
      if (ex.pets[p.id] === undefined) {
        if (g.gems < p.price) { audio.play('error'); openPetShop(g); return true; }
        g.gems -= p.price; ex.pets[p.id] = 0; audio.play('unlock'); g.confetti(g.player.x, g.player.y - 20, 30);
        g.say(`${p.icon} ${p.name} the ${p.species} joined your family!`, 3000);
      }
      ex.pet = p.id; g.petS.x = g.player.x; g.petS.y = g.player.y + 2;
      checkTrophies(g);
    }
    openPetShop(g); return true;
  } else if (stage === 'djmenu') {
    if (id === 'leave') { closeMenu(g); return true; }
    if (id === 'request') { closeMenu(g); audio.play('chime'); g.confetti(144, 60, 30); g.freebie('dj', 'DJ Ken drops your song! 🎶', 25, 144, 40); return true; }
    if (/^d[012]$/.test(id)) { startDance(g, parseInt(id[1], 10) as 0 | 1 | 2); return true; }
  } else if (stage === 'pondmenu') {
    if (id === 'leave') { closeMenu(g); return true; }
    if (id === 'duck') { closeMenu(g); g.freebie('pond', '🦆 The ducks love you! One drops a shiny coin.', 18, 120, 84); return true; }
    if (id === 'fish') { closeMenu(g); startFishing(g, 'pond'); return true; }
  }
  closeMenu(g);
  return true;
}

/* =====================================================================
 *  WORLD ADDITIONS (extra props & scenery)
 * ===================================================================== */
type Ctx = CanvasRenderingContext2D;
function addProps(id: RoomId, props: Prop[], extraBack?: (c: Ctx) => void) {
  const d = ROOMS[id];
  const origBack = d.back;
  const nd = mkRoom({ ...d, props: [...d.props, ...props], back: extraBack ? (c: Ctx) => { origBack(c); extraBack(c); } : origBack });
  Object.assign(d, nd);
}
function relabel(id: RoomId, propId: string, label: string) {
  const p = ROOMS[id].props.find((x) => x.id === propId);
  if (p) p.label = label;
}
export function installExtras() {
  addProps('beach', [{ id: 'surf', x: 4, y: 5, w: 3, h: 1, interact: 'fish_beach', label: 'Surf Fishing · Cast 🎣', solid: null }], (c) => {
    // fishing stand: rod holder, bait bucket and a sign
    R(c, '#6a4020', 62, 84, 3, 12); R(c, '#8a5a30', 58, 84, 11, 2);
    R(c, '#e0e8f0', 110, 86, 7, 7); R(c, '#9aa8c0', 110, 86, 7, 2); R(c, '#ff7a9a', 112, 83, 1, 4);
    R(c, '#8a5a30', 76, 82, 20, 7); R(c, '#fff0d0', 77, 83, 18, 5); R(c, '#2a6a9a', 79, 85, 3, 1); R(c, '#2a6a9a', 83, 85, 3, 1); R(c, '#2a6a9a', 87, 85, 5, 1);
  });
  addProps('mall', [{ id: 'pets', x: 0, y: 5, w: 2, h: 2, interact: 'petshop', label: 'Pet Corner · Adopt a Friend 🐾' }], (c) => {
    R(c, '#8a3a68', 0, 78, 34, 36); R(c, '#fff0f6', 1, 80, 32, 32); R(c, '#ff9ac8', 1, 80, 32, 6);
    for (let i = 0; i < 4; i++) R(c, i % 2 ? '#ffffff' : '#ff9ac8', 1 + i * 8, 86, 8, 3);
    R(c, '#ff7ab4', 12, 92, 10, 6); R(c, '#fff', 14, 93, 2, 2); R(c, '#fff', 18, 93, 2, 2); R(c, '#fff', 16, 95, 2, 2);
    // cages
    R(c, '#f2a65a', 4, 102, 7, 6); R(c, '#c89060', 14, 102, 7, 6); R(c, '#f4f0f8', 24, 102, 7, 6);
    for (let x = 3; x < 32; x += 3) R(c, '#b8a8c8', x, 100, 1, 11);
  });
  relabel('pier', 'fish', 'Fishing Spot · Cast 🎣');
  relabel('park', 'pond', 'Pond · Ducks & Fishing 🎣');
  relabel('club', 'dj', 'DJ Booth · Songs & Dance Battle');
  relabel('pier', 'shack', 'Seafood Shack · Shop & Sell');
}
installExtras();

export { SPOT_INFO };
