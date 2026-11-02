import { audio, type Mood } from './audio';
import { ITEMS, ITEM_BY_ID, DEFAULT_LOOK, lookStats, activeMasterpiece, STAT_LABEL, type Look, type Slot, type StatKey } from './items';
import { KENS, ROSAN_GEM_REQ, ROSAN_GLAM_REQ, ROSAN, GUARD, ROSAN_MOODS, type RoomId, type CutId } from './kens';
import { ROOMS, buildLayers, drawBackdrop, envAt, rectDist, TS, W, H, type RoomDef, type Env } from './world';
import { drawBarbie, drawKen, drawEmote, drawHeart, drawSparkle, type Dir, type EmoteType } from './sprites';
import { buildKenGraph, type Graph, type Fx, type Opt } from './dialogue';
import { addScore, loadScores, writeSlot, readSlot, deleteSlot, type ScoreEntry, type SaveData } from './storage';
import './rooms2';
import { storyFor, endingFor, type StoryFx } from './story';
import { newEx, type ExState } from './extras';
import * as FX from './features';
import type { FishState, DanceState, PetState } from './features';

export const MAX_DAYS = 21;
const MIN_PER_SEC = 5;
const SPEED = 56;
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export type Mode = 'title' | 'play' | 'dialogue' | 'wardrobe' | 'night' | 'paused' | 'gameover' | 'cutscene' | 'roster' | 'fishing' | 'dance' | 'journal';
export type WardrobeTabs = 'dress' | 'hm' | 'hair' | 'all';

export interface KenState {
  unlocked: boolean; morale: number; raag: boolean; talks: number; lore: boolean;
  x: number; y: number; dir: Dir; frame: number; ft: number; room: RoomId;
  hx: number; hy: number; tx: number; ty: number; wait: number; spot: number;
  emoteT: { type: EmoteType; t: number } | null;
}
export interface Popup { id: number; text: string; x: number; y: number; color: string; big: boolean; born: number }
export interface CardOpt { id: string; label: string; sub?: string; disabled?: boolean }
export interface Card { title: string; emoji: string; body: string[]; opts: CardOpt[]; ken?: number; fx: 'hearts' | 'anger' | 'confetti' | 'flash' | 'none'; tone: 'good' | 'bad' | 'neutral' }
export interface Dlg {
  ken: number; kind: 'ken' | 'unlock' | 'tower'; graph: Graph; node: string; text: string; opts: Opt[];
  check?: { stat: StatKey; need: number; have: number; pass: boolean }; replyNext?: string | null | undefined; isReply: boolean; rev: number;
}
export interface Over { reason: 'season' | 'scandal'; ending: { name: string; icon: string; text: string }; score: number; rank: number; list: ScoreEntry[]; parts: { label: string; value: number }[] }

interface P { x: number; y: number; vx: number; vy: number; g: number; life: number; max: number; kind: 'px' | 'heart' | 'spark' | 'conf' | 'drop' | 'mote' | 'petal' | 'fly'; col: string; s: number }
type Target = { type: 'ken'; idx: number; dist: number } | { type: 'star'; idx: number; dist: number } | { type: 'prop'; id: string; interact: string; label: string; dist: number; cx: number; cy: number };

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pickOne = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export class Game {
  canvas: HTMLCanvasElement;
  c: CanvasRenderingContext2D;
  ver = 0;
  listeners = new Set<() => void>();
  layers: Partial<Record<RoomId, { back: HTMLCanvasElement; front: HTMLCanvasElement }>> = {};
  vignette: HTMLCanvasElement;

  mode: Mode = 'title';
  prevMode: Mode = 'play';
  t = 0;
  day = 1;
  minutes = 380;
  weather: 'sunny' | 'rainy' = 'sunny';
  room: RoomId = 'bedroom';
  player = { x: 88, y: 150, dir: 'down' as Dir, frame: 0, ft: 0, moving: false, emote: null as { type: EmoteType; t: number } | null };
  look: Look = { ...DEFAULT_LOOK };
  owned = new Set<string>();
  gems = 0;
  charm = 0;
  dailyPoints = 0;
  kens: KenState[] = [];
  kissUntil = 0;
  heartbroken = 0;
  scandals = 0;
  loveSeen = false;
  daily = new Set<string>();
  todayMasterpieces = new Set<string>();
  totalChats = 0;
  lastPhase = 0;
  suitor = 1;

  keys = new Set<string>();
  input = { ax: 0, ay: 0, a: false };
  target: Target | null = null;
  particles: P[] = [];
  popups: Popup[] = [];
  popId = 1;
  toast: { text: string; until: number } | null = null;
  banner: { text: string; until: number } | null = null;
  shake = 0;
  flash = 0;
  fade: { phase: 0 | 1; t: number; to: RoomId; x: number; y: number; dir: Dir } | null = null;
  wardrobe: WardrobeTabs = 'all';
  dlg: Dlg | null = null;
  dlgSel = 0;
  card: Card | null = null;
  cardStage = '';
  cardSel = 0;
  pendingKen = -1;
  pendingCutscene: CutId | null = null;
  cutscene: CutId | null = null;
  over: Over | null = null;
  scores: ScoreEntry[] = loadScores();
  titleMin = 400;
  uiT = 0;
  amb = { rain: 0, mote: 0, fly: 0, petal: 0, glit: 0, aura: 0 };
  hbToday = false;
  moodNow: Mood = 'off';
  playerName = 'Barbie';
  slot = 0;
  flags = new Set<string>();
  rep = 0;
  rosanMood = 0;
  rosanTrust = 0;
  seenCuts = new Set<string>();
  glamBoost = false;
  roseGift = false;
  fishCaught = 0;
  storyLog: string[] = [];
  pendingStory: number | null = null;
  pendingCodes: string[] = [];
  ex: ExState = newEx();
  fish: FishState | null = null;
  dance: DanceState | null = null;
  petS: PetState = FX.newPetState();
  notes: string[] = [];
  journalTab = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = W;
    canvas.height = H;
    this.c = canvas.getContext('2d')!;
    this.c.imageSmoothingEnabled = false;
    this.vignette = document.createElement('canvas');
    this.vignette.width = W; this.vignette.height = H;
    const vc = this.vignette.getContext('2d')!;
    const g = vc.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.78);
    g.addColorStop(0, 'rgba(20,0,30,0)'); g.addColorStop(1, 'rgba(20,0,30,0.32)');
    vc.fillStyle = g; vc.fillRect(0, 0, W, H);
    this.reset();
  }

  /* ------------------------------------------------------------ subscription */
  subscribe = (cb: () => void) => { this.listeners.add(cb); return () => { this.listeners.delete(cb); }; };
  getVersion = () => this.ver;
  emit() { this.ver++; this.listeners.forEach((l) => l()); }

  /* ------------------------------------------------------------ derived */
  get phase() { return this.minutes < 720 ? 0 : this.minutes < 1080 ? 1 : 2; }
  get abs() { return (this.day - 1) * 1440 + this.minutes; }
  get stats() {
    const st = lookStats(this.look);
    if (this.glamBoost) { st.glam = 100; st.elegance = 100; st.beach = 100; st.int = 100; st.total = 400; }
    return st;
  }
  nm(s: string) { return this.playerName === 'Barbie' ? s : s.replace(/Barbie/g, this.playerName); }
  get masterpiece() { return activeMasterpiece(this.look); }
  get kissActive() { return this.abs < this.kissUntil; }
  get anyRaag() { return this.kens.some((k) => k.unlocked && k.raag); }
  get env(): Env { return envAt(this.mode === 'title' ? this.titleMin : this.minutes, this.weather === 'rainy', this.t); }
  get unlockedCount() { return this.kens.filter((k) => k.unlocked).length; }
  get timeLabel() {
    const m = Math.floor(this.minutes) % 1440;
    const h = Math.floor(m / 60), mm = Math.floor(m / 5) * 5 % 60;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${mm.toString().padStart(2, '0')} ${h >= 12 && h < 24 ? 'PM' : 'AM'}`;
  }
  get dayName() { return DAY_NAMES[(this.day - 1) % 7]; }
  get multiplierNow() {
    if (this.heartbroken > 0) return 0;
    return (this.masterpiece ? 3 : 1) * (this.kissActive ? 1.5 : 1) * (this.anyRaag ? 0.7 : 1);
  }
  get held() { return this.keys.has('Space') || this.keys.has('Enter') || this.input.a; }
  get hint(): string {
    if (this.mode !== 'play') return '';
    if (this.day === 1 && this.kens[0].talks === 0) return 'Walk up to Ken and press SPACE / A to talk!';
    return '';
  }

  /* ------------------------------------------------------------ setup */
  reset() {
    this.day = 1; this.minutes = 380; this.weather = 'sunny'; this.room = 'bedroom';
    this.player = { x: 88, y: 150, dir: 'down', frame: 0, ft: 0, moving: false, emote: null };
    this.look = { ...DEFAULT_LOOK };
    this.owned = new Set(); this.gems = 0; this.charm = 0; this.dailyPoints = 0;
    this.kissUntil = 0; this.heartbroken = 0; this.scandals = 0; this.loveSeen = false;
    this.daily = new Set(); this.todayMasterpieces = new Set(); this.totalChats = 0; this.suitor = 1;
    this.flags = new Set(); this.rep = 0; this.rosanMood = 0; this.rosanTrust = 0; this.seenCuts = new Set(); this.glamBoost = false;
    this.roseGift = false; this.fishCaught = 0; this.storyLog = []; this.pendingStory = null;
    this.kens = KENS.map(() => ({ unlocked: false, morale: 0, raag: false, talks: 0, lore: false, x: 0, y: 0, dir: 'down' as Dir, frame: 0, ft: 0, room: 'town' as RoomId, hx: 0, hy: 0, tx: 0, ty: 0, wait: rnd(0.5, 2), spot: -1, emoteT: null }));
    this.kens[0].unlocked = true; this.kens[0].morale = 2;
    this.ex = newEx(); this.fish = null; this.dance = null; this.notes = []; this.petS = FX.newPetState();
    this.particles = []; this.popups = []; this.toast = null; this.banner = null; this.fade = null;
    this.dlg = null; this.card = null; this.over = null; this.cutscene = null; this.pendingCutscene = null;
    this.lastPhase = this.phase;
    FX.rollDaily(this);
    this.relocateAll(false);
    // tutorial: Ken stands near Barbie
    const k0 = this.kens[0];
    k0.x = k0.hx = k0.tx = 120; k0.y = k0.hy = k0.ty = 110; k0.dir = 'left';
  }

  newGame(name?: string, slot?: number) {
    if (name !== undefined) this.playerName = name.trim().slice(0, 14) || 'Barbie';
    if (slot !== undefined) this.slot = slot;
    this.reset();
    this.mode = 'play';
    this.bannerRoom();
    this.updateMood();
    audio.play('confirm');
    this.applyPendingCodes();
    this.save();
    this.showStory(1);
    this.emit();
  }
  startFromTitle() { audio.init(); }
  goHome() { this.save(); this.mode = 'title'; this.card = null; this.dlg = null; audio.setMood('day'); this.emit(); }

  /* ------------------------------------------------------------ save / load */
  serialize(): SaveData {
    return {
      v: 2, name: this.playerName, day: this.day, minutes: this.minutes, weather: this.weather, room: this.room,
      look: this.look, owned: [...this.owned], gems: this.gems, charm: this.charm, kissUntil: this.kissUntil,
      heartbroken: this.heartbroken, scandals: this.scandals, loveSeen: this.loveSeen, suitor: this.suitor,
      kens: this.kens.map((k) => ({ u: k.unlocked, m: k.morale, r: k.raag, l: k.lore })),
      flags: [...this.flags], rep: this.rep, rosanMood: this.rosanMood, rosanTrust: this.rosanTrust, seenCuts: [...this.seenCuts],
      glamBoost: this.glamBoost, fishCaught: this.fishCaught, storyLog: this.storyLog,
      savedAt: Date.now(), unlocked: this.unlockedCount, ex: this.ex,
    };
  }
  save() { if (this.mode === 'gameover') return; try { writeSlot(this.slot, this.serialize()); } catch { /* ignore */ } }
  load(slot: number) {
    const d = readSlot(slot);
    if (!d) return false;
    audio.init();
    this.slot = slot; this.playerName = d.name;
    this.reset();
    this.day = d.day; this.minutes = Math.max(360, Math.min(1380, d.minutes)); this.weather = d.weather; this.room = 'bedroom';
    this.look = { ...DEFAULT_LOOK, ...d.look }; this.owned = new Set(d.owned); this.gems = d.gems; this.charm = d.charm;
    this.kissUntil = d.kissUntil; this.heartbroken = d.heartbroken; this.scandals = d.scandals; this.loveSeen = d.loveSeen; this.suitor = d.suitor;
    d.kens.forEach((k, i) => { if (this.kens[i]) { this.kens[i].unlocked = k.u; this.kens[i].morale = k.m; this.kens[i].raag = k.r; this.kens[i].lore = k.l; } });
    this.flags = new Set(d.flags); this.rep = d.rep; this.rosanMood = d.rosanMood; this.rosanTrust = d.rosanTrust; this.seenCuts = new Set(d.seenCuts);
    this.glamBoost = d.glamBoost; this.fishCaught = d.fishCaught || 0; this.storyLog = d.storyLog || [];
    this.player.x = 88; this.player.y = 150;
    if (d.ex) {
      this.ex = { ...newEx(), ...d.ex };
      if (this.ex.questDay !== this.day || !this.ex.quests.length) FX.rollDaily(this);
    }
    this.petS.x = 88; this.petS.y = 152;
    this.lastPhase = this.phase;
    this.kens.forEach((k) => { k.spot = -1; });
    this.relocateAll(false);
    this.mode = 'play';
    this.bannerRoom(); this.updateMood();
    audio.play('confirm');
    this.applyPendingCodes();
    this.say(`💾 Welcome back, ${this.playerName}! Day ${this.day}.`, 2800);
    this.emit();
    return true;
  }

  /* ------------------------------------------------------------ codes */
  static CODES = ['GETMUCH', 'ULTDRESS'];
  queueCode(raw: string): { ok: boolean; msg: string } {
    const c = raw.trim().toUpperCase();
    if (!Game.CODES.includes(c)) return { ok: false, msg: '❌ Invalid code. Try again!' };
    if (!this.pendingCodes.includes(c)) this.pendingCodes.push(c);
    return { ok: true, msg: `✅ ${c} activated! It will apply when you start or load a story.` };
  }
  applyPendingCodes() {
    const codes = this.pendingCodes; this.pendingCodes = [];
    codes.forEach((c) => this.redeem(c));
    if (codes.length) setTimeout(() => this.say(`🎁 Codes applied: ${codes.join(', ')}`, 3400), 50);
  }
  redeem(raw: string): { ok: boolean; msg: string } {
    const code = raw.trim().toUpperCase();
    if (code === 'GETMUCH') {
      this.gems += 9999999; this.charm += 999999; this.glamBoost = true;
      ITEMS.forEach((it) => { if (it.secret) this.owned.add(it.id); });
      for (let i = 0; i < ROSAN; i++) { const k = this.kens[i]; if (!k.unlocked) { k.unlocked = true; k.morale = 5; } }
      this.suitor = ROSAN;
      this.kens.forEach((k) => { if (k.unlocked) k.spot = -1; });
      this.relocateAll(false);
      this.flags.add('code_getmuch');
      this.save(); this.emit();
      return { ok: true, msg: '💎 GETMUCH: +9,999,999 gems, max ALL stats (Glamour 100!), every rare item & every Ken unlocked. Rosan Sawad awaits at the Penthouse Tower!' };
    }
    if (code === 'ULTDRESS') {
      this.owned.add('celestial'); this.owned.add('celestialtiara');
      this.look.outfit = 'celestial'; this.look.head = 'celestialtiara'; this.look.shoes = 'glass';
      this.flags.add('code_ultdress');
      this.save(); this.emit();
      return { ok: true, msg: '👸 ULTDRESS: The Celestial Diamond Empress Gown + Star Crown are yours — and you\'re wearing them!' };
    }
    return { ok: false, msg: '❌ Invalid code. Try again!' };
  }

  /* ------------------------------------------------------------ story */
  showStory(day: number) {
    const ev = storyFor(day);
    if (!ev) return;
    this.mode = 'night';
    this.cardStage = 'story';
    this.pendingStory = day;
    this.setCard({ title: ev.title, emoji: ev.emoji, fx: 'none', tone: 'neutral', body: ev.body.map((b) => this.nm(b)), opts: ev.opts.map((o) => ({ id: o.id, label: o.label, sub: o.sub })) });
  }
  applyStoryFx(fx: StoryFx) {
    if (fx.gems) this.gems = Math.max(0, this.gems + fx.gems);
    if (fx.charm) { this.charm += fx.charm; this.dailyPoints += fx.charm; }
    if (fx.rep) this.rep += fx.rep;
    if (fx.flag) this.flags.add(fx.flag);
    if (fx.kenMorale) { const k = this.kens[fx.kenMorale[0]]; if (k) k.morale = Math.max(0, Math.min(10, k.morale + fx.kenMorale[1])); }
    if (fx.allMorale) this.kens.forEach((k) => { if (k.unlocked) k.morale = Math.max(0, Math.min(10, k.morale + fx.allMorale!)); });
    if (fx.rosanTrust) this.rosanTrust = Math.max(-5, Math.min(10, this.rosanTrust + fx.rosanTrust));
    if (fx.scandal) this.scandals += fx.scandal;
    if (fx.heartbroken) this.heartbroken = 1;
  }
  resolveStory(id: string) {
    const ev = storyFor(this.pendingStory || 0);
    const o = ev?.opts.find((x) => x.id === id);
    if (!ev || !o) { this.card = null; this.mode = 'play'; this.emit(); return; }
    let lines = [...o.result];
    let tone = o.tone;
    const fx: StoryFx = { ...o.fx };
    if (id === 'duel') {
      const win = Math.random() < (this.stats.glam >= 50 ? 0.85 : 0.6);
      if (win) { fx.gems = 800; fx.rep = 2; lines = ['The crowd roars! Your look wins by a landslide. Raquelle storms off.', '+800 💎 · +2 Reputation']; tone = 'good'; }
      else { fx.rep = -1; lines = ['Raquelle wins this round... barely. "Better luck next time, sweetie."', '-1 Reputation (tip: boost your Glamour!)']; tone = 'bad'; }
    }
    if (id === 'faith') {
      if (this.rep >= 3) { fx.charm = 3000; lines = ['Nobody believes the rumour. Your good name protects you!', `Reputation ${this.rep} saved you · +3000 charm`]; tone = 'good'; }
      else { fx.scandal = 1; lines = ['With your reputation, people believe the worst...', '📸 +1 Scandal']; tone = 'bad'; }
    }
    if (id === 'reveal') {
      if (this.flags.has('saboteur') || this.flags.has('ruthless')) { fx.rep = -1; lines = ['It was Raquelle — getting revenge for what YOU did to her. Karma stings.', '-1 Reputation']; tone = 'bad'; }
      else if (this.flags.has('raquelle_friend')) { fx.rep = 2; fx.gems = 1000; lines = ['Raquelle helps you track it down: Billionaire Ken\'s assistant! She posts proof. Best friends forever.', '+2 Rep · +1000 💎']; tone = 'good'; }
      else { fx.rep = 1; lines = ['You trace it to a bored intern at the Dreamtown Daily. They apologise publicly.', '+1 Reputation']; tone = 'good'; }
    }
    if (o.fx.item) { const f = this.grantSecret(); if (f) lines.push(`🎁 ${f}`); }
    this.applyStoryFx(fx);
    this.storyLog.push(`Day ${ev.day}: ${o.label}`);
    lines.push(`⭐ Reputation: ${this.rep >= 0 ? '+' : ''}${this.rep} · 🤝 Rosan Trust: ${this.rosanTrust}`);
    this.cardStage = 'storyres';
    if (tone === 'good') audio.play('unlock'); else if (tone === 'bad') audio.play('anger');
    this.setCard({ title: 'Consequences', emoji: tone === 'good' ? '✨' : tone === 'bad' ? '⚠️' : '📝', fx: tone === 'good' ? 'confetti' : tone === 'bad' ? 'anger' : 'none', tone, body: lines.map((l) => this.nm(l)), opts: [{ id: 'next', label: 'Continue ▶' }] });
  }

  /* ------------------------------------------------------------ rooms / kens */
  get roomDef(): RoomDef { return ROOMS[this.room]; }
  layer(id: RoomId) { return this.layers[id] || (this.layers[id] = buildLayers(ROOMS[id])); }

  kenTargetRoom(i: number): RoomId {
    const ks = this.kens[i];
    if (!ks.unlocked) return 'town';
    if (i === ROSAN) return 'penthouse';
    if (i === 0 && this.day === 1 && this.phase === 0) return 'bedroom';
    let r = KENS[i].schedule[this.phase];
    if (this.weather === 'rainy') { const sub: Partial<Record<RoomId, RoomId>> = { beach: 'town', park: 'mall', pier: 'cafe', garden: 'library' }; r = sub[r] || r; }
    return r;
  }
  kenVisible(i: number) {
    const ks = this.kens[i];
    return ks.unlocked || (i === this.suitor && i !== ROSAN);
  }
  placeKen(i: number) {
    const ks = this.kens[i];
    const room = this.kenTargetRoom(i);
    const def = ROOMS[room];
    const used = new Set<number>();
    this.kens.forEach((o, j) => { if (j !== i && o.room === room && this.kenVisible(j) && o.spot >= 0) used.add(o.spot); });
    const free = def.spots.map((_, s) => s).filter((s) => !used.has(s));
    const spot = free.length ? pickOne(free) : Math.floor(Math.random() * def.spots.length);
    const [sx, sy] = def.spots[spot];
    ks.room = room; ks.spot = spot;
    ks.hx = ks.x = ks.tx = sx * TS + 8; ks.hy = ks.y = ks.ty = sy * TS + 14;
    ks.dir = pickOne<Dir>(['down', 'left', 'right']); ks.wait = rnd(0.5, 3);
  }
  relocateAll(poof: boolean) {
    this.kens.forEach((ks, i) => {
      if (!this.kenVisible(i)) return;
      const target = this.kenTargetRoom(i);
      if (target !== ks.room || ks.spot < 0) {
        const wasHere = ks.room === this.room;
        this.placeKen(i);
        if (poof && ks.room === this.room && !wasHere) this.burst(ks.x, ks.y - 10, 8, ['#ffffff', '#ffd0f0'], 'spark');
      }
    });
  }

  bannerRoom() { this.banner = { text: this.roomDef.name, until: this.t + 2400 }; }
  updateMood() {
    const m: Mood = this.room === 'club' ? 'club' : this.room === 'penthouse' ? 'penthouse' : this.minutes >= 1110 || this.minutes < 400 ? 'night' : 'day';
    this.moodNow = m;
    audio.setMood(m);
  }
  goRoom(to: RoomId, x: number, y: number, dir: Dir) {
    if (this.fade) return;
    this.fade = { phase: 0, t: 0, to, x, y, dir };
    audio.play('door');
  }
  enterRoom(to: RoomId, x: number, y: number, dir: Dir) {
    this.room = to;
    this.player.x = x; this.player.y = y; this.player.dir = dir;
    this.particles = this.particles.filter((p) => p.kind === 'heart' || p.kind === 'spark');
    this.bannerRoom();
    this.updateMood();
    FX.onEnterRoom(this, to);
    if (to === 'penthouse' && this.kens[ROSAN].unlocked) { const md = ROSAN_MOODS[this.rosanMood]; this.say(`${md.icon} Rosan seems ${md.name.toLowerCase()} today — ${md.desc}`, 3200); }
    this.emit();
  }

  /* ------------------------------------------------------------ messages / fx */
  say(text: string, ms = 2400) { this.toast = { text: this.nm(text), until: this.t + ms }; this.emit(); }
  popup(text: string, wx: number, wy: number, color = '#fff', big = false) {
    this.popups.push({ id: this.popId++, text, x: (wx / W) * 100, y: (wy / H) * 100, color, big, born: this.t });
    if (this.popups.length > 12) this.popups.shift();
    this.emit();
  }
  burst(x: number, y: number, n: number, cols: string[], kind: P['kind'] = 'px', spd = 50) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rnd(spd * 0.4, spd);
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, g: kind === 'conf' ? 60 : 30, life: rnd(0.5, 1.1), max: 1.1, kind, col: pickOne(cols), s: 1 + Math.floor(Math.random() * 2) });
    }
  }
  hearts(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) this.particles.push({ x: x + rnd(-8, 8), y, vx: rnd(-12, 12), vy: rnd(-42, -22), g: 0, life: rnd(0.9, 1.5), max: 1.5, kind: 'heart', col: pickOne(['#ff4f8a', '#ff7ab4', '#ff3d78']), s: 1 });
  }
  confetti(x: number, y: number, n = 40) { this.burst(x, y, n, ['#ff4f9a', '#38e8ff', '#ffd23c', '#7a5aff', '#4aff9a', '#ffffff'], 'conf', 90); }
  kick(m: number) { this.shake = Math.max(this.shake, m); }
  react(i: number, type: EmoteType) { this.kens[i].emoteT = { type, t: 1.8 }; }

  /* ------------------------------------------------------------ input */
  keyDown(code: string, repeat: boolean) {
    this.keys.add(code);
    if (repeat) return;
    if (code === 'KeyM') { audio.setMuted(!audio.muted); this.emit(); return; }
    const m = this.mode;
    if (m === 'title') return;
    if (m === 'gameover') { if (code === 'KeyR') this.newGame(); return; }
    if (m === 'paused') { if (code === 'Escape' || code === 'KeyP') this.togglePause(); return; }
    if (m === 'dialogue' && this.dlg) {
      if (code === 'ArrowUp' || code === 'KeyW') { this.dlgSel = (this.dlgSel + this.dlg.opts.length - 1) % this.dlg.opts.length; audio.play('select'); this.emit(); }
      else if (code === 'ArrowDown' || code === 'KeyS') { this.dlgSel = (this.dlgSel + 1) % this.dlg.opts.length; audio.play('select'); this.emit(); }
      else if (code === 'Space' || code === 'Enter') this.chooseOption(this.dlgSel);
      else if (/^Digit[1-9]$/.test(code)) { const n = parseInt(code.slice(5), 10) - 1; if (n < this.dlg.opts.length) this.chooseOption(n); }
      else if (code === 'Escape') this.endDialogue();
      return;
    }
    if (m === 'night' && this.card) {
      const n = this.card.opts.length;
      if (code === 'ArrowUp' || code === 'KeyW') { this.cardSel = (this.cardSel + n - 1) % n; audio.play('select'); this.emit(); }
      else if (code === 'ArrowDown' || code === 'KeyS') { this.cardSel = (this.cardSel + 1) % n; audio.play('select'); this.emit(); }
      else if (code === 'Space' || code === 'Enter') this.cardChoice(this.card.opts[this.cardSel].id);
      return;
    }
    if (m === 'fishing') {
      if (code === 'Space' || code === 'Enter') FX.fishPress(this);
      else if (code === 'KeyB') FX.cycleBait(this);
      else if (code === 'Escape' || code === 'KeyQ') FX.fishCancel(this);
      return;
    }
    if (m === 'dance') {
      const lane = code === 'ArrowLeft' || code === 'KeyA' ? 0 : code === 'ArrowDown' || code === 'KeyS' ? 1 : code === 'ArrowUp' || code === 'KeyW' ? 2 : code === 'ArrowRight' || code === 'KeyD' ? 3 : -1;
      if (lane >= 0) FX.danceHit(this, lane);
      else if (code === 'Escape' && this.dance?.stage === 'result') FX.leaveDance(this);
      return;
    }
    if (m === 'journal') { if (code === 'Escape' || code === 'KeyJ') this.closeJournal(); return; }
    if (m === 'wardrobe') { if (code === 'Escape' || code === 'KeyQ' || code === 'KeyE' || code === 'KeyR') this.closeWardrobe(); return; }
    if (m === 'roster') { if (code === 'Escape' || code === 'KeyK') this.closeRoster(); return; }
    if (m === 'cutscene') { return; }
    if (m === 'play') {
      if (code === 'Space' || code === 'Enter') this.interact();
      else if (code === 'KeyQ') this.openWardrobe('dress');
      else if (code === 'KeyE') this.openWardrobe('hm');
      else if (code === 'KeyR') this.openWardrobe('hair');
      else if (code === 'KeyN') this.nightlyButton();
      else if (code === 'KeyK') this.openRoster();
      else if (code === 'KeyJ') this.openJournal();
      else if (code === 'Escape' || code === 'KeyP') this.togglePause();
    }
  }
  keyUp(code: string) { this.keys.delete(code); }

  togglePause() {
    if (this.mode === 'play') { this.mode = 'paused'; audio.play('pause'); this.emit(); }
    else if (this.mode === 'paused') { this.mode = 'play'; audio.play('pause'); this.emit(); }
  }
  openJournal(tab?: number) { if (this.mode === 'play') { if (tab !== undefined) this.journalTab = tab; this.mode = 'journal'; audio.play('select'); this.emit(); } }
  closeJournal() { if (this.mode === 'journal') { this.mode = 'play'; audio.play('select'); this.emit(); } }
  actionDown() {
    this.input.a = true;
    if (this.mode === 'fishing') FX.fishPress(this);
    else if (this.mode === 'play') this.interact();
  }
  actionUp() { this.input.a = false; }
  openRoster() { if (this.mode === 'play') { this.mode = 'roster'; audio.play('select'); this.emit(); } }
  closeRoster() { if (this.mode === 'roster') { this.mode = 'play'; audio.play('select'); this.emit(); } }

  /* ------------------------------------------------------------ wardrobe */
  openWardrobe(tabs: WardrobeTabs) {
    if (this.mode !== 'play' || this.fade) return;
    this.wardrobe = tabs; this.mode = 'wardrobe';
    audio.play('swipe'); this.emit();
  }
  closeWardrobe() { if (this.mode === 'wardrobe') { this.mode = 'play'; audio.play('select'); this.emit(); } }
  setHairColor(id: string) {
    this.look.hairColor = id;
    audio.play('swipe');
    this.burst(this.player.x, this.player.y - 18, 8, ['#ffffff', '#ffd0f0'], 'spark', 30);
    this.emit();
  }
  isOwned(id: string) { const it = ITEM_BY_ID[id]; return !!it && (!it.secret || this.owned.has(id)); }
  equip(slot: Slot, id: string) {
    const it = ITEM_BY_ID[id];
    if (!it || !this.isOwned(id)) { audio.play('error'); return; }
    const before = this.masterpiece?.id;
    const L = this.look as unknown as Record<string, string | null>;
    const optional: Slot[] = ['neck', 'ears', 'head', 'eyes', 'hand'];
    if (optional.includes(slot) && L[slot] === id) L[slot] = null; else L[slot] = id;
    audio.play('swipe');
    const px = this.player.x, py = this.player.y - 12;
    this.burst(px, py, 8, ['#ffffff', '#ffd0f0', '#ffe080'], 'spark', 30);
    const mp = this.masterpiece;
    if (mp && mp.id !== before) {
      audio.play('masterpiece');
      this.confetti(px, py - 6, 30);
      this.say(`✨ MASTERPIECE SYNERGY: ${mp.name} — Style Points x3!`, 3200);
    }
    this.emit();
  }

  /* ------------------------------------------------------------ interaction */
  findTarget(): Target | null {
    const p = this.player;
    let best: Target | null = null;
    this.kens.forEach((ks, i) => {
      if (!this.kenVisible(i) || ks.room !== this.room) return;
      const d = Math.hypot(p.x - ks.x, p.y - ks.y);
      if (d < 22 && (!best || d - 4 < best.dist)) best = { type: 'ken', idx: i, dist: d - 4 };
    });
    const st = FX.findStar(this);
    if (st && (!best || st.dist < (best as Target).dist)) best = { type: 'star', idx: st.idx, dist: st.dist };
    for (const pr of this.roomDef.props) {
      if (!pr.interact) continue;
      const rx = pr.x * TS, ry = pr.y * TS, rw = pr.w * TS, rh = pr.h * TS;
      const d = rectDist(p.x, p.y - 2, rx, ry, rw, rh);
      if (d <= 13 && (!best || d < best.dist)) best = { type: 'prop', id: pr.id, interact: pr.interact, label: pr.label || '', dist: d, cx: rx + rw / 2, cy: ry };
    }
    return best;
  }
  get prompt(): string {
    if (this.mode !== 'play' || !this.target) return '';
    const t = this.target;
    if (t.type === 'star') return 'Grab the Lucky Star ⭐';
    if (t.type === 'ken') {
      const k = KENS[t.idx];
      return this.kens[t.idx].unlocked ? `Talk to ${k.name}` : `Meet ${k.name} · ${k.cost} 💎`;
    }
    return t.label;
  }

  interact() {
    if (this.mode !== 'play' || this.fade) return;
    const t = this.target;
    if (!t) return;
    if (t.type === 'ken') { this.startDialogue(t.idx); return; }
    if (t.type === 'star') { FX.collectStar(this, t.idx); return; }
    switch (t.interact) {
      case 'vanity': this.openWardrobe('all'); break;
      case 'wardrobe': this.openWardrobe('dress'); break;
      case 'bed': this.nightlyButton(); break;
      case 'mansion': this.goRoom('bedroom', 88, 184, 'up'); break;
      case 'tower':
        if (this.kens[ROSAN].unlocked) this.goRoom('penthouse', 88, 184, 'up'); else this.startTower();
        break;
      case 'fountain': this.wish(); break;
      case 'hut': this.freebie('hut', 'Free mango smoothie! 🥭', 12, t.cx, t.cy); break;
      case 'bar': this.freebie('bar', 'Sparkling juice! 🥂', 15, t.cx, t.cy + 20); break;
      case 'dj': FX.openDjMenu(this); break;
      case 'petshop': FX.openPetShop(this); break;
      case 'cafe': this.goRoom('cafe', 88, 190, 'up'); break;
      case 'spadoor': this.goRoom('spa', 88, 190, 'up'); break;
      case 'latte': this.paid('latte', 20, '☕ A pink latte! Warm & cosy.', () => { this.charm += 150; this.dailyPoints += 150; this.popup('+150 ✨', t.cx, t.cy, '#ffd0f0'); }); break;
      case 'cake': this.paid('cake', 30, '🍰 You bought a cake! The next Ken you talk to gets a sweet surprise.', () => { this.roseGift = true; }); break;
      case 'study': {
        if (this.daily.has('study')) { this.say('📚 Your brain is full for today!'); break; }
        this.daily.add('study'); this.minutes += 60;
        const g = 60 + this.day * 15 + (this.stats.int >= 30 ? 80 : 0);
        this.gems += g; audio.play('coin'); this.popup(`+${g} 💎`, t.cx, t.cy, '#7ae8ff');
        this.say(`📚 You studied for an hour. Smart is the new pink! +${g} 💎${this.stats.int >= 30 ? ' (INT bonus!)' : ''}`); FX.track(this, 'study');
        break;
      }
      case 'stars': this.say(pickOne(['🔭 "Vega and Altair meet once a year across the Milky Way..."', '🌌 You find a note in the margin: "R.S. was here." Rosan?', '⭐ Fun fact: there are more stars than grains of sand on every beach.'])); break;
      case 'picnic': this.freebie('picnic', '🧺 A sunny picnic snack! Yum.', 20, t.cx, t.cy); break;
      case 'pond': FX.openPondMenu(this); break;
      case 'busk': {
        if (this.daily.has('busk')) { this.say('🎤 Your voice needs a rest. Tomorrow!'); break; }
        this.daily.add('busk'); this.minutes += 30;
        const g = Math.round(40 + this.stats.glam * 3);
        this.gems += g; this.rep += 0.5; audio.play('chime'); this.confetti(t.cx, t.cy, 20);
        this.popup(`+${g} 💎`, t.cx, t.cy, '#7ae8ff'); this.say(`🎤 You performed at the bandstand! A crowd tips ${g} 💎 · +0.5 Rep`); FX.track(this, 'perform');
        break;
      }
      case 'claw': {
        if (this.gems < 50) { this.say('You need 50 💎 for the claw machine.'); audio.play('error'); break; }
        this.gems -= 50; audio.play('coin');
        const r = Math.random();
        if (r < 0.06) { const f = this.grantSecret(); this.say(f ? `🧸 JACKPOT! The claw grabbed ${f}!` : '🧸 JACKPOT! +500 💎'); if (!f) this.gems += 500; this.confetti(t.cx, t.cy, 30); audio.play('unlock'); }
        else if (r < 0.4) { const w = 60 + Math.floor(Math.random() * 90); this.gems += w; this.say(`🧸 Got a plushie worth ${w} 💎!`); audio.play('chime'); }
        else this.say('🧸 The claw slipped... so close!');
        break;
      }
      case 'shop': this.openShop(); break;
      case 'runway': {
        if (this.daily.has('runway')) { this.say('💃 You already owned the runway today!'); break; }
        this.daily.add('runway');
        const sc = this.stats.total; const g = Math.round(sc * 2.5);
        this.gems += g; this.charm += sc * 5; this.dailyPoints += sc * 5; audio.play('masterpiece'); this.confetti(t.cx, t.cy, 30);
        this.say(`💃 Runway walk! Style score ${sc} → +${g} 💎 · +${sc * 5} ✨`); FX.track(this, 'runway');
        break;
      }
      case 'soak': this.freebie('soak', '♨️ The hot spring melts your stress away.', 25, t.cx, t.cy); if (this.anyRaag) this.say('♨️ Relaxed! (Tip: apologise to RAAG Kens to clear the penalty.)'); break;
      case 'massage': {
        if (this.heartbroken <= 0) { this.say('💆 You feel great already! Come back if your heart ever breaks.'); break; }
        if (this.gems < 300) { this.say('💆 Healing massage costs 300 💎.'); audio.play('error'); break; }
        this.gems -= 300; this.heartbroken = 0; audio.play('chime'); this.hearts(this.player.x, this.player.y - 20, 8);
        this.say('💆 Heartbreak healed! Your Style Points are back to normal.');
        break;
      }
      case 'fish': FX.startFishing(this, 'pier'); break;
      case 'fish_beach': FX.startFishing(this, 'beach'); break;
      case 'shack': FX.openShack(this); break;
      case 'gazebo': this.say(this.nm(pickOne(['🌸 Barbie daydreams of a rooftop wedding...', '🌸 A white rose petal floats down. Is someone watching from the tower?', `🌸 Your story so far: Reputation ${this.rep >= 0 ? '+' : ''}${Math.round(this.rep)}, Rosan Trust ${this.rosanTrust}.`]))); break;
      case 'rose': {
        if (this.roseGift) { this.say('🌹 You\'re already holding a gift!'); break; }
        if (this.daily.has('rose')) { this.say('🌹 Only one rose per day — the Florist is watching!'); break; }
        this.daily.add('rose'); this.roseGift = true; audio.play('chime');
        this.say('🌹 You picked a perfect rose! Give it to the next Ken you talk to (+1 ♥).');
        break;
      }
      case 'dinner': this.say(this.kens[ROSAN].unlocked ? 'A candlelit table for two. Talk to Rosan! 🕯️' : 'A candlelit table for two...'); break;
      default: break;
    }
  }
  paid(id: string, cost: number, msg: string, then: () => void) {
    if (this.daily.has(id)) { this.say('Come back tomorrow!'); audio.play('select'); return; }
    if (this.gems < cost) { this.say(`You need ${cost} 💎.`); audio.play('error'); return; }
    this.gems -= cost; this.daily.add(id); audio.play('coin'); then(); this.say(msg);
  }
  openShop() {
    const stock = ITEMS.filter((it) => it.secret && !it.code && !this.owned.has(it.id));
    this.mode = 'night'; this.cardStage = 'shop';
    this.setCard({
      title: 'Luxury Boutique', emoji: '🛍️', fx: 'none', tone: 'neutral',
      body: [stock.length ? `Rare couture, darling. You have ${this.gems.toLocaleString()} 💎.` : 'You own every rare piece! Fabulous.'],
      opts: [...stock.map((it) => { const price = 1500 + (it.stats.glam + it.stats.elegance) * 60; return { id: it.id, label: `${it.icon} ${it.name}`, sub: `${price.toLocaleString()} 💎 · ✨${it.stats.glam} 👑${it.stats.elegance}`, disabled: this.gems < price }; }), { id: 'leave', label: '👋 Leave the boutique' }],
    });
  }
  buyItem(id: string) {
    if (id === 'leave') { this.card = null; this.mode = 'play'; this.emit(); return; }
    const it = ITEM_BY_ID[id];
    if (!it) return;
    const price = 1500 + (it.stats.glam + it.stats.elegance) * 60;
    if (this.gems < price) { audio.play('error'); this.say(`Not enough 💎 (need ${price.toLocaleString()})`); return; }
    this.gems -= price; this.owned.add(id); audio.play('unlock');
    this.say(`🛍️ Bought ${it.icon} ${it.name}! Find it in your wardrobe.`, 3000);
    this.openShop();
  }
  freebie(id: string, msg: string, gems: number, x: number, y: number) {
    if (this.daily.has(id)) { this.say('Come back tomorrow for another treat!'); audio.play('select'); return; }
    this.daily.add(id);
    this.gems += gems;
    audio.play('coin');
    this.popup(`+${gems} 💎`, x, y - 8, '#7ae8ff');
    this.say(msg);
    this.burst(x, y, 10, ['#ffe080', '#7ae8ff', '#ffffff'], 'spark');
  }
  wish() {
    if (this.gems < 10) { this.say('You need 10 💎 to make a wish.'); audio.play('error'); return; }
    this.gems -= 10;
    audio.play('coin');
    this.burst(88, 112, 14, ['#7ae8ff', '#ffffff'], 'px');
    if (Math.random() < 0.28) {
      const win = 40 + Math.floor(Math.random() * 120);
      this.gems += win; audio.play('chime');
      this.popup(`WISH! +${win} 💎`, 88, 90, '#ffe080', true); this.say('✨ The fountain granted your wish!');
      this.confetti(88, 96, 20);
    } else this.say('The fountain ripples... not this time.');
    FX.track(this, 'wish');
    this.emit();
  }

  /* ------------------------------------------------------------ dialogue */
  styleCheck(i: number) {
    const w = KENS[i].want;
    const have = this.stats[w.stat];
    return { stat: w.stat, need: w.min, have, pass: have >= w.min };
  }
  startDialogue(i: number) {
    const ks = this.kens[i];
    const k = KENS[i];
    const p = this.player;
    const ang = Math.atan2(ks.y - p.y, ks.x - p.x);
    p.dir = Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang)) ? (Math.cos(ang) > 0 ? 'right' : 'left') : (Math.sin(ang) > 0 ? 'down' : 'up');
    ks.dir = p.dir === 'right' ? 'left' : p.dir === 'left' ? 'right' : p.dir === 'up' ? 'down' : 'up';
    ks.frame = 0;
    p.frame = 0;
    this.mode = 'dialogue';
    this.dlgSel = 0;
    if (!ks.unlocked) {
      const can = this.canUnlock(i);
      const graph: Graph = {
        root: {
          text: `${k.greet}\n\n(${k.title}. ${k.bio})`,
          opts: [
            { label: `💎 Unlock ${k.name} — ${k.cost} gems${can.ok ? '' : ` (${can.why})`}`, fx: { unlock: true }, locked: !can.ok, reply: `${k.name} grins. "Finally! Let's make some magic, Barbie."`, next: null },
            { label: 'Maybe later...', next: null },
          ],
        },
      };
      this.dlg = { ken: i, kind: 'unlock', graph, node: 'root', text: '', opts: [], isReply: false, rev: 0 };
    } else {
      ks.talks++;
      this.totalChats++;
      FX.track(this, 'chat');
      if (this.roseGift && i !== ROSAN) { this.roseGift = false; ks.morale = Math.min(10, ks.morale + 1); this.hearts(ks.x, ks.y - 20, 6); this.say(`🌹 You gave ${k.name} a rose! +1 ♥`); FX.track(this, 'gift'); }
      else if (this.roseGift && i === ROSAN) { this.roseGift = false; this.rosanTrust = Math.min(10, this.rosanTrust + 1); this.say('🌹 Rosan accepts your rose. +1 Trust'); }
      if (this.ex.gift && i !== ROSAN) FX.applyGift(this, i);
      const rival = KENS[i ^ 1] || KENS[i];
      const rs = (this.kens[i ^ 1] || this.kens[i]);
      const graph = buildKenGraph(i, { morale: ks.morale, raag: ks.raag, rivalName: rs.unlocked && (i ^ 1) < ROSAN && i < ROSAN ? rival.name : null, danced: this.daily.has('dance'), loveSeen: this.loveSeen, mood: this.rosanMood, seen: [...this.seenCuts], trust: this.rosanTrust, flags: [...this.flags] });
      this.dlg = { ken: i, kind: 'ken', graph, node: 'root', text: '', opts: [], check: this.styleCheck(i), isReply: false, rev: 0 };
    }
    this.setNode('root');
    audio.play('confirm');
  }
  startTower() {
    const glam = this.stats.glam;
    const have = [
      { ok: this.kens[GUARD].unlocked, t: `Unlock ${KENS[GUARD].name} (Tier ${GUARD + 1})` },
      { ok: this.gems >= ROSAN_GEM_REQ, t: `${ROSAN_GEM_REQ.toLocaleString()} Style Gems (you have ${this.gems.toLocaleString()})` },
      { ok: glam >= ROSAN_GLAM_REQ, t: `MAXED Glamour ${ROSAN_GLAM_REQ}/100 (your look: ${glam})` },
    ];
    const all = have.every((h) => h.ok);
    const graph: Graph = {
      root: {
        text: `🏙️ The Penthouse Tower. The doorman whispers: "Rosan Sawad, Tier ${ROSAN + 1} — The Ultimate Ken — receives only the truly flawless."\n\n${have.map((h) => `${h.ok ? '✔' : '✖'} ${h.t}`).join('\n')}`,
        opts: [
          { label: all ? '✨ Unlock Rosan Sawad & ride the elevator' : '🔒 Requirements not met', fx: { unlock: true }, locked: !all, reply: 'The doors slide open. A skyline glitters... and a tall silhouette turns around, glowing softly. "Barbie. At last."', next: null },
          { label: 'Leave', next: null },
        ],
      },
    };
    this.mode = 'dialogue'; this.dlgSel = 0;
    this.dlg = { ken: ROSAN, kind: 'tower', graph, node: 'root', text: '', opts: [], isReply: false, rev: 0 };
    this.setNode('root');
  }
  canUnlock(i: number): { ok: boolean; why: string } {
    const k = KENS[i];
    if (i > 0 && !this.kens[i - 1].unlocked) return { ok: false, why: 'unlock previous Ken' };
    if (i === ROSAN) {
      if (this.gems < ROSAN_GEM_REQ) return { ok: false, why: `need ${ROSAN_GEM_REQ} gems` };
      if (this.stats.glam < ROSAN_GLAM_REQ) return { ok: false, why: 'need max Glam' };
      return { ok: true, why: '' };
    }
    if (this.gems < k.cost) return { ok: false, why: `need ${k.cost - this.gems} more` };
    return { ok: true, why: '' };
  }
  setNode(id: string) {
    const d = this.dlg!;
    const n = d.graph[id];
    d.node = id; d.text = this.nm(n.text); d.opts = n.opts; d.isReply = false; d.rev++;
    this.dlgSel = 0;
    this.emit();
  }
  chooseOption(i: number) {
    const d = this.dlg;
    if (!d || this.mode !== 'dialogue') return;
    const o = d.opts[i];
    if (!o) return;
    if (o.locked) { audio.play('error'); this.say('Not yet...'); return; }
    audio.play('select');
    if (o.fx) this.applyFx(d.ken, o.fx);
    if (!this.dlg) return;
    if (o.reply) {
      d.text = this.nm(o.reply); d.opts = [{ label: 'Continue ▶', next: o.next ?? null }]; d.isReply = true; d.rev++; this.dlgSel = 0;
      this.emit();
      return;
    }
    if (d.isReply && o.next === undefined) { this.endDialogue(); return; }
    if (o.next === null || o.next === undefined) { this.endDialogue(); return; }
    this.setNode(o.next);
  }
  endDialogue() {
    const d = this.dlg;
    this.dlg = null;
    this.mode = 'play';
    if (d && d.kind === 'ken') this.minutes += 15;
    if (this.pendingCutscene) {
      this.cutscene = this.pendingCutscene; this.pendingCutscene = null; this.mode = 'cutscene';
      audio.setMood('penthouse'); audio.play('chime');
    }
    if (d && d.kind === 'tower' && this.kens[ROSAN].unlocked) this.goRoom('penthouse', 88, 184, 'up');
    this.emit();
  }
  endCutscene() {
    const id = this.cutscene;
    this.cutscene = null; this.mode = 'play';
    if (id === 'love' && !this.loveSeen) {
      this.loveSeen = true;
      this.charm += 25000; this.dailyPoints += 25000;
      this.popup('TRUE LOVE +25,000 ✨', 88, 90, '#ff7ab4', true);
      this.say('💖 TRUE LOVE ENDING achieved! Keep playing for a higher score.', 4200);
    } else if (id === 'dance') this.daily.add('dance');
    if (id && !this.seenCuts.has(id)) {
      this.seenCuts.add(id);
      if (id !== 'love' && id !== 'dance') { this.gems += 2000; this.charm += 3000; this.popup('NEW MEMORY +3,000 ✨', 88, 90, '#7af0ff', true); this.say(`🎬 Rosan memory unlocked (${this.seenCuts.size}/7) · +2000 💎`); }
    }
    this.updateMood();
    this.emit();
  }

  applyFx(i: number, fx: Fx) {
    const ks = this.kens[i];
    const k = KENS[i];
    const px = ks.x, py = ks.y - 26;
    if (fx.unlock) { this.unlockKen(i); return; }
    if (fx.points) this.award(i, fx.points);
    if (fx.gems) { this.gems += fx.gems; audio.play('gem'); this.popup(`+${fx.gems} 💎`, px, py - 8, '#7ae8ff'); }
    if (fx.morale) {
      const before = ks.morale;
      ks.morale = Math.max(0, Math.min(10, ks.morale + fx.morale));
      if (fx.morale > 0) { this.hearts(px, py + 6, 4 + Math.floor(fx.morale * 3)); audio.play('chime'); if (before < 10 && ks.morale >= 10) { this.popup('MAX HEARTS ♥', px, py - 14, '#ff7ab4', true); this.confetti(px, py, 24); } }
      else { audio.play('anger'); this.kick(2); }
    }
    if (fx.lore) { ks.lore = true; this.popup('📖 Lore unlocked', px, py - 16, '#ffd070'); }
    if (fx.jealous) {
      const r = (this.kens[i ^ 1] || this.kens[i]);
      if (r.unlocked && i < ROSAN && (i ^ 1) < ROSAN) { r.morale = Math.max(0, r.morale - 1); this.react(i ^ 1, 'anger'); this.say(`🔥 ${KENS[i ^ 1].name} is JEALOUS! (-1 ♥)`); }
    }
    if (fx.clearRaag) { ks.raag = false; this.say(`💐 ${k.name} forgave you! Raag cleared.`); }
    if (fx.emote) this.react(i, fx.emote);
    if (fx.minutes) this.minutes += fx.minutes;
    if (fx.cutscene) this.pendingCutscene = fx.cutscene;
    if (fx.trust) { this.rosanTrust = Math.max(-5, Math.min(10, this.rosanTrust + fx.trust)); this.popup(`🤝 Trust ${fx.trust > 0 ? '+' : ''}${fx.trust}`, px, py - 22, '#7af0ff'); }
    if (fx.rep) { this.rep += fx.rep; this.popup(`⭐ Rep +${fx.rep}`, px, py - 30, '#ffe080'); }
    if (fx.flag) this.flags.add(fx.flag);
    this.emit();
  }

  unlockKen(i: number) {
    const c = this.canUnlock(i);
    const k = KENS[i];
    if (!c.ok) { audio.play('error'); this.say(`Can't unlock yet: ${c.why}`); this.dlgSel = 0; return; }
    if (i !== ROSAN) this.gems -= k.cost;
    const ks = this.kens[i];
    ks.unlocked = true; ks.morale = 2;
    this.suitor = i + 1 < KENS.length ? i + 1 : KENS.length;
    if (i === ROSAN) this.placeKen(ROSAN);
    else if (this.suitor < ROSAN) this.placeKen(this.suitor);
    audio.play('unlock');
    this.kick(3);
    this.confetti(ks.x, ks.y - 12, 50);
    this.hearts(ks.x, ks.y - 20, 6);
    this.popup(`${k.name} UNLOCKED!`, ks.x, ks.y - 40, '#ffe080', true);
    this.say(`🎉 ${k.name} joined your Ken Catalog! Daily multiplier x${k.mult}`, 3400);
    this.emit();
  }

  /** compute & grant reward for an interaction with Ken i. */
  award(i: number, factor: number) {
    const ks = this.kens[i];
    const k = KENS[i];
    const st = this.stats;
    const base = 12 + st.total * 0.25;
    const sc = this.styleCheck(i);
    const mp = this.masterpiece;
    const repeat = [1, 0.6, 0.3, 0.15][Math.min(Math.max(ks.talks - 1, 0), 3)];
    const first = this.day === 1 && i === 0 && ks.talks === 1 ? 2 : 1;
    const mult = (1 + ks.morale * 0.1) * (sc.pass ? 1.5 : 0.6) * (mp ? 3 : 1) * (this.kissActive ? 1.5 : 1) * (this.anyRaag ? 0.7 : 1) * (this.heartbroken > 0 ? 0 : 1);
    const bunny = FX.activePetId(this) === 'bunny' ? 1.04 + 0.04 * FX.bondOf(this, 'bunny') : 1;
    const pts = Math.round(base * k.mult * mult * factor * repeat * first * bunny);
    const x = ks.x, y = ks.y - 34;
    if (this.heartbroken > 0) { this.popup('💔 0 pts', x, y, '#ff6a8a', true); audio.play('error'); return; }
    const gem = Math.max(1, Math.ceil(pts * 0.5));
    this.charm += pts; this.dailyPoints += pts; this.gems += gem;
    if (mp) this.todayMasterpieces.add(mp.name);
    this.popup(`+${pts.toLocaleString()} ✨${mp ? ' x3' : ''}`, x, y, mp ? '#ffe080' : '#ffd0f0', pts > 200);
    this.popup(`+${gem.toLocaleString()} 💎`, x, y + 12, '#7ae8ff');
    audio.play('gem');
    this.burst(x, y + 14, 6 + Math.min(14, Math.floor(pts / 40)), ['#ffe080', '#7ae8ff', '#ffffff', '#ff9ad0'], 'spark', 40);
    if (!sc.pass && factor >= 1) this.say(`${k.name} wants ${STAT_LABEL[sc.stat]} ≥ ${sc.need} (you: ${sc.have}) — rewards reduced!`);
    else if (sc.pass && factor >= 1) this.say(`✔ ${k.name} loves your ${STAT_LABEL[sc.stat]}!`, 1800);
  }

  /* ------------------------------------------------------------ night */
  nightlyButton() {
    if (this.mode !== 'play' || this.fade) return;
    if (this.minutes < 1200) { this.say('🌙 Nightly Choice opens at 8:00 PM — keep dating!'); audio.play('error'); return; }
    this.beginNight(false);
  }
  beginNight(forced: boolean) {
    this.mode = 'night';
    this.room = 'bedroom';
    this.player.x = 56; this.player.y = 150; this.player.dir = 'down'; this.fade = null;
    this.hbToday = this.heartbroken > 0;
    if (this.heartbroken > 0) this.heartbroken--;
    this.target = null;
    audio.setMood('night');
    if (forced) this.say('🕛 Midnight! Time to wind down.');
    this.showSelect();
  }
  showSelect() {
    const list = this.kens.map((k, i) => ({ k, i })).filter((x) => x.k.unlocked).sort((a, b) => b.k.morale - a.k.morale);
    this.cardStage = 'select';
    this.setCard({
      title: 'Goodnight Kiss', emoji: '🌙', fx: 'none', tone: 'neutral',
      body: [`Day ${this.day} winds down. Who's walking Barbie to her door tonight?`],
      opts: [...list.map(({ k, i }) => ({ id: 'k' + i, label: KENS[i].name, sub: `♥ ${Math.floor(k.morale)}/10${k.raag ? ' · 😤 RAAG' : ''}` })), { id: 'none', label: 'Nobody tonight 😴', sub: 'Skip the kiss' }],
    });
  }
  setCard(c: Card) { c.body = c.body.map((b) => this.nm(b)); c.title = this.nm(c.title); this.card = c; this.cardSel = 0; this.emit(); }
  cardChoice(id: string) {
    if (!this.card) return;
    audio.play('select');
    const st = this.cardStage;
    if (FX.cardChoice(this, st, id)) return;
    if (st === 'story') { this.resolveStory(id); return; }
    if (st === 'storyres' || st === 'info') {
      this.card = null; this.mode = 'play';
      if (this.scandals >= 3) { this.finish('scandal'); return; }
      this.save(); this.emit(); return;
    }
    if (st === 'shop') { this.buyItem(id); return; }
    if (st === 'select') {
      if (id === 'none') { this.showSus(); return; }
      const i = parseInt(id.slice(1), 10);
      this.pendingKen = i;
      this.cardStage = 'kiss';
      this.setCard({
        title: `${KENS[i].name} leans in...`, emoji: '💋', ken: i, fx: 'hearts', tone: 'good',
        body: [`${KENS[i].name} walks you to your door under the stars. He's blushing.`, 'A goodnight kiss?'],
        opts: [{ id: 'give', label: '💋 Give a goodnight kiss', sub: 'Ken +♥ · +50% points for 24h' }, { id: 'refuse', label: '🚫 Not tonight', sub: 'Ken goes RAAG · -30% earnings until you make up' }],
      });
      return;
    }
    if (st === 'kiss') {
      const i = this.pendingKen;
      const ks = this.kens[i];
      if (id === 'give') {
        ks.morale = Math.min(10, ks.morale + 1); ks.raag = false;
        this.kissUntil = this.day * 1440 + 1440;
        const r = (this.kens[i ^ 1] || this.kens[i]);
        const lines = [`${KENS[i].name}'s heart pops with joy! +1 ♥`, '💋 +50% Style Points for the next 24 hours!'];
        if (r.unlocked && i < ROSAN && (i ^ 1) < ROSAN) { r.morale = Math.max(0, r.morale - 1); lines.push(`😾 Rival ${KENS[i ^ 1].name} heard about it... jealous! -1 ♥`); }
        audio.play('kiss'); setTimeout(() => audio.play('chime'), 300);
        this.cardStage = 'kissed';
        this.setCard({ title: 'Sweet Dreams', emoji: '💖', ken: i, fx: 'hearts', tone: 'good', body: lines, opts: [{ id: 'next', label: 'Continue ▶' }] });
      } else {
        ks.morale = Math.max(0, ks.morale - 1); ks.raag = true;
        audio.play('anger'); this.kick(4);
        this.cardStage = 'kissed';
        this.setCard({ title: 'RAAG! >_<', emoji: '😤', ken: i, fx: 'anger', tone: 'bad', body: [`${KENS[i].name} stomps off with a >_< face.`, 'Daily reward earnings -30% until you make it up to him (talk to him & apologise).'], opts: [{ id: 'next', label: 'Continue ▶' }] });
      }
      return;
    }
    if (st === 'kissed') { this.showSus(); return; }
    if (st === 'sus') { this.resolveSus(id); return; }
    if (st === 'susres') {
      if (this.scandals >= 3) { this.finish('scandal'); return; }
      this.showSummary();
      return;
    }
    if (st === 'summary') {
      if (this.day >= MAX_DAYS) { this.finish('season'); return; }
      this.startDay();
    }
  }
  showSus() {
    this.cardStage = 'sus';
    this.setCard({
      title: 'Midnight Choice', emoji: '🌙', fx: 'none', tone: 'neutral',
      body: ['The mansion is silent. Across the city, neon glows on a hidden rooftop...', '⚠ 40% chance of getting caught!'],
      opts: [
        { id: 'party', label: '🎉 Sneak to the secret rooftop party', sub: 'Reward: rare dress or limited jewellery chest' },
        { id: 'spy', label: '🕵️ Spy on the rival Kens', sub: 'Reward: secrets, gems & maybe a rare find' },
        { id: 'sleep', label: '😴 Stay in bed (safe)', sub: 'Beauty sleep. No risk.' },
      ],
    });
  }
  grantSecret(): string | null {
    const pool = ITEMS.filter((it) => it.secret && !this.owned.has(it.id));
    if (!pool.length) return null;
    const it = pickOne(pool);
    this.owned.add(it.id);
    return `${it.icon} ${it.name}`;
  }
  resolveSus(id: string) {
    this.cardStage = 'susres';
    if (id === 'sleep') {
      this.setCard({ title: 'Beauty Sleep', emoji: '😴', fx: 'none', tone: 'neutral', body: ['Barbie dreams of fashion runways and rooftop dances.', 'You wake up glowing.'], opts: [{ id: 'next', label: 'Continue ▶' }] });
      return;
    }
    const caught = Math.random() < 0.4;
    if (caught) {
      this.heartbroken = 1; this.scandals++;
      audio.play('caught'); this.kick(8); this.flash = 1;
      this.setCard({
        title: 'CAUGHT!', emoji: '📸', fx: 'flash', tone: 'bad',
        body: ['Paparazzi flashbulbs everywhere! Your sneaky night is on every front page.', '💔 HEARTBROKEN STATE: 0% Style Points for tomorrow.', `Scandal meter: ${this.scandals}/3${this.scandals >= 3 ? ' — your reputation is ruined!' : ''}`],
        opts: [{ id: 'next', label: this.scandals >= 3 ? 'Face the consequences ▶' : 'Continue ▶' }],
      });
      return;
    }
    const gemsWon = 150 + this.day * 40;
    this.gems += gemsWon;
    const lines: string[] = [];
    let found: string | null = null;
    if (id === 'party') {
      found = this.grantSecret();
      lines.push('You slip into the secret rooftop party. Nobody notices. Glitter rains from the sky!');
      lines.push(found ? `🎁 Hidden chest unlocked: ${found}` : '🎁 The chest is empty — you already own every rare item!');
    } else {
      const unl = this.kens.map((k, i) => ({ k, i })).filter((x) => x.k.unlocked && x.i < ROSAN);
      const a = unl.length ? pickOne(unl).i : 0;
      lines.push(`You spy on ${KENS[a].name}... and overhear: "${KENS[a].lore}"`);
      this.kens[a].lore = true; this.kens[a].morale = Math.min(10, this.kens[a].morale + 0.5);
      if (Math.random() < 0.4) { found = this.grantSecret(); if (found) lines.push(`🎁 You also found a hidden stash: ${found}`); }
    }
    lines.push(`💎 +${gemsWon.toLocaleString()} gems`);
    audio.play('unlock'); this.confetti(88, 80, 40);
    this.setCard({ title: id === 'party' ? 'Rooftop Rager!' : 'Super Spy!', emoji: id === 'party' ? '🎉' : '🕵️', fx: 'confetti', tone: 'good', body: lines, opts: [{ id: 'next', label: 'Continue ▶' }] });
  }
  showSummary() {
    // morale decay for unvisited kens
    const lonely: string[] = [];
    this.kens.forEach((k, i) => { if (k.unlocked && k.talks === 0) { k.morale = Math.max(0, k.morale - 0.25); if (k.morale > 0) lonely.push(KENS[i].name); } });
    const chatted = this.kens.filter((k) => k.talks > 0).length;
    const body = [
      `✨ Style Points today: ${this.dailyPoints.toLocaleString()}${this.hbToday ? ' (💔 Heartbroken day)' : ''}`,
      `💎 Style Gems: ${this.gems.toLocaleString()}`,
      `💞 Kens charmed today: ${chatted} / ${this.unlockedCount}`,
    ];
    if (this.todayMasterpieces.size) body.push(`🏆 Masterpiece: ${[...this.todayMasterpieces].join(', ')}`);
    if (this.kissActive) body.push('💋 Kiss bonus active: +50% tomorrow');
    if (this.anyRaag) body.push('😤 A Ken is in RAAG: -30% until you apologise');
    if (this.heartbroken > 0) body.push('💔 Heartbroken tomorrow: 0% points');
    if (lonely.length) body.push(`😢 Lonely: ${lonely.slice(0, 3).join(', ')}${lonely.length > 3 ? '…' : ''} (-0.25 ♥)`);
    this.cardStage = 'summary';
    this.setCard({
      title: `Day ${this.day} Complete`, emoji: '📔', fx: 'none', tone: 'neutral', body,
      opts: [{ id: 'next', label: this.day >= MAX_DAYS ? '🏁 See Final Results' : `☀ Start Day ${this.day + 1}` }],
    });
  }
  startDay() {
    this.day++;
    this.minutes = 360;
    this.weather = Math.random() < 0.28 ? 'rainy' : 'sunny';
    this.dailyPoints = 0;
    this.daily = new Set(); this.todayMasterpieces = new Set();
    this.kens.forEach((k) => { k.talks = 0; });
    this.card = null; this.mode = 'play'; this.room = 'bedroom';
    this.player.x = 56; this.player.y = 150; this.player.dir = 'down';
    this.lastPhase = this.phase;
    this.relocateAll(false);
    this.particles = [];
    this.bannerRoom(); this.updateMood();
    audio.play('chime');
    this.rosanMood = this.flags.has('player') && Math.random() < 0.4 ? 5 : Math.floor(Math.random() * 5);
    this.roseGift = false;
    FX.rollDaily(this);
    this.petS.x = this.player.x; this.petS.y = this.player.y + 2;
    this.save();
    if (storyFor(this.day)) { this.showStory(this.day); return; }
    this.say(`☀ Day ${this.day} · ${this.dayName} — ${this.weather === 'rainy' ? 'Rainy 🌧' : 'Sunny ☀'}${this.heartbroken > 0 ? ' · 💔 0% points today' : ''}`, 3200);
    FX.notify(this, '⭐ 4 Lucky Stars fell over Dreamtown! Check your 📋 Journal (J)');
    this.emit();
  }

  finish(reason: 'season' | 'scandal') {
    const hearts = this.kens.reduce((s, k) => s + (k.unlocked ? k.morale : 0), 0);
    const parts = [
      { label: 'Charm Score', value: this.charm },
      { label: `Kens unlocked (${this.unlockedCount} × 250)`, value: this.unlockedCount * 250 },
      { label: `Hearts (${hearts.toFixed(1)} × 50)`, value: Math.round(hearts * 50) },
    ];
    const ending = endingFor({ rep: this.rep, flags: this.flags, love: this.loveSeen, rosanTrust: this.rosanTrust, kens: this.unlockedCount, scandal: reason === 'scandal' });
    parts.push({ label: `Reputation (${this.rep} × 300)`, value: this.rep * 300 });
    const score = Math.max(0, parts.reduce((s, p) => s + p.value, 0));
    const entry: ScoreEntry = { name: this.playerName.toUpperCase(), score, days: this.day, kens: this.unlockedCount, ending: ending.name, date: new Date().toLocaleDateString() };
    const { rank, list } = addScore(entry);
    this.scores = list;
    this.over = { reason, ending, score, rank, list, parts };
    deleteSlot(this.slot);
    this.mode = 'gameover'; this.card = null;
    audio.setMood('night');
    audio.play(reason === 'scandal' ? 'caught' : 'unlock');
    this.emit();
  }

  /* ------------------------------------------------------------ update */
  solidAt(def: RoomDef, x: number, y: number) {
    const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
    if (ty < 0) return true;
    if (tx < 0 || tx >= 11 || ty >= 13) return false;
    return def.solid[ty][tx];
  }
  boxFree(def: RoomDef, x: number, y: number, hw = 3) {
    return !(this.solidAt(def, x - hw, y - 0.5) || this.solidAt(def, x + hw, y - 0.5) || this.solidAt(def, x - hw, y - 3) || this.solidAt(def, x + hw, y - 3));
  }

  update(dt: number) {
    this.t += dt * 1000;
    this.updateParticles(dt);
    this.popups = this.popups.filter((p) => this.t - p.born < 1700);
    if (this.toast && this.t > this.toast.until) { this.toast = null; this.emit(); }
    if (this.banner && this.t > this.banner.until) { this.banner = null; this.emit(); }
    this.shake *= Math.pow(0.001, dt);
    if (this.shake < 0.1) this.shake = 0;
    this.flash = Math.max(0, this.flash - dt * 2);
    this.kens.forEach((k) => { if (k.emoteT) { k.emoteT.t -= dt; if (k.emoteT.t <= 0) k.emoteT = null; } });
    if (this.player.emote) { this.player.emote.t -= dt; if (this.player.emote.t <= 0) this.player.emote = null; }

    if (this.fade) {
      const f = this.fade;
      f.t += dt;
      if (f.phase === 0 && f.t >= 0.16) { this.enterRoom(f.to, f.x, f.y, f.dir); f.phase = 1; f.t = 0; }
      else if (f.phase === 1 && f.t >= 0.16) this.fade = null;
    }
    if (this.mode === 'title') {
      this.titleMin += dt * 45;
      if (this.titleMin >= 1440) this.titleMin = 360;
    }
    if (!this.toast && this.notes.length && (this.mode === 'play' || this.mode === 'fishing')) this.say(this.notes.shift()!, 3200);
    if (this.mode === 'play') this.updatePlay(dt);
    else if (this.mode === 'fishing') FX.updateFishing(this, dt);
    else if (this.mode === 'dance') FX.updateDance(this, dt);
    else if (this.mode === 'dialogue' || this.mode === 'wardrobe' || this.mode === 'journal') this.ambient(dt);
  }

  updatePlay(dt: number) {
    const p = this.player;
    const def = this.roomDef;
    let vx = this.input.ax, vy = this.input.ay;
    const k = this.keys;
    if (k.has('KeyA') || k.has('ArrowLeft')) vx -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) vx += 1;
    if (k.has('KeyW') || k.has('ArrowUp')) vy -= 1;
    if (k.has('KeyS') || k.has('ArrowDown')) vy += 1;
    const mag = Math.hypot(vx, vy);
    if (mag > 1) { vx /= mag; vy /= mag; }
    const moving = mag > 0.15 && !(this.fade && this.fade.phase === 0);
    p.moving = moving;
    if (moving) {
      const sx = vx * SPEED * dt, sy = vy * SPEED * dt;
      if (this.boxFree(def, p.x + sx, p.y)) p.x += sx;
      if (this.boxFree(def, p.x, p.y + sy)) p.y += sy;
      p.x = Math.max(3, Math.min(W - 3, p.x)); p.y = Math.min(H - 1, p.y);
      p.dir = Math.abs(vx) > Math.abs(vy) + 0.1 ? (vx > 0 ? 'right' : 'left') : vy > 0 ? 'down' : 'up';
      const old = Math.floor(p.ft) % 4;
      p.ft += dt * 8.5;
      p.frame = Math.floor(p.ft) % 4;
      if (p.frame !== old && (p.frame === 1 || p.frame === 3)) audio.play('step');
    } else { p.frame = 0; p.ft = 0; }

    // time
    this.minutes += dt * MIN_PER_SEC;
    if (this.phase !== this.lastPhase) {
      this.lastPhase = this.phase;
      this.relocateAll(true);
      this.updateMood();
      this.say(this.phase === 1 ? '🌤 Afternoon — Kens are changing spots!' : '🌇 Evening — the nightlife begins!', 2600);
    }
    if (this.minutes >= 1440) { this.beginNight(true); return; }

    // kens
    for (let i = 0; i < this.kens.length; i++) {
      const ks = this.kens[i];
      if (!this.kenVisible(i) || ks.room !== this.room) continue;
      this.updateKen(ks, dt, def);
    }
    this.target = this.findTarget();

    // exits
    if (!this.fade) {
      for (const ex of def.exits) {
        if (p.x >= ex.x && p.x <= ex.x + ex.w && p.y >= ex.y && p.y <= ex.y + ex.h) { this.goRoom(ex.to, ex.sx, ex.sy, ex.dir); break; }
      }
    }
    FX.updatePet(this, dt);
    this.ambient(dt);
    this.uiT += dt;
    if (this.uiT > 0.2) { this.uiT = 0; this.emit(); }
  }

  updateKen(ks: KenState, dt: number, def: RoomDef) {
    if (ks.wait > 0) {
      ks.wait -= dt;
      ks.frame = 0;
      if (ks.wait <= 0) {
        ks.tx = ks.hx + rnd(-12, 12); ks.ty = ks.hy + rnd(-6, 6);
        ks.wait = 0;
      }
      return;
    }
    const dx = ks.tx - ks.x, dy = ks.ty - ks.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) { ks.wait = rnd(1.2, 4); ks.frame = 0; return; }
    const sp = 14 * dt;
    const nx = ks.x + (dx / d) * sp, ny = ks.y + (dy / d) * sp;
    if (this.boxFree(def, nx, ny, 3)) { ks.x = nx; ks.y = ny; } else { ks.wait = rnd(0.5, 2); ks.tx = ks.x; ks.ty = ks.y; return; }
    ks.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    ks.ft += dt * 6; ks.frame = Math.floor(ks.ft) % 4;
  }

  updateParticles(dt: number) {
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt;
      if (p.kind === 'petal') p.vx = Math.sin(this.t / 400 + p.s) * 10;
      if (p.life <= 0 || p.y > H + 6 || p.x < -10 || p.x > W + 10) ps.splice(i, 1);
    }
  }

  ambient(dt: number) {
    if (this.particles.length > 360) return;
    const env = this.env;
    const def = this.roomDef;
    const a = this.amb;
    const out = def.outdoor;
    const sp = (kind: P['kind'], x: number, y: number, vx: number, vy: number, life: number, col: string, g = 0, s = 1) =>
      this.particles.push({ x, y, vx, vy, g, life, max: life, kind, col, s });
    if (env.rainy && (out || def.skyRects.length)) {
      a.rain += dt * (out ? 120 : 0);
      while (a.rain > 1) { a.rain--; sp('drop', rnd(-10, W + 10), -4, -26, rnd(190, 250), 1.2, '#bfe4ff'); }
    } else {
      const m = env.minutes;
      if (m < 560 || (m > 1000 && m < 1110)) { a.mote += dt * 3; while (a.mote > 1) { a.mote--; sp('mote', rnd(0, W), rnd(40, H), rnd(-4, 4), rnd(-8, -2), rnd(2, 4), m < 560 ? '#fff0a0' : '#ffd0e8'); } }
      if (out && m > 1050 && m < 1200) { a.petal += dt * 2; while (a.petal > 1) { a.petal--; sp('petal', rnd(0, W), -2, 0, rnd(14, 24), 6, '#ff9ac8', 0, rnd(0, 6)); } }
      if (out && env.night > 0.4) { a.fly += dt * 1.4; while (a.fly > 1) { a.fly--; sp('fly', rnd(0, W), rnd(70, H - 10), rnd(-6, 6), rnd(-6, 6), rnd(3, 6), '#d8ff70'); } }
    }
    if (this.room === 'club') { a.glit += dt * 6; while (a.glit > 1) { a.glit--; sp('spark', rnd(20, 160), rnd(70, 170), 0, rnd(-14, -4), rnd(0.6, 1.3), pickOne(['#ff4f9a', '#38e8ff', '#ffd23c', '#ffffff'])); } }
    if (this.room === 'penthouse' && this.kens[ROSAN].unlocked) { a.aura += dt * 5; while (a.aura > 1) { a.aura--; const k = this.kens[ROSAN]; sp('spark', k.x + rnd(-9, 9), k.y - rnd(2, 22), 0, rnd(-14, -6), rnd(0.6, 1.2), pickOne(['#7af0ff', '#ffffff', '#b0f8ff'])); } }
  }

  /* ------------------------------------------------------------ render */
  kenEmote(i: number, ks: KenState): EmoteType | null {
    if (ks.emoteT) return ks.emoteT.type;
    if (!ks.unlocked) return 'question';
    if (ks.raag) return 'anger';
    if (i === 0 && this.day === 1 && ks.talks === 0) return 'heart';
    if (ks.talks === 0 && ((this.t / 1000 + i * 1.7) % 9) < 1.7) return 'heart';
    return null;
  }

  render() {
    const c = this.c;
    c.imageSmoothingEnabled = false;
    c.save();
    c.clearRect(0, 0, W, H);
    if (this.shake > 0) c.translate(Math.round(rnd(-this.shake, this.shake)), Math.round(rnd(-this.shake, this.shake)));
    const env = this.env;
    const room: RoomId = this.mode === 'title' ? 'town' : this.room;
    const def = ROOMS[room];
    const lay = this.layer(room);
    drawBackdrop(c, def, env);
    if (env.rainy && !def.outdoor) this.windowRain(c, def);
    c.drawImage(lay.back, 0, 0);
    def.dynamic(c, env);

    if (this.mode === 'title') this.renderTitleActors(c);
    else this.renderActors(c, room);
    c.drawImage(lay.front, 0, 0);
    if (this.mode === 'fishing') FX.drawFishing(c, this);
    this.renderParticles(c);
    this.renderLighting(c, def, env);
    c.drawImage(this.vignette, 0, 0);
    if (this.mode === 'dance') FX.drawDance(c, this);
    if (this.fade) {
      const f = this.fade;
      c.fillStyle = `rgba(20,0,30,${f.phase === 0 ? Math.min(1, f.t / 0.16) : Math.max(0, 1 - f.t / 0.16)})`;
      c.fillRect(0, 0, W, H);
    }
    if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${this.flash * 0.8})`; c.fillRect(0, 0, W, H); }
    c.restore();
  }

  windowRain(c: CanvasRenderingContext2D, def: RoomDef) {
    c.save();
    c.beginPath(); def.skyRects.forEach((r) => c.rect(r[0], r[1], r[2], r[3])); c.clip();
    c.fillStyle = 'rgba(200,225,255,0.7)';
    for (let i = 0; i < 24; i++) {
      const x = 10 + ((i * 17.3) % 44), y = ((this.t / 3 + i * 41) % 40) - 4;
      c.fillRect(Math.round(x), Math.round(8 + y), 1, 3);
    }
    c.restore();
  }

  renderActors(c: CanvasRenderingContext2D, room: RoomId) {
    type E = { y: number; draw: () => void };
    const es: E[] = [];
    const p = this.player;
    const sh = (x: number, y: number) => { c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(Math.round(x) - 5, Math.round(y) - 1, 10, 2); c.fillRect(Math.round(x) - 3, Math.round(y) - 2, 6, 1); };
    es.push({ y: p.y, draw: () => { sh(p.x, p.y); drawBarbie(c, p.x, p.y, p.dir, p.frame, this.look, this.t); } });
    if (FX.activePetId(this)) es.push({ y: this.petS.y, draw: () => FX.drawPet(c, this) });
    es.push({ y: -1, draw: () => FX.drawStars(c, this) });
    this.kens.forEach((ks, i) => {
      if (!this.kenVisible(i) || ks.room !== room) return;
      es.push({
        y: ks.y,
        draw: () => {
          if (i === ROSAN) this.drawAura(c, ks.x, ks.y);
          sh(ks.x, ks.y);
          const ghost = !ks.unlocked;
          if (ghost) c.globalAlpha = 0.9;
          drawKen(c, ks.x, ks.y, ks.dir, ks.frame, KENS[i].look, this.t);
          c.globalAlpha = 1;
          if (ks.raag) { c.fillStyle = 'rgba(255,40,40,0.18)'; c.fillRect(Math.round(ks.x) - 7, Math.round(ks.y) - 24, 14, 24); }
        },
      });
    });
    es.sort((a, b) => a.y - b.y).forEach((e) => e.draw());
    // emotes & arrows
    this.kens.forEach((ks, i) => {
      if (!this.kenVisible(i) || ks.room !== room) return;
      const em = this.kenEmote(i, ks);
      const top = ks.y - (KENS[i].look.hair.style === 'toque' ? 28 : 25);
      if (em) drawEmote(c, ks.x, top, em, this.t + i * 100);
    });
    if (p.emote) drawEmote(c, p.x, p.y - 27, p.emote.type, this.t);
    const tg = this.target;
    if (tg && this.mode === 'play') {
      const bob = Math.round(Math.sin(this.t / 160) * 1.5);
      let ax: number, ay: number;
      if (tg.type === 'ken') { const ks = this.kens[tg.idx]; ax = ks.x; ay = ks.y - 31 - (this.kenEmote(tg.idx, ks) ? 12 : 0); }
      else if (tg.type === 'star') { const sp = this.ex.stars[tg.idx]; ax = sp.x; ay = sp.y - 22; }
      else { ax = tg.cx; ay = tg.cy - 4; }
      ay += bob;
      c.fillStyle = '#3a2a3e'; c.fillRect(Math.round(ax) - 3, Math.round(ay) - 1, 7, 2); c.fillRect(Math.round(ax) - 2, Math.round(ay) + 1, 5, 1); c.fillRect(Math.round(ax) - 1, Math.round(ay) + 2, 3, 1);
      c.fillStyle = '#ffe080'; c.fillRect(Math.round(ax) - 2, Math.round(ay), 5, 1); c.fillRect(Math.round(ax) - 1, Math.round(ay) + 1, 3, 1); c.fillRect(Math.round(ax), Math.round(ay) + 2, 1, 1);
    }
  }

  drawAura(c: CanvasRenderingContext2D, x: number, y: number) {
    const pulse = 0.75 + 0.25 * Math.sin(this.t / 260);
    const g = c.createRadialGradient(x, y - 12, 2, x, y - 12, 26);
    g.addColorStop(0, `rgba(130,245,255,${0.55 * pulse})`); g.addColorStop(0.6, `rgba(120,200,255,${0.22 * pulse})`); g.addColorStop(1, 'rgba(120,200,255,0)');
    c.fillStyle = g; c.fillRect(x - 28, y - 42, 56, 56);
  }

  renderTitleActors(c: CanvasRenderingContext2D) {
    const t = this.t;
    const L = KENS.length * 26;
    for (let i = 0; i < KENS.length; i++) {
      const x = ((i * 26 + t * 0.022) % L) - 30;
      if (x < -10 || x > W + 10) continue;
      const fr = Math.floor(t / 150 + i) % 4;
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(Math.round(x) - 5, 187, 10, 2);
      if (i === ROSAN) this.drawAura(c, x, 188);
      drawKen(c, x, 188, 'right', fr, KENS[i].look, t);
    }
    const looks: Look[] = [
      { ...DEFAULT_LOOK },
      { ...DEFAULT_LOOK, hair: 'waves', hairColor: 'golden', outfit: 'ballgown', shoes: 'glass', head: 'crown', neck: 'pearl', makeup: 'peach' },
      { ...DEFAULT_LOOK, hair: 'buns', hairColor: 'rose', outfit: 'sequin', shoes: 'diamondheels', neck: 'diamondneck', makeup: 'smokey' },
      { ...DEFAULT_LOOK, hair: 'braids', hairColor: 'chestnut', outfit: 'bikini', shoes: 'sandals', eyes: 'sunglasses', makeup: 'pinkpop' },
    ];
    const lk = looks[(((Math.floor(t / 2200) % looks.length) + looks.length) % looks.length)];
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(83, 159, 10, 2);
    drawBarbie(c, 88, 161, 'down', Math.floor(t / 220) % 4 === 1 ? 0 : 0, lk, t);
  }

  renderParticles(c: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const a = Math.max(0, Math.min(1, p.life / Math.min(p.max, 0.6)));
      c.globalAlpha = p.kind === 'mote' ? 0.6 * Math.abs(Math.sin(p.life * 3)) : a;
      switch (p.kind) {
        case 'px': c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); break;
        case 'spark': drawSparkle(c, p.x, p.y, p.col, a); break;
        case 'heart': drawHeart(c, p.x - 3, p.y - 3, p.col); break;
        case 'conf': c.fillStyle = p.col; if (Math.floor(p.life * 10) % 2) c.fillRect(Math.round(p.x), Math.round(p.y), 2, 1); else c.fillRect(Math.round(p.x), Math.round(p.y), 1, 2); break;
        case 'drop': c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 4); break;
        case 'mote': c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); break;
        case 'petal': c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), 2, 1); c.fillRect(Math.round(p.x) + 1, Math.round(p.y) + 1, 1, 1); break;
        case 'fly': c.globalAlpha = Math.abs(Math.sin(this.t / 300 + p.s + p.x)); c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); c.globalAlpha *= 0.3; c.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 4, 4); break;
      }
    }
    c.globalAlpha = 1;
  }

  renderLighting(c: CanvasRenderingContext2D, def: RoomDef, env: Env) {
    let [r, g, b, a] = env.tint;
    if (!def.outdoor) a *= 0.55;
    if (def.id === 'club') a = 0.1;
    if (a > 0.01) { c.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${a})`; c.fillRect(0, 0, W, H); }
    const glow = def.id === 'club' ? 0.7 : Math.min(1, env.night * 0.9 + (env.minutes > 1050 && env.minutes < 1200 ? 0.25 : 0));
    if (glow > 0.03 && def.lights.length) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const l of def.lights) {
        const gr = c.createRadialGradient(l.x, l.y, 2, l.x, l.y, l.r);
        gr.addColorStop(0, l.c); gr.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalAlpha = glow * 0.38; c.fillStyle = gr; c.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
      }
      c.restore();
    }
  }
}
