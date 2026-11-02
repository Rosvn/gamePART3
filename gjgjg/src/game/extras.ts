import type { RoomId } from './kens';

/* =====================================================================
 *  EXTRA CONTENT DATA — fishing, quests, trophies, pets
 * ===================================================================== */

export type SpotId = 'pier' | 'beach' | 'pond';
export type Rarity = 'junk' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export const RARITY_ORDER: Rarity[] = ['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary'];
export const RARITY_COL: Record<Rarity, string> = { junk: '#8a8a8a', common: '#4a8a4a', uncommon: '#2a8ad8', rare: '#a050e0', epic: '#e07a20', legendary: '#e0b020' };
export const RARITY_XP: Record<Rarity, number> = { junk: 0, common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 15 };
export const rarityIdx = (r: Rarity) => RARITY_ORDER.indexOf(r);

export type TimeBucket = 'day' | 'dusk' | 'night';
export interface FishDef {
  id: string; name: string; icon: string; rarity: Rarity; value: number; diff: number; w: number;
  spots: SpotId[] | 'any'; time?: TimeBucket; weather?: 'rainy' | 'sunny'; min: number; max: number; desc: string; treasure?: boolean;
}

export const SPOT_INFO: Record<SpotId, { name: string; icon: string; room: RoomId; stand: [number, number]; bob: [number, number]; flavour: string }> = {
  pier: { name: 'Sunset Pier', icon: '🌅', room: 'pier', stand: [88, 124], bob: [88, 70], flavour: 'Deep sea fish live here.' },
  beach: { name: 'Beach Shallows', icon: '🏖️', room: 'beach', stand: [88, 92], bob: [88, 62], flavour: 'Shoreline critters and treasures.' },
  pond: { name: 'Park Pond', icon: '🦆', room: 'park', stand: [120, 126], bob: [120, 96], flavour: 'Calm freshwater fishing.' },
};

export const FISH: FishDef[] = [
  // ---------- pier (sea)
  { id: 'sardine', name: 'Sardine', icon: '🐟', rarity: 'common', value: 30, diff: 2, w: 26, spots: ['pier'], min: 12, max: 22, desc: 'Silvery, shy and always in a hurry.' },
  { id: 'mackerel', name: 'Mackerel', icon: '🐟', rarity: 'common', value: 45, diff: 3, w: 22, spots: ['pier'], min: 25, max: 45, desc: 'Striped speedster of the harbour.' },
  { id: 'puffer', name: 'Pufferfish', icon: '🐡', rarity: 'uncommon', value: 95, diff: 4, w: 12, spots: ['pier'], min: 15, max: 35, desc: 'Puffs up when it is offended.' },
  { id: 'squid', name: 'Pink Squid', icon: '🦑', rarity: 'uncommon', value: 120, diff: 5, w: 10, spots: ['pier'], time: 'dusk', min: 30, max: 60, desc: 'Only comes out when the sky turns pink.' },
  { id: 'octopus', name: 'Giant Octopus', icon: '🐙', rarity: 'rare', value: 240, diff: 6, w: 6, spots: ['pier'], min: 60, max: 120, desc: 'Eight arms, all of them strong.' },
  { id: 'lobster', name: 'Blue Lobster', icon: '🦞', rarity: 'rare', value: 280, diff: 6, w: 6, spots: ['pier'], time: 'dusk', min: 25, max: 50, desc: 'One in two million. Very fancy.' },
  { id: 'shark', name: 'Midnight Shark', icon: '🦈', rarity: 'epic', value: 650, diff: 8, w: 2.2, spots: ['pier'], time: 'night', min: 120, max: 260, desc: 'Hunts under the moon. Hold on tight!' },
  { id: 'whale', name: 'Moon Whale', icon: '🐋', rarity: 'legendary', value: 1800, diff: 10, w: 0.7, spots: ['pier'], time: 'night', min: 600, max: 1400, desc: 'A legend of Dreamtown harbour. It sings.' },
  // ---------- beach
  { id: 'crab', name: 'Beach Crab', icon: '🦀', rarity: 'common', value: 35, diff: 2, w: 26, spots: ['beach'], min: 8, max: 18, desc: 'Sideways and sassy.' },
  { id: 'shrimp', name: 'Sunny Shrimp', icon: '🦐', rarity: 'common', value: 40, diff: 3, w: 22, spots: ['beach'], min: 6, max: 14, desc: 'Tiny, pink and delicious.' },
  { id: 'clown', name: 'Tropical Fish', icon: '🐠', rarity: 'uncommon', value: 85, diff: 4, w: 14, spots: ['beach', 'pier'], time: 'day', min: 8, max: 18, desc: 'Dressed to impress, like you.' },
  { id: 'turtle', name: 'Sea Turtle', icon: '🐢', rarity: 'rare', value: 300, diff: 5, w: 6, spots: ['beach'], min: 50, max: 110, desc: 'Slow but wise. Do not rush it.' },
  { id: 'oyster', name: 'Pearl Oyster', icon: '🦪', rarity: 'epic', value: 700, diff: 6, w: 2.2, spots: ['beach'], min: 10, max: 20, desc: 'Holds a perfect rose pearl.' },
  { id: 'dolphin', name: 'Sunset Dolphin', icon: '🐬', rarity: 'legendary', value: 1600, diff: 9, w: 0.8, spots: ['beach'], time: 'dusk', min: 150, max: 260, desc: 'Leaps through golden waves at dusk.' },
  // ---------- pond
  { id: 'goldfish', name: 'Goldfish', icon: '🐠', rarity: 'common', value: 28, diff: 2, w: 26, spots: ['pond'], min: 6, max: 16, desc: 'Escaped from a fair, probably.' },
  { id: 'carp', name: 'Fat Carp', icon: '🐟', rarity: 'common', value: 42, diff: 3, w: 22, spots: ['pond'], min: 30, max: 70, desc: 'Very relaxed. Very round.' },
  { id: 'frog', name: 'Prince Frog', icon: '🐸', rarity: 'uncommon', value: 90, diff: 4, w: 12, spots: ['pond'], weather: 'rainy', min: 5, max: 12, desc: 'Needs a kiss? Maybe not today.' },
  { id: 'duck', name: 'Rubber Ducky', icon: '🦆', rarity: 'uncommon', value: 70, diff: 3, w: 8, spots: ['pond'], min: 8, max: 12, desc: 'Squeak! A very lucky find.' },
  { id: 'koi', name: 'Rainbow Koi', icon: '🎏', rarity: 'rare', value: 290, diff: 6, w: 6, spots: ['pond'], time: 'day', min: 40, max: 90, desc: 'Scales that shimmer like a prism.' },
  { id: 'dragonkoi', name: 'Pink Dragon Koi', icon: '🐉', rarity: 'legendary', value: 1700, diff: 9, w: 1.2, spots: ['pond'], weather: 'rainy', min: 90, max: 200, desc: 'Only rises from the pond in the rain.' },
  // ---------- anywhere
  { id: 'boot', name: 'Old Boot', icon: '👢', rarity: 'junk', value: 4, diff: 1, w: 7, spots: 'any', min: 20, max: 35, desc: 'Somebody lost a boot. Fashion crime.' },
  { id: 'seaweed', name: 'Soggy Seaweed', icon: '🌿', rarity: 'junk', value: 8, diff: 1, w: 6, spots: 'any', min: 10, max: 60, desc: 'Great for a face mask, apparently.' },
  { id: 'ring', name: 'Sunken Ring', icon: '💍', rarity: 'rare', value: 500, diff: 4, w: 2, spots: 'any', min: 1, max: 3, treasure: true, desc: 'A diamond ring. Someone is going to be sad.' },
  { id: 'chest', name: 'Treasure Chest', icon: '🧰', rarity: 'epic', value: 800, diff: 5, w: 0.9, spots: 'any', min: 30, max: 40, treasure: true, desc: 'Might contain rare couture!' },
];
export const FISH_BY_ID: Record<string, FishDef> = Object.fromEntries(FISH.map((f) => [f.id, f]));
export const REAL_FISH = FISH.filter((f) => f.rarity !== 'junk' && !f.treasure);

export interface RodDef { id: string; name: string; icon: string; price: number; bar: number; luck: number; bite: number; desc: string }
export const RODS: RodDef[] = [
  { id: 'bamboo', name: 'Bamboo Rod', icon: '🎋', price: 0, bar: 30, luck: 0, bite: 0, desc: 'Simple and reliable.' },
  { id: 'fiber', name: 'Fiberglass Rod', icon: '🎣', price: 500, bar: 38, luck: 0.1, bite: 0.15, desc: 'Wider reel bar · faster bites.' },
  { id: 'pink', name: 'Pink Carbon Rod', icon: '🌸', price: 2000, bar: 46, luck: 0.25, bite: 0.25, desc: 'Lightweight and gorgeous.' },
  { id: 'gold', name: 'Golden Rod', icon: '✨', price: 6000, bar: 54, luck: 0.45, bite: 0.35, desc: 'Attracts rare fish like magic.' },
  { id: 'diamond', name: 'Diamond Dream Rod', icon: '💎', price: 15000, bar: 62, luck: 0.8, bite: 0.5, desc: 'The ultimate fishing rod.' },
];

export interface BaitDef { id: string; name: string; icon: string; pack: number; price: number; luck: number; bite: number; desc: string }
export const BAITS: BaitDef[] = [
  { id: 'none', name: 'Plain Hook', icon: '🪝', pack: 0, price: 0, luck: -0.3, bite: -0.4, desc: 'Slow bites, fewer rare fish.' },
  { id: 'worm', name: 'Worms', icon: '🐛', pack: 5, price: 15, luck: 0, bite: 0, desc: 'The classic.' },
  { id: 'shrimp', name: 'Shrimp Bait', icon: '🍤', pack: 5, price: 50, luck: 0.15, bite: 0.35, desc: 'Fish rush to bite.' },
  { id: 'glitter', name: 'Glitter Lure', icon: '✨', pack: 5, price: 120, luck: 0.8, bite: 0.1, desc: 'Rare fish love sparkle.' },
  { id: 'golden', name: 'Golden Bait', icon: '🌟', pack: 3, price: 300, luck: 2.0, bite: 0.25, desc: 'Epic & legendary magnet.' },
];
export const BAIT_BY_ID: Record<string, BaitDef> = Object.fromEntries(BAITS.map((b) => [b.id, b]));

/* ---------------------------------------------------------------- quests */
export interface QuestDef { id: string; text: string; icon: string; key: string; goal: number; gems: number; charm: number }
export const QUESTS: QuestDef[] = [
  { id: 'fish3', text: 'Catch 3 fish', icon: '🎣', key: 'fish', goal: 3, gems: 160, charm: 300 },
  { id: 'fish6', text: 'Catch 6 fish', icon: '🐟', key: 'fish', goal: 6, gems: 320, charm: 600 },
  { id: 'rare1', text: 'Catch a rare (or better) fish', icon: '💜', key: 'rare', goal: 1, gems: 350, charm: 600 },
  { id: 'perfect1', text: 'Land a PERFECT catch', icon: '🎯', key: 'perfect', goal: 1, gems: 260, charm: 400 },
  { id: 'sell3', text: 'Sell 3 fish at the Seafood Shack', icon: '💰', key: 'sell', goal: 3, gems: 150, charm: 250 },
  { id: 'chat4', text: 'Chat with 4 Kens', icon: '💬', key: 'chat', goal: 4, gems: 220, charm: 500 },
  { id: 'chat7', text: 'Chat with 7 Kens', icon: '💞', key: 'chat', goal: 7, gems: 420, charm: 900 },
  { id: 'dance1', text: 'Score B or better in a Dance Battle', icon: '💃', key: 'dancewin', goal: 1, gems: 280, charm: 500 },
  { id: 'stars2', text: 'Find 2 Lucky Stars', icon: '⭐', key: 'star', goal: 2, gems: 200, charm: 350 },
  { id: 'stars4', text: 'Find all 4 Lucky Stars', icon: '🌟', key: 'star', goal: 4, gems: 400, charm: 700 },
  { id: 'visit6', text: 'Visit 6 different places', icon: '🗺️', key: 'visit', goal: 6, gems: 200, charm: 350 },
  { id: 'gift1', text: 'Give a gift to a Ken', icon: '🎁', key: 'gift', goal: 1, gems: 170, charm: 300 },
  { id: 'wish1', text: 'Make a wish at the fountain', icon: '⛲', key: 'wish', goal: 1, gems: 120, charm: 200 },
  { id: 'perform1', text: 'Perform at the bandstand', icon: '🎤', key: 'perform', goal: 1, gems: 150, charm: 300 },
  { id: 'runway1', text: 'Strut the runway', icon: '👠', key: 'runway', goal: 1, gems: 150, charm: 300 },
  { id: 'study1', text: 'Study at the library', icon: '📚', key: 'study', goal: 1, gems: 130, charm: 250 },
];
export const QUEST_BY_ID: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

/* ---------------------------------------------------------------- pets */
export interface PetDef { id: string; name: string; species: string; icon: string; price: number; perk: string; desc: string; body: string; accent: string; ear: 'point' | 'long' | 'round' }
export const PETS: PetDef[] = [
  { id: 'kitten', name: 'Mochi', species: 'Kitten', icon: '🐱', price: 800, perk: 'Star Sniffer', desc: 'Senses Lucky Stars in the rooms you walk into. Bond 3+: stars give +50% 💎.', body: '#f2a65a', accent: '#fff0d8', ear: 'point' },
  { id: 'puppy', name: 'Biscuit', species: 'Puppy', icon: '🐶', price: 800, perk: 'Fishing Buddy', desc: 'Fish bite sooner and your reel bar grows with every bond level.', body: '#c89060', accent: '#fff0e0', ear: 'round' },
  { id: 'bunny', name: 'Clover', species: 'Bunny', icon: '🐰', price: 1500, perk: 'Charm Booster', desc: '+4% Style Points per bond level (and +4% to start).', body: '#f4f0f8', accent: '#ffb0d0', ear: 'long' },
  { id: 'fox', name: 'Ember', species: 'Fox', icon: '🦊', price: 3000, perk: 'Lucky Charm', desc: 'Rarer fish, and +5% sell price per bond level.', body: '#f07a30', accent: '#ffffff', ear: 'point' },
];
export const PET_BY_ID: Record<string, PetDef> = Object.fromEntries(PETS.map((p) => [p.id, p]));
export const BOND_XP = [0, 3, 8, 16, 30, 50];
export const bondLevel = (xp: number) => { let l = 0; for (let i = 0; i < BOND_XP.length; i++) if (xp >= BOND_XP[i]) l = i; return l; };

/* ---------------------------------------------------------------- state */
export interface BagFish { id: string; size: number; v: number; perfect: boolean }
export interface QuestState { id: string; prog: number; done: boolean }
export interface StarSpot { room: RoomId; x: number; y: number }
export interface ExState {
  rod: number; rods: string[]; baits: Record<string, number>; bait: string;
  bag: BagFish[]; journal: Record<string, { n: number; best: number }>;
  pets: Record<string, number>; pet: string | null;
  stats: Record<string, number>; trophies: string[];
  quests: QuestState[]; streak: number; allDoneDay: number;
  stars: StarSpot[]; visited: string[]; gift: BagFish | null; fotd: string; questDay: number;
}
export const newEx = (): ExState => ({
  rod: 0, rods: ['bamboo'], baits: { worm: 5 }, bait: 'worm', bag: [], journal: {}, pets: {}, pet: null,
  stats: {}, trophies: [], quests: [], streak: 0, allDoneDay: 0, stars: [], visited: [], gift: null, fotd: 'sardine', questDay: 0,
});

/* ---------------------------------------------------------------- trophies */
export interface TrophyDef { id: string; name: string; icon: string; desc: string; gems: number; test: (s: Record<string, number>, ex: ExState) => boolean }
export const TROPHIES: TrophyDef[] = [
  { id: 'first', name: 'First Catch', icon: '🎣', desc: 'Catch your first fish.', gems: 100, test: (s) => (s.fish || 0) >= 1 },
  { id: 'angler', name: 'Angler', icon: '🐟', desc: 'Catch 10 fish.', gems: 300, test: (s) => (s.fish || 0) >= 10 },
  { id: 'master', name: 'Master Angler', icon: '🏅', desc: 'Catch 50 fish.', gems: 1500, test: (s) => (s.fish || 0) >= 50 },
  { id: 'rare', name: 'Rare Find', icon: '💜', desc: 'Catch a rare fish.', gems: 300, test: (s) => (s.rare || 0) >= 1 },
  { id: 'legend', name: 'Legend of the Deep', icon: '👑', desc: 'Catch a legendary fish.', gems: 2000, test: (s) => (s.legend || 0) >= 1 },
  { id: 'steady', name: 'Steady Hands', icon: '🎯', desc: 'Land 5 perfect catches.', gems: 500, test: (s) => (s.perfect || 0) >= 5 },
  { id: 'half', name: 'Fish Collector', icon: '📒', desc: 'Discover 10 different fish.', gems: 600, test: (_s, ex) => REAL_FISH.filter((f) => ex.journal[f.id]).length >= 10 },
  { id: 'all', name: 'Fish Encyclopedia', icon: '📚', desc: 'Discover every fish species.', gems: 6000, test: (_s, ex) => REAL_FISH.every((f) => ex.journal[f.id]) },
  { id: 'tycoon', name: 'Fish Tycoon', icon: '💰', desc: 'Earn 5,000 💎 selling fish.', gems: 1000, test: (s) => (s.fishEarn || 0) >= 5000 },
  { id: 'gear', name: 'Gear Up', icon: '🛠️', desc: 'Buy a better fishing rod.', gems: 200, test: (_s, ex) => ex.rods.length >= 2 },
  { id: 'rodroyal', name: 'Rod Royalty', icon: '💎', desc: 'Own the Diamond Dream Rod.', gems: 2500, test: (_s, ex) => ex.rods.includes('diamond') },
  { id: 'dancer', name: 'Dance Floor Debut', icon: '🕺', desc: 'Finish a Dance Battle.', gems: 150, test: (s) => (s.dances || 0) >= 1 },
  { id: 'queen', name: 'Dance Queen', icon: '💃', desc: 'Get an S rank.', gems: 1200, test: (s) => (s.sRank || 0) >= 1 },
  { id: 'combo', name: 'Combo King', icon: '🔥', desc: 'Reach a 30 note combo.', gems: 600, test: (s) => (s.bestCombo || 0) >= 30 },
  { id: 'star10', name: 'Star Catcher', icon: '⭐', desc: 'Find 10 Lucky Stars.', gems: 500, test: (s) => (s.star || 0) >= 10 },
  { id: 'star40', name: 'Constellation', icon: '🌌', desc: 'Find 40 Lucky Stars.', gems: 2500, test: (s) => (s.star || 0) >= 40 },
  { id: 'pet', name: 'Best Friend', icon: '🐾', desc: 'Adopt a pet.', gems: 300, test: (_s, ex) => Object.keys(ex.pets).length >= 1 },
  { id: 'bond', name: 'Inseparable', icon: '💕', desc: 'Reach bond level 5 with a pet.', gems: 1500, test: (_s, ex) => Object.values(ex.pets).some((x) => bondLevel(x) >= 5) },
  { id: 'busy', name: 'Busy Bee', icon: '📋', desc: 'Complete 10 daily quests.', gems: 700, test: (s) => (s.quests || 0) >= 10 },
  { id: 'roll', name: 'On a Roll', icon: '🔥', desc: 'Clear all daily quests 3 days in a row.', gems: 1200, test: (_s, ex) => ex.streak >= 3 },
  { id: 'gifts', name: 'Thoughtful', icon: '🎁', desc: 'Give 5 gifts to Kens.', gems: 400, test: (s) => (s.gift || 0) >= 5 },
  { id: 'explorer', name: 'Explorer', icon: '🧭', desc: 'Visit 6 places in one day.', gems: 250, test: (s) => (s.visit6 || 0) >= 1 },
];
