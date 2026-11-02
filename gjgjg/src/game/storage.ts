export interface ScoreEntry { name: string; score: number; days: number; kens: number; ending: string; date: string }
const KEY = 'barbie_ken_scores_v1';

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
  } catch {
    return [];
  }
}
export function addScore(e: ScoreEntry): { rank: number; list: ScoreEntry[] } {
  const list = loadScores();
  list.push(e);
  list.sort((a, b) => b.score - a.score);
  const top = list.slice(0, 8);
  const rank = top.indexOf(e);
  try { localStorage.setItem(KEY, JSON.stringify(top)); } catch { /* ignore */ }
  return { rank, list: top };
}

/* ---------------------------------------------------------------- save slots */
export const SLOT_COUNT = 5;
export interface SaveData {
  v: number; name: string; day: number; minutes: number; weather: 'sunny' | 'rainy'; room: string;
  look: import('./items').Look; owned: string[]; gems: number; charm: number; kissUntil: number;
  heartbroken: number; scandals: number; loveSeen: boolean; suitor: number;
  kens: { u: boolean; m: number; r: boolean; l: boolean }[];
  flags: string[]; rep: number; rosanMood: number; rosanTrust: number; seenCuts: string[];
  glamBoost: boolean; fishCaught: number; storyLog: string[];
  savedAt: number; unlocked: number; ex?: import('./extras').ExState;
}
const SK = (i: number) => `barbie_ken_save_${i}`;
export function writeSlot(i: number, d: SaveData) { localStorage.setItem(SK(i), JSON.stringify(d)); }
export function readSlot(i: number): SaveData | null {
  try { const r = localStorage.getItem(SK(i)); return r ? (JSON.parse(r) as SaveData) : null; } catch { return null; }
}
export function deleteSlot(i: number) { try { localStorage.removeItem(SK(i)); } catch { /* ignore */ } }
export function listSlots(): (SaveData | null)[] { return Array.from({ length: SLOT_COUNT }, (_, i) => readSlot(i)); }
