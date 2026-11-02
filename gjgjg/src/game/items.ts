export type StatKey = 'glam' | 'elegance' | 'beach' | 'int';
export type Stats = Record<StatKey, number>;
export type Slot = 'hair' | 'outfit' | 'shoes' | 'neck' | 'ears' | 'head' | 'eyes' | 'hand' | 'makeup';
export type OutfitCat = 'party' | 'swim' | 'formal' | 'casual';

export interface Item {
  id: string;
  name: string;
  slot: Slot;
  cat?: OutfitCat;
  stats: Stats;
  colors: string[]; // [main, accent, extra]
  shape?: string;
  sparkle?: boolean;
  secret?: boolean;
  code?: boolean;
  price?: number;
  icon: string;
}

export interface Look {
  hair: string;
  hairColor: string;
  outfit: string;
  shoes: string;
  neck: string | null;
  ears: string | null;
  head: string | null;
  eyes: string | null;
  hand: string | null;
  makeup: string;
}

export const STAT_LABEL: Record<StatKey, string> = {
  glam: 'Glamour',
  elegance: 'Elegance',
  beach: 'BeachVibe',
  int: 'Intelligence',
};
export const STAT_ICON: Record<StatKey, string> = { glam: '✨', elegance: '👑', beach: '🌴', int: '🧠' };
export const STAT_COLOR: Record<StatKey, string> = { glam: '#ff5fb0', elegance: '#b57bff', beach: '#32c8d8', int: '#ffc443' };

const s = (glam: number, elegance: number, beach: number, int: number): Stats => ({ glam, elegance, beach, int });

export const HAIR_COLORS = [
  { id: 'espresso', name: 'Espresso', m: '#2a1a14', s: '#150b08', h: '#5a3a2c' },
  { id: 'chestnut', name: 'Chestnut', m: '#7a4a2a', s: '#4e2c16', h: '#a8703f' },
  { id: 'golden', name: 'Golden Blonde', m: '#f0c850', s: '#c99a28', h: '#fff0a0' },
  { id: 'platinum', name: 'Platinum', m: '#ece6da', s: '#bdb4a6', h: '#ffffff' },
  { id: 'rose', name: 'Rose Pink', m: '#ff7fb8', s: '#d94d8a', h: '#ffc0dc' },
  { id: 'ruby', name: 'Ruby Red', m: '#c8283c', s: '#8a1426', h: '#f2606e' },
  { id: 'midnight', name: 'Midnight Blue', m: '#2c3a8c', s: '#171f5c', h: '#5c70d0' },
  { id: 'lavender', name: 'Lavender', m: '#b49aee', s: '#8168c4', h: '#dccdff' },
];

const H = (id: string, name: string, st: Stats, icon = '💇‍♀️'): Item => ({ id, name, slot: 'hair', stats: st, colors: [], icon });

export const ITEMS: Item[] = [
  // ---- HAIRSTYLES ----
  H('longcurls', 'Long Curly Locks', s(6, 5, 3, 0)),
  H('afro', 'Voluminous Afro Curls', s(8, 4, 4, 0)),
  H('ponytail', 'High Ponytail', s(4, 3, 6, 2)),
  H('waves', 'Royal Princess Waves', s(6, 10, 2, 0)),
  H('pixie', 'Golden Pixie', s(7, 3, 3, 4)),
  H('braids', 'Beach Braids', s(3, 2, 10, 0)),
  H('bob', 'Sleek Bob', s(4, 7, 1, 5)),
  H('buns', 'Space Buns', s(6, 0, 4, 3)),
  H('topbun', 'Ballerina Bun', s(3, 9, 1, 5)),
  H('straight', 'Silky Straight', s(5, 8, 2, 2)),

  // ---- OUTFITS ----
  { id: 'casual', name: 'Denim & Knit Top', slot: 'outfit', cat: 'casual', shape: 'casual', stats: s(1, 1, 0, 1), colors: ['#3d4864', '#3b5679'], icon: '👖' },
  // Party Gala
  { id: 'sequin', name: 'Sequined Mini-Dress', slot: 'outfit', cat: 'party', shape: 'mini', sparkle: true, stats: s(14, 4, 0, 0), colors: ['#e83fb4', '#ffd0f0'], icon: '💃' },
  { id: 'velvet', name: 'Velvet Clubwear', slot: 'outfit', cat: 'party', shape: 'mini', stats: s(11, 8, 0, 1), colors: ['#4a1a6e', '#b57bff'], icon: '🖤' },
  { id: 'metal', name: 'Metallic Jumpsuit', slot: 'outfit', cat: 'party', shape: 'jumpsuit', sparkle: true, stats: s(15, 5, 0, 2), colors: ['#c4ccd8', '#ffffff'], icon: '🪩' },
  { id: 'disco', name: 'Disco Glitter Bodysuit', slot: 'outfit', cat: 'party', shape: 'bodysuit', sparkle: true, stats: s(16, 2, 3, 0), colors: ['#f2b630', '#fff1a0'], icon: '✨' },
  { id: 'neon', name: 'Neon Rave Set', slot: 'outfit', cat: 'party', shape: 'rash', stats: s(13, 0, 4, 0), colors: ['#25e0a8', '#ff3fa8'], icon: '🌈' },
  { id: 'satin', name: 'Satin Slip Dress', slot: 'outfit', cat: 'party', shape: 'slip', stats: s(9, 9, 0, 1), colors: ['#d0345a', '#ff8aa8'], icon: '🌹' },
  // Swimwear
  { id: 'bikini', name: 'Bikini Set', slot: 'outfit', cat: 'swim', shape: 'bikini', stats: s(6, 1, 15, 0), colors: ['#ff5f8a', '#ffd0dc'], icon: '👙' },
  { id: 'wrap', name: 'Luxury Beach Wrap', slot: 'outfit', cat: 'swim', shape: 'wrap', stats: s(5, 8, 14, 1), colors: ['#f4f0e6', '#2ec4c4'], icon: '🏖️' },
  { id: 'mono', name: 'High-Cut Monokini', slot: 'outfit', cat: 'swim', shape: 'mono', stats: s(8, 3, 14, 0), colors: ['#1c2c58', '#f2b630'], icon: '🏊‍♀️' },
  { id: 'stripe', name: 'Retro Striped One-Piece', slot: 'outfit', cat: 'swim', shape: 'stripe', stats: s(4, 3, 13, 1), colors: ['#f4f0e6', '#e03c4c'], icon: '🎀' },
  { id: 'sarong', name: 'Sunset Sarong Set', slot: 'outfit', cat: 'swim', shape: 'wrap', stats: s(5, 5, 13, 0), colors: ['#ff8a3c', '#ffd23c'], icon: '🌅' },
  { id: 'rashguard', name: 'Surf Rashguard Set', slot: 'outfit', cat: 'swim', shape: 'rash', stats: s(2, 0, 12, 2), colors: ['#1f9ed8', '#16486e'], icon: '🏄‍♀️' },
  // Formal & Royal
  { id: 'ballgown', name: 'Silk Ballgown', slot: 'outfit', cat: 'formal', shape: 'ball', stats: s(8, 16, 0, 2), colors: ['#f6a7d2', '#ffe0f0'], icon: '👗' },
  { id: 'pantsuit', name: 'Designer Pantsuit', slot: 'outfit', cat: 'formal', shape: 'pantsuit', stats: s(6, 12, 0, 10), colors: ['#26263a', '#f4f0e6'], icon: '💼' },
  { id: 'emerald', name: 'Emerald Evening Gown', slot: 'outfit', cat: 'formal', shape: 'gown', sparkle: true, stats: s(10, 15, 0, 1), colors: ['#0f9a62', '#7affc0'], icon: '💚' },
  { id: 'royalcape', name: 'Royal Velvet Gown', slot: 'outfit', cat: 'formal', shape: 'cape', stats: s(11, 14, 0, 3), colors: ['#6a1f9a', '#f2b630'], icon: '🏰' },
  { id: 'blazer', name: 'Tailored Blazer Dress', slot: 'outfit', cat: 'formal', shape: 'blazer', stats: s(5, 10, 0, 8), colors: ['#e8dcc8', '#8a6a3a'], icon: '🧥' },
  { id: 'ivory', name: 'Ivory Gala Gown', slot: 'outfit', cat: 'formal', shape: 'ball', stats: s(9, 15, 0, 2), colors: ['#f6f0e0', '#d8c690'], icon: '🕊️' },
  // Secret
  { id: 'starlight', name: 'Starlight Couture Gown', slot: 'outfit', cat: 'formal', shape: 'gown', sparkle: true, secret: true, stats: s(22, 18, 2, 4), colors: ['#1c1f6e', '#a8c0ff'], icon: '🌌' },
  { id: 'celestial', name: 'Celestial Diamond Empress Gown (1,000,000 💎)', slot: 'outfit', cat: 'formal', shape: 'ball', sparkle: true, secret: true, code: true, stats: s(60, 60, 20, 30), colors: ['#fdfcff', '#ffd6f4', '#bfeaff'], icon: '👸' },
  { id: 'celestialtiara', name: 'Celestial Star Crown', slot: 'head', sparkle: true, secret: true, code: true, stats: s(30, 30, 0, 10), colors: ['#ffffff', '#ff9ad8'], icon: '🌟' },
  { id: 'diamondsuit', name: 'Diamond Catsuit', slot: 'outfit', cat: 'party', shape: 'jumpsuit', sparkle: true, secret: true, stats: s(24, 8, 0, 6), colors: ['#dff6ff', '#ffffff'], icon: '💎' },

  // ---- SHOES ----
  { id: 'sneakers', name: 'Casual Sneakers', slot: 'shoes', shape: 'sneaker', stats: s(1, 0, 3, 2), colors: ['#fafafa', '#c8c8d0'], icon: '👟' },
  { id: 'stiletto', name: 'Stiletto Heels', slot: 'shoes', shape: 'heel', stats: s(6, 6, 0, 0), colors: ['#d4203c', '#8a1226'], icon: '👠' },
  { id: 'diamondheels', name: 'Diamond Heels', slot: 'shoes', shape: 'heel', sparkle: true, stats: s(10, 8, 0, 0), colors: ['#dff6ff', '#8ad0f0'], icon: '💎' },
  { id: 'platform', name: 'Platform Boots', slot: 'shoes', shape: 'boot', stats: s(8, 2, 0, 0), colors: ['#1c1a24', '#6a4a8a'], icon: '🥾' },
  { id: 'glass', name: 'Glass Slippers', slot: 'shoes', shape: 'slipper', sparkle: true, stats: s(9, 10, 0, 0), colors: ['#bfeaff', '#ffffff'], icon: '🔮' },
  { id: 'sandals', name: 'Strappy Sandals', slot: 'shoes', shape: 'sandal', stats: s(3, 3, 8, 0), colors: ['#e0a458', '#8a5a28'], icon: '🩴' },
  { id: 'flipflops', name: 'Flip-Flops', slot: 'shoes', shape: 'flip', stats: s(0, 0, 9, 0), colors: ['#2ec4c4', '#ff5f8a'], icon: '🏝️' },
  { id: 'wedges', name: 'Gold Wedges', slot: 'shoes', shape: 'wedge', stats: s(5, 4, 7, 0), colors: ['#e8b848', '#a8782a'], icon: '🥇' },
  { id: 'thighboots', name: 'Moonlit Thigh-High Boots', slot: 'shoes', shape: 'thigh', secret: true, stats: s(14, 6, 0, 0), colors: ['#2a2a5a', '#b0b8ff'], icon: '🌙' },

  // ---- JEWELLERY & ACCESSORIES ----
  { id: 'diamondneck', name: 'Diamond Necklace', slot: 'neck', stats: s(10, 8, 0, 0), colors: ['#e8fbff', '#8ad0f0'], icon: '💎' },
  { id: 'pearl', name: 'Pearl Choker', slot: 'neck', stats: s(4, 9, 0, 0), colors: ['#fff8ee', '#d8d0c0'], icon: '🦪' },
  { id: 'chain', name: 'Gold Chain', slot: 'neck', stats: s(7, 2, 2, 0), colors: ['#f2b630', '#c88a10'], icon: '⛓️' },
  { id: 'pendant', name: 'Ruby Pendant', slot: 'neck', stats: s(8, 5, 0, 0), colors: ['#e0243c', '#f2b630'], icon: '❤️' },
  { id: 'hoops', name: 'Gold Hoop Earrings', slot: 'ears', stats: s(6, 3, 2, 0), colors: ['#f2b630', '#c88a10'], icon: '⭕' },
  { id: 'studs', name: 'Diamond Studs', slot: 'ears', stats: s(6, 6, 0, 0), colors: ['#ffffff', '#8ad0f0'], icon: '✧' },
  { id: 'pearldrops', name: 'Pearl Drops', slot: 'ears', stats: s(3, 8, 0, 0), colors: ['#fff8ee', '#d8d0c0'], icon: '🫧' },
  { id: 'chandelier', name: 'Sapphire Chandeliers', slot: 'ears', secret: true, stats: s(12, 10, 0, 0), colors: ['#3a6aff', '#c0d0ff'], icon: '🔷' },
  { id: 'crown', name: 'Royal Crown', slot: 'head', stats: s(12, 14, 0, 0), colors: ['#f2b630', '#e0243c'], icon: '👑' },
  { id: 'tiara', name: 'Silver Tiara', slot: 'head', stats: s(8, 10, 0, 0), colors: ['#d8e4f0', '#8ad0f0'], icon: '🔱' },
  { id: 'flowers', name: 'Flower Crown', slot: 'head', stats: s(3, 4, 8, 0), colors: ['#ff8ab5', '#fff070'], icon: '🌸' },
  { id: 'bow', name: 'Bow Headband', slot: 'head', stats: s(3, 3, 0, 2), colors: ['#ff5fa8', '#d03080'], icon: '🎀' },
  { id: 'halo', name: 'Starlight Halo', slot: 'head', secret: true, stats: s(15, 12, 0, 2), colors: ['#fff6a0', '#ffffff'], icon: '😇' },
  { id: 'sunglasses', name: 'Luxury Sunglasses', slot: 'eyes', stats: s(7, 2, 8, 0), colors: ['#15151f', '#f2b630'], icon: '🕶️' },
  { id: 'cateye', name: 'Cat-Eye Glasses', slot: 'eyes', stats: s(4, 5, 0, 10), colors: ['#8a1e3a', '#ffd0dc'], icon: '👓' },
  { id: 'heartshades', name: 'Heart Shades', slot: 'eyes', stats: s(8, 0, 5, 0), colors: ['#ff4f9a', '#ffc0dc'], icon: '😎' },
  { id: 'clutch', name: 'Designer Clutch', slot: 'hand', stats: s(8, 8, 0, 0), colors: ['#f2b630', '#fff0a0'], icon: '👛' },
  { id: 'tote', name: 'Beach Tote', slot: 'hand', stats: s(1, 0, 9, 0), colors: ['#f4e6c0', '#e8643c'], icon: '👜' },
  { id: 'fan', name: 'Feather Fan', slot: 'hand', stats: s(6, 4, 0, 0), colors: ['#ff9ac8', '#ffe0f0'], icon: '🪭' },
  { id: 'planner', name: 'Leather Planner', slot: 'hand', stats: s(1, 3, 0, 10), colors: ['#7a4a2a', '#f2b630'], icon: '📒' },

  // ---- MAKEUP ----
  { id: 'bare', name: 'Natural Bare Face', slot: 'makeup', stats: s(0, 0, 0, 0), colors: ['#e07a86', '#00000000', '#00000000'], icon: '🌿' },
  { id: 'smokey', name: 'Glam Smokey Eye', slot: 'makeup', stats: s(12, 4, 0, 0), colors: ['#d8707c', '#3a3040', '#e8909a'], icon: '🌫️' },
  { id: 'peach', name: 'Soft Peach Glow', slot: 'makeup', stats: s(5, 7, 4, 0), colors: ['#f0907a', '#f6b89a', '#ffa890'], icon: '🍑' },
  { id: 'crimson', name: 'Bold Crimson Lip', slot: 'makeup', stats: s(9, 5, 0, 0), colors: ['#c4102c', '#00000000', '#ee8a96'], icon: '💋' },
  { id: 'goth', name: 'Gothic Dark Lip', slot: 'makeup', stats: s(10, 0, 0, 2), colors: ['#3a1230', '#4a3858', '#9a6a8a'], icon: '🖤' },
  { id: 'pinkpop', name: 'Rosy Pink Pop', slot: 'makeup', stats: s(6, 0, 5, 0), colors: ['#ff6aa8', '#ffa0cc', '#ff8ab8'], icon: '🍬' },
  { id: 'goldlid', name: 'Shimmer Gold Lid', slot: 'makeup', stats: s(10, 3, 4, 0), colors: ['#e08a70', '#f2c040', '#f0a080'], icon: '🌟' },
  { id: 'glitter', name: 'Galaxy Glitter Cut-Crease', slot: 'makeup', secret: true, stats: s(18, 5, 0, 0), colors: ['#c43a9a', '#6a3aff', '#ffa0e0'], icon: '🪐' },
];

export const ITEM_BY_ID: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const itemsOf = (slot: Slot) => ITEMS.filter((i) => i.slot === slot);

export const DEFAULT_LOOK: Look = {
  hair: 'longcurls',
  hairColor: 'espresso',
  outfit: 'casual',
  shoes: 'sneakers',
  neck: null,
  ears: null,
  head: null,
  eyes: null,
  hand: null,
  makeup: 'bare',
};

export function lookStats(look: Look): Stats & { total: number } {
  const out: Stats = { glam: 0, elegance: 0, beach: 0, int: 0 };
  const slots: (keyof Look)[] = ['hair', 'outfit', 'shoes', 'neck', 'ears', 'head', 'eyes', 'hand', 'makeup'];
  for (const sl of slots) {
    const id = look[sl];
    if (!id) continue;
    const it = ITEM_BY_ID[id];
    if (!it) continue;
    (Object.keys(out) as StatKey[]).forEach((k) => (out[k] += it.stats[k]));
  }
  (Object.keys(out) as StatKey[]).forEach((k) => (out[k] = Math.min(100, out[k])));
  return { ...out, total: out.glam + out.elegance + out.beach + out.int };
}

export interface Masterpiece {
  id: string;
  name: string;
  hint: string;
  secret?: boolean;
  test: (l: Look) => boolean;
}
const cat = (l: Look) => ITEM_BY_ID[l.outfit]?.cat;
export const MASTERPIECES: Masterpiece[] = [
  { id: 'diamond', name: 'Diamond Party Queen', hint: 'Party outfit + Diamond Heels + Diamond Necklace', test: (l) => cat(l) === 'party' && l.shoes === 'diamondheels' && l.neck === 'diamondneck' },
  { id: 'royal', name: 'Royal Court Sovereign', hint: 'Formal gown + Royal Crown + Glass Slippers / Stilettos / Diamond Heels', test: (l) => cat(l) === 'formal' && l.head === 'crown' && ['glass', 'stiletto', 'diamondheels'].includes(l.shoes) },
  { id: 'beach', name: 'Beach Goddess', hint: 'Swimwear + Sunglasses/Heart Shades + Sandals, Flip-Flops or Wedges', test: (l) => cat(l) === 'swim' && (l.eyes === 'sunglasses' || l.eyes === 'heartshades') && ['sandals', 'flipflops', 'wedges'].includes(l.shoes) },
  { id: 'boss', name: 'Boardroom Boss', hint: 'Designer Pantsuit + Cat-Eye Glasses + Designer Clutch + Heels', test: (l) => l.outfit === 'pantsuit' && l.eyes === 'cateye' && l.hand === 'clutch' && ['stiletto', 'diamondheels'].includes(l.shoes) },
  { id: 'goth', name: 'Gothic Glam Icon', hint: 'Velvet Clubwear + Gothic Dark Lip + Platform Boots', test: (l) => l.outfit === 'velvet' && l.makeup === 'goth' && l.shoes === 'platform' },
  { id: 'fairy', name: 'Fairytale Princess', hint: 'Ballgown or Ivory Gown + Glass Slippers + Crown or Tiara', test: (l) => (l.outfit === 'ballgown' || l.outfit === 'ivory') && l.shoes === 'glass' && (l.head === 'crown' || l.head === 'tiara') },
  { id: 'emerald', name: 'Emerald Empress', hint: 'Emerald Gown + Gold Hoops/Diamond Studs + Designer Clutch', test: (l) => l.outfit === 'emerald' && (l.ears === 'hoops' || l.ears === 'studs') && l.hand === 'clutch' },
  { id: 'pop', name: 'Neon Pop Star', hint: 'Neon Rave Set or Disco Bodysuit + Space Buns + Sneakers/Platforms', test: (l) => (l.outfit === 'neon' || l.outfit === 'disco') && l.hair === 'buns' && (l.shoes === 'sneakers' || l.shoes === 'platform') },
  { id: 'starlit', name: 'Starlit Legend', hint: '??? (Secret rooftop treasures)', secret: true, test: (l) => l.outfit === 'starlight' && l.head === 'halo' },
];

export function activeMasterpiece(look: Look): Masterpiece | null {
  return MASTERPIECES.find((m) => m.test(look)) || null;
}

export function comboCount(): number {
  const n = (sl: Slot) => itemsOf(sl).filter((i) => !i.secret).length;
  return (n('hair') * HAIR_COLORS.length) * n('outfit') * n('shoes') * (n('neck') + 1) * (n('ears') + 1) * (n('head') + 1) * (n('eyes') + 1) * (n('hand') + 1) * n('makeup');
}
