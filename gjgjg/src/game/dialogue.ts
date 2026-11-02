import { KENS, TONE_ICON, TONE_LINES, rosanStage, ROSAN, ROSAN_STAGES, ROSAN_MOODS, type Tone, type CutId } from './kens';

export interface Fx {
  morale?: number;
  points?: number;
  gems?: number;
  lore?: boolean;
  jealous?: boolean;
  clearRaag?: boolean;
  cutscene?: CutId;
  rep?: number;
  flag?: string;
  trust?: number;
  minutes?: number;
  emote?: 'heart' | 'anger' | 'question';
  unlock?: boolean;
}
export interface Opt { label: string; next?: string | null; fx?: Fx; reply?: string; locked?: boolean }
export interface Node { text: string; opts: Opt[] }
export type Graph = Record<string, Node>;

export interface DlgCtx {
  morale: number;
  raag: boolean;
  rivalName: string | null;
  danced: boolean;
  loveSeen: boolean;
  mood?: number;
  seen?: string[];
  trust?: number;
  flags?: string[];
}

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const shuffle = <T,>(a: T[]) => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

function toneOpts(i: number, next: string | null): Opt[] {
  const k = KENS[i];
  const tones = shuffle(['flirty', 'witty', 'sweet', 'bold'] as Tone[]).slice(0, 3);
  return tones.map((t) => {
    const liked = t === k.likes;
    const hated = t === k.hates;
    return {
      label: `${TONE_ICON[t]} ${pick(TONE_LINES[t])}`,
      next,
      reply: liked ? `${k.name} lights up. "${k.good}"` : hated ? `${k.name} winces. "${k.bad}"` : `${k.name} grins. "Ha! Alright, I see you, Barbie."`,
      fx: liked ? { morale: 1, points: 1.5, emote: 'heart' } : hated ? { morale: -1, points: 0.4, emote: 'anger' } : { morale: 0.5, points: 1, emote: 'heart' },
    } as Opt;
  });
}

export function buildKenGraph(i: number, c: DlgCtx): Graph {
  if (i === ROSAN) return buildRosan(c);
  const k = KENS[i];
  const g: Graph = {};
  const rootOpts: Opt[] = [{ label: '💬 Chat about your day', next: 'q1' }];
  rootOpts.push(
    c.morale >= 3
      ? { label: '📖 "Tell me your story..."', reply: `${k.name} gets quiet. "${k.lore}"`, fx: { lore: true, morale: 0.5, gems: 10 + k.tier * 4 } }
      : { label: '📖 "Tell me your story..." (needs ♥3)', reply: `${k.name} laughs it off. "Maybe when I know you better, Barbie."`, fx: {} },
  );
  if (c.rivalName) rootOpts.push({ label: `😏 "${c.rivalName} says hi..." (jealousy!)`, reply: `${k.name}'s eye twitches. "Oh. ${c.rivalName}. Great. Cool. I'm FINE." He tries way harder now.`, fx: { jealous: true, morale: -1, points: 2, emote: 'anger' } });
  if (c.raag) rootOpts.push({ label: '💐 "I\'m sorry. Let me make it up to you."', reply: `${k.name} sighs and uncrosses his arms. "...Okay. I forgive you. Raag over."`, fx: { clearRaag: true, morale: 1, minutes: 10, emote: 'heart' } });
  rootOpts.push({ label: '👋 Goodbye', next: null });
  g.root = {
    text: c.raag ? `${k.name} turns away with a >_< face. "I'm not talking to you. Not after that goodnight kiss refusal."` : c.morale >= 8 ? `${k.name} beams. "Barbie! You're my favourite part of the day." ${k.greet}` : k.greet,
    opts: rootOpts,
  };
  g.q1 = { text: k.q, opts: toneOpts(i, 'q2') };
  g.q2 = { text: `${k.name} steps closer. "So... what do you think we are, Barbie?"`, opts: toneOpts(i, null) };
  return g;
}

function buildRosan(c: DlgCtx): Graph {
  const st = rosanStage(c.morale);
  const stage = ROSAN_STAGES[st];
  const mood = ROSAN_MOODS[c.mood ?? 0];
  const seen = new Set(c.seen || []);
  const flags = new Set(c.flags || []);
  const trust = c.trust ?? 0;
  const greets = [
    'Rosan looks up from a hologram, cool and composed. "Barbie. You made it past the Knight. Impressive."',
    'Rosan sets down his tablet. "You again. I find I keep... expecting you."',
    'Rosan smiles, actually smiles. "I saved you the best spot by the pool."',
    'Rosan\'s white suit glows warmer the moment you step out of the elevator. "There you are."',
    'Rosan pulls you into a hug before you can speak. "I was counting the minutes. Literally. 412."',
    'Rosan kisses your forehead. "Good evening, my forever. The skyline is ours tonight."',
  ];
  const moodLine: Record<string, string> = {
    playful: ' He winks. "Entertain me."',
    thoughtful: ' He is scribbling equations on the glass.',
    romantic: ' A single white rose waits on the table for you.',
    competitive: ' "Chess? Or are you scared?"',
    tired: ' Dark circles under his eyes. He clearly hasn\'t slept.',
    jealous: ' His jaw is tight. "I heard you were seen with other Kens."',
  };
  const o: Opt[] = [];
  o.push({ label: `${TONE_ICON[mood.likes]} ${TONE_LINES[mood.likes][0]} (matches his mood)`, reply: `Rosan\'s eyes light up. "${['Ha! You read me perfectly.', 'Exactly what I needed to hear.', 'You always know.'][st % 3]}"`, fx: { morale: 1, points: 1.5, trust: 1, emote: 'heart' } });
  const wrong = (['flirty', 'witty', 'sweet', 'bold'] as Tone[]).filter((t) => t !== mood.likes);
  const wt = wrong[Math.floor(Math.random() * wrong.length)];
  o.push({ label: `${TONE_ICON[wt]} ${TONE_LINES[wt][1]}`, reply: `Rosan raises an eyebrow. "${mood.id === 'jealous' ? 'Not now, Barbie.' : 'Hm. Wrong frequency today.'}"`, fx: { morale: mood.id === 'jealous' ? -1 : 0.25, points: 0.6, emote: 'question' } });
  if (mood.id === 'tired') o.push({ label: '☕ "Sit. I\'ll make you tea."', reply: 'Rosan sinks into the white sofa. "No one ever takes care of me. ...Thank you."', fx: { morale: 1, trust: 2, points: 1, emote: 'heart' } });
  if (mood.id === 'jealous') {
    o.push({ label: '🤍 "There\'s only you, Rosan."', reply: 'His shoulders relax. "...Say it again." You do. He smiles.', fx: { morale: 1, trust: 2, flag: 'loyal', emote: 'heart' } });
    o.push({ label: '😏 "Maybe I like options."', reply: 'Rosan turns to the skyline. "Then I\'ll stop calculating a future with you." (Ouch.)', fx: { morale: -2, trust: -2, flag: 'player', emote: 'anger' } });
  }
  if (mood.id === 'competitive') o.push({ label: '♟️ "Fine. Chess. Loser buys dinner."', reply: Math.random() < 0.35 ? 'Checkmate — YOU win! Rosan stares at the board for a full minute. "Marry me." "What?" "Nothing."' : 'Rosan wins in 14 moves, then quietly teaches you the trick. "Next time, you\'ll beat me."', fx: { morale: 1, points: 2, trust: 1, emote: 'heart' } });
  if (st >= 1) o.push({ label: '🧠 "Teach me something clever."', reply: 'Rosan: "Rule one of negotiation: the loudest person in the room is rarely the strongest. Rule two: look at the stars once a day."', fx: { morale: 0.5, points: 1.5, gems: 500, emote: 'heart' } });
  if (st >= 2 && !seen.has('stargaze')) o.push({ label: '🔭 "Show me your telescope."', reply: 'Rosan: "I was hoping you\'d ask. Come."', fx: { cutscene: 'stargaze', morale: 1, points: 3, emote: 'heart' } });
  if (st >= 2) o.push({ label: '💭 "Tell me something real."', reply: 'Rosan: "I memorised the city skyline so I\'d never feel lost. Then I found you, and I stopped needing the map."', fx: { lore: true, morale: 1, trust: 1, points: 2, emote: 'heart' } });
  if (st >= 3) o.push(c.danced ? { label: '💃 "Dance with me?" (already danced today)', reply: 'Rosan: "Tomorrow, darling. I like to leave the skyline wanting more."', fx: {} } : { label: '💃 "Dance with me under the stars."', reply: 'Rosan offers his hand. "I was hoping you\'d ask."', fx: { cutscene: 'dance', morale: 1, points: 3, emote: 'heart' } });
  if (st >= 3 && !seen.has('gala')) o.push({ label: '🥂 "Take me to the White Gala."', reply: 'Rosan straightens his white tie. "I\'ve been waiting for a reason to go."', fx: { cutscene: 'gala', morale: 1, rep: 2, points: 4, emote: 'heart' } });
  if (st >= 3 && c.raag === false && !seen.has('storm') && Math.random() < 0.5) o.push({ label: '⛈️ "Is that thunder?"', reply: 'The sky splits open...', fx: { cutscene: 'storm', morale: 1, trust: 1, points: 2, emote: 'heart' } });
  if (st >= 4 && trust >= 4 && !seen.has('secret')) o.push({ label: '🚪 "What\'s behind that locked door?"', reply: 'Rosan hesitates... then unlocks it. "Only for you."', fx: { cutscene: 'secret', morale: 1, trust: 2, points: 5, emote: 'heart' } });
  if (st >= 4 && trust < 4 && !seen.has('secret')) o.push({ label: '🔒 "What\'s behind that locked door?" (needs Trust 4)', reply: 'Rosan: "Not yet. Some doors open slowly."', fx: {} });
  if (st >= 4 && !seen.has('fireworks')) o.push({ label: '🎆 "Do something crazy for me."', reply: 'Rosan grins and taps his watch. "Look up."', fx: { cutscene: 'fireworks', morale: 1, points: 5, emote: 'heart' } });
  if (st >= 5 && !c.loveSeen) o.push(flags.has('player')
    ? { label: '💍 "Tell me what you really feel." (he doubts your loyalty)', reply: 'Rosan: "I want to... but I keep hearing about the other Kens. Prove me wrong first."', fx: { trust: -1 } }
    : { label: '💍 "Tell me what you really feel."', reply: 'Rosan\'s aura flickers pink. "Come with me. Look at the sky."', fx: { cutscene: 'love', points: 10, emote: 'heart' } });
  if (c.raag) o.push({ label: '💐 "I\'m sorry. Let me make it up to you."', reply: 'Rosan: "Apology accepted. Data shows I\'m weak to sincerity."', fx: { clearRaag: true, morale: 1, minutes: 10, emote: 'heart' } });
  o.push({ label: '👋 "Goodnight, Rosan."', next: null });
  return {
    root: {
      text: (c.raag ? 'Rosan lowers his glass of champagne. "Barbie. I computed every outcome. Refusing me was the only one I didn\'t plan for."' : greets[st] + (moodLine[mood.id] || '')) + `\n[${stage.icon} ${stage.name} · ${mood.icon} ${mood.name} · 🤝 Trust ${trust}]`,
      opts: o,
    },
  };
}
