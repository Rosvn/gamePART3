import { useState } from 'react';
import type { Game } from '../game/engine';
import { audio } from '../game/audio';
import {
  FISH, FISH_BY_ID, REAL_FISH, QUEST_BY_ID, TROPHIES, RODS, BAITS, PETS, PET_BY_ID, RARITY_COL, SPOT_INFO, BOND_XP, bondLevel,
  type FishDef, type BagFish,
} from '../game/extras';
import { BAG_MAX, activePetId, fishValue } from '../game/features';
import { MAX_DAYS } from '../game/engine';
import { ROOMS } from '../game/world';

const tabs = ['📋 QUESTS', '🐟 FISH', '🏆 TROPHIES', '🎒 GEAR'];
const down = (fn: () => void) => (e: React.PointerEvent) => { e.preventDefault(); e.stopPropagation(); audio.init(); fn(); };
const sub: React.CSSProperties = { fontSize: 'max(11px,3.2cqw)', opacity: 0.75, lineHeight: 1 };
const H = ({ children }: { children: React.ReactNode }) => <div className="px" style={{ fontSize: 'max(7px,2.1cqw)', color: '#ffd0f0', margin: '2cqw 0 1cqw' }}>{children}</div>;
const Bar = ({ v, col = '#e0407a' }: { v: number; col?: string }) => (
  <div style={{ height: '1.6cqw', background: '#e8d4dc', borderRadius: '1cqw', border: '0.3cqw solid #c47a9a', overflow: 'hidden' }}>
    <div style={{ width: `${Math.max(0, Math.min(1, v)) * 100}%`, height: '100%', background: col }} />
  </div>
);

function QuestsTab({ game }: { game: Game }) {
  const ex = game.ex; const fo = FISH_BY_ID[ex.fotd];
  const act = activePetId(game);
  const starRooms = [...new Set(ex.stars.map((s) => ROOMS[s.room].name))];
  return (
    <div>
      <div className="pcard" style={{ padding: '2cqw', background: 'linear-gradient(180deg,#fff2c8,#ffe08a)' }}>
        <div className="flex items-center" style={{ gap: '2cqw' }}>
          <div style={{ fontSize: '9cqw' }}>{fo.icon}</div>
          <div className="vt" style={{ fontSize: 'max(13px,3.9cqw)', lineHeight: 1.02 }}>
            <b>🌟 Fish of the Day: {fo.name}</b><br />
            Worth +50% and bites more often today! Found at {fo.spots === 'any' ? 'any water' : fo.spots.map((s) => SPOT_INFO[s].name).join(' / ')}.
          </div>
        </div>
      </div>
      <H>DAILY QUESTS · STREAK {ex.streak} 🔥</H>
      {ex.quests.map((q) => {
        const d = QUEST_BY_ID[q.id];
        return (
          <div key={q.id} className="pcard" style={{ padding: '1.6cqw 2cqw', marginBottom: '1.6cqw', opacity: q.done ? 0.75 : 1, background: q.done ? 'linear-gradient(180deg,#d8f4d8,#b8e8b8)' : undefined }}>
            <div className="flex items-center justify-between" style={{ gap: '2cqw' }}>
              <div className="vt" style={{ fontSize: 'max(14px,4.2cqw)', lineHeight: 1 }}>{d.icon} {d.text}</div>
              <div className="vt" style={{ fontSize: 'max(12px,3.6cqw)', whiteSpace: 'nowrap' }}>{q.done ? '✅ DONE' : `${q.prog}/${d.goal}`}</div>
            </div>
            <Bar v={q.prog / d.goal} col={q.done ? '#3ab858' : '#e0407a'} />
            <div style={sub}>Reward: {d.gems} 💎 · {d.charm} ✨</div>
          </div>
        );
      })}
      <div className="vt" style={{ ...sub, opacity: 0.9, fontSize: 'max(12px,3.4cqw)' }}>Clear all 3 for a streak bonus of up to +700 💎. New quests every morning!</div>
      <H>⭐ LUCKY STARS · {4 - ex.stars.length}/4 FOUND TODAY</H>
      <div className="pcard vt" style={{ padding: '2cqw', fontSize: 'max(13px,3.8cqw)', lineHeight: 1.02 }}>
        {ex.stars.length === 0 ? '🌟 You found every star today. Amazing!' : act === 'kitten'
          ? `🐱 ${PET_BY_ID.kitten.name} senses stars in: ${starRooms.join(', ')}.`
          : '✨ Glittering stars are hidden around Dreamtown each day. Explore every place! Tip: a Kitten from the Mall Pet Corner sniffs them out.'}
      </div>
    </div>
  );
}

function FishTab({ game }: { game: Game }) {
  const ex = game.ex;
  const [sel, setSel] = useState<string>(FISH[0].id);
  const f = FISH_BY_ID[sel];
  const seen = !!ex.journal[sel];
  const found = REAL_FISH.filter((x) => ex.journal[x.id]).length;
  const gift = ex.gift;
  const giveGift = (idx: number) => {
    const it = ex.bag.splice(idx, 1)[0];
    if (ex.gift) ex.bag.push(ex.gift);
    ex.gift = it; audio.play('chime'); game.emit();
  };
  const unGift = () => { if (ex.gift) { ex.bag.push(ex.gift); ex.gift = null; audio.play('select'); game.emit(); } };
  return (
    <div>
      <H>FISH JOURNAL · {found}/{REAL_FISH.length} SPECIES</H>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '1cqw' }}>
        {FISH.map((x: FishDef) => {
          const s = !!ex.journal[x.id];
          return (
            <button key={x.id} onPointerDown={down(() => setSel(x.id))} className="pcard" style={{ padding: '1cqw 0', cursor: 'pointer', outline: sel === x.id ? '0.8cqw solid #e0407a' : 'none', fontSize: '6cqw', lineHeight: 1, filter: s ? 'none' : 'grayscale(1) brightness(0.3)' }}>
              {x.icon}
            </button>
          );
        })}
      </div>
      <div className="pcard" style={{ padding: '2cqw', marginTop: '1.6cqw' }}>
        <div className="flex items-center" style={{ gap: '2cqw' }}>
          <div style={{ fontSize: '10cqw', filter: seen ? 'none' : 'grayscale(1) brightness(0.3)' }}>{f.icon}</div>
          <div className="vt" style={{ fontSize: 'max(13px,3.9cqw)', lineHeight: 1.02 }}>
            <b style={{ color: RARITY_COL[f.rarity] }}>{seen ? f.name : '???'}</b> <small style={{ color: RARITY_COL[f.rarity] }}>{f.rarity.toUpperCase()}</small><br />
            {seen ? f.desc : 'Not discovered yet.'}<br />
            <small>📍 {f.spots === 'any' ? 'Anywhere' : f.spots.map((s) => SPOT_INFO[s].name).join(', ')}
              {f.time ? ` · ${f.time === 'day' ? '☀️ daytime' : f.time === 'dusk' ? '🌇 dusk' : '🌙 night'}` : ''}{f.weather === 'rainy' ? ' · 🌧 rain only' : ''}</small><br />
            {seen && <small>Caught ×{ex.journal[sel].n} · 📏 best {ex.journal[sel].best} cm · 💎 ~{f.value}</small>}
          </div>
        </div>
      </div>
      <H>🎁 GIFT READY</H>
      <div className="pcard vt" style={{ padding: '1.6cqw 2cqw', fontSize: 'max(13px,3.8cqw)', lineHeight: 1.02 }}>
        {gift ? (
          <div className="flex items-center justify-between">
            <span>{FISH_BY_ID[gift.id].icon} {FISH_BY_ID[gift.id].name} — give it to the next Ken you talk to!</span>
            <button className="pbtn alt" style={{ padding: '1cqw 2cqw', fontSize: 'max(6px,1.8cqw)' }} onPointerDown={down(unGift)}>TAKE BACK</button>
          </div>
        ) : 'Pick a fish below and press 🎁 — Kens love gifts (+♥). Fisherman Ken loves them double!'}
      </div>
      <H>🎒 BAG {ex.bag.length}/{BAG_MAX}</H>
      {ex.bag.length === 0 && <div className="vt" style={{ ...sub, fontSize: 'max(13px,3.8cqw)' }}>Empty. Go fishing at the Pier, Beach or Park Pond!</div>}
      <div className="flex flex-col" style={{ gap: '1cqw' }}>
        {ex.bag.map((it: BagFish, i: number) => {
          const d = FISH_BY_ID[it.id];
          return (
            <div key={i} className="pcard flex items-center justify-between" style={{ padding: '0.8cqw 1.6cqw' }}>
              <span className="vt" style={{ fontSize: 'max(13px,3.8cqw)', lineHeight: 1 }}>{d.icon} <b style={{ color: RARITY_COL[d.rarity] }}>{d.name}</b> · {it.size}cm {it.perfect ? '🎯' : ''} · 💎{fishValue(game, it)}</span>
              <button className="pbtn" style={{ padding: '0.8cqw 2cqw', fontSize: 'max(6px,1.8cqw)' }} onPointerDown={down(() => giveGift(i))}>🎁</button>
            </div>
          );
        })}
      </div>
      <div style={{ height: '2cqw' }} />
    </div>
  );
}

function TrophyTab({ game }: { game: Game }) {
  const ex = game.ex;
  return (
    <div>
      <H>TROPHIES · {ex.trophies.length}/{TROPHIES.length}</H>
      <div className="flex flex-col" style={{ gap: '1.4cqw' }}>
        {TROPHIES.map((t) => {
          const got = ex.trophies.includes(t.id);
          return (
            <div key={t.id} className="pcard flex items-center" style={{ padding: '1.2cqw 2cqw', gap: '2cqw', opacity: got ? 1 : 0.55, background: got ? 'linear-gradient(180deg,#fff2c8,#ffe08a)' : undefined }}>
              <div style={{ fontSize: '7cqw', filter: got ? 'none' : 'grayscale(1)' }}>{got ? t.icon : '🔒'}</div>
              <div className="vt" style={{ fontSize: 'max(13px,3.9cqw)', lineHeight: 1 }}><b>{t.name}</b><br /><small>{t.desc} · +{t.gems.toLocaleString()} 💎</small></div>
            </div>
          );
        })}
      </div>
      <div style={{ height: '2cqw' }} />
    </div>
  );
}

function GearTab({ game }: { game: Game }) {
  const ex = game.ex;
  const act = activePetId(game);
  const rod = RODS[ex.rod];
  return (
    <div>
      <H>🎣 FISHING GEAR</H>
      <div className="pcard vt" style={{ padding: '2cqw', fontSize: 'max(13px,3.9cqw)', lineHeight: 1.05 }}>
        <b>{rod.icon} {rod.name}</b> — {rod.desc}<br />
        <small>Reel bar {rod.bar} · Luck +{Math.round(rod.luck * 100)}% · Bite speed +{Math.round(rod.bite * 100)}%</small><br />
        <small>Rods: {ex.rods.length}/{RODS.length} owned. Buy more at the Seafood Shack on the Pier!</small>
      </div>
      <H>🐛 BAIT (TAP TO SELECT)</H>
      <div className="flex flex-col" style={{ gap: '1.2cqw' }}>
        {BAITS.filter((b) => b.id === 'none' || (ex.baits[b.id] || 0) > 0).map((b) => (
          <button key={b.id} className="pcard flex items-center justify-between" style={{ padding: '1cqw 2cqw', cursor: 'pointer', outline: ex.bait === b.id ? '0.8cqw solid #e0407a' : 'none' }}
            onPointerDown={down(() => { ex.bait = b.id; audio.play('select'); game.emit(); })}>
            <span className="vt" style={{ fontSize: 'max(13px,3.9cqw)', lineHeight: 1 }}>{b.icon} <b>{b.name}</b>{b.id === 'none' ? '' : ` ×${ex.baits[b.id]}`}<br /><small>{b.desc}</small></span>
          </button>
        ))}
      </div>
      <H>🐾 YOUR PET</H>
      {act ? (() => {
        const p = PET_BY_ID[act]; const xp = ex.pets[act]; const lv = bondLevel(xp);
        const next = BOND_XP[Math.min(5, lv + 1)];
        return (
          <div className="pcard" style={{ padding: '2cqw' }}>
            <div className="flex items-center" style={{ gap: '2cqw' }}>
              <div className="bob" style={{ fontSize: '10cqw' }}>{p.icon}</div>
              <div className="vt" style={{ fontSize: 'max(13px,3.9cqw)', lineHeight: 1.02 }}>
                <b>{p.name} the {p.species}</b> · Bond {lv}/5 {'💕'.repeat(lv)}<br />
                <b style={{ color: '#a02a60' }}>{p.perk}</b>: {p.desc}
              </div>
            </div>
            <Bar v={lv >= 5 ? 1 : (xp - BOND_XP[lv]) / (next - BOND_XP[lv])} col="#ff7ab4" />
            <div style={sub}>Feed fish at the Mall Pet Corner to raise bond.</div>
          </div>
        );
      })() : (
        <div className="pcard vt" style={{ padding: '2cqw', fontSize: 'max(13px,3.8cqw)', lineHeight: 1.05 }}>
          No pet yet! Visit the 🐾 Pet Corner in the Glamour Mall (park → east). {PETS.map((p) => p.icon).join(' ')}
        </div>
      )}
      <div style={{ height: '2cqw' }} />
    </div>
  );
}

export function Journal({ game }: { game: Game }) {
  const [tab, setTab] = useState(game.journalTab);
  const done = game.ex.quests.filter((q) => q.done).length;
  return (
    <div className="overlay flex flex-col fade-in" style={{ background: 'linear-gradient(180deg,#3a1f5a,#1c0f2a)' }}>
      <div className="flex items-center justify-between" style={{ padding: '2.4cqw 3cqw' }}>
        <div className="px glow-text" style={{ fontSize: 'max(9px,2.8cqw)' }}>📖 JOURNAL · DAY {game.day}/{MAX_DAYS}</div>
        <button className="pbtn" style={{ padding: '1.6cqw 3cqw' }} onPointerDown={down(() => game.closeJournal())}>CLOSE ✖</button>
      </div>
      <div className="flex" style={{ gap: '1cqw', padding: '0 3cqw 2cqw' }}>
        {tabs.map((t, i) => (
          <button key={t} className={`pbtn ${tab === i ? '' : 'alt'} flex-1`} style={{ padding: '1.6cqw 0.4cqw', fontSize: 'max(5px,1.5cqw)', boxShadow: tab === i ? undefined : '0 0.5cqw 0 #241a48' }}
            onPointerDown={down(() => { setTab(i); game.journalTab = i; audio.play('select'); })}>
            {t}{i === 0 && done < 3 ? ' •' : ''}
          </button>
        ))}
      </div>
      <div className="scroll-y flex-1 min-h-0" style={{ padding: '0 3cqw 3cqw', color: '#ffe0f0' }}>
        <div style={{ color: '#ffe0f0' }}>
          {tab === 0 && <QuestsTab game={game} />}
          {tab === 1 && <FishTab game={game} />}
          {tab === 2 && <TrophyTab game={game} />}
          {tab === 3 && <GearTab game={game} />}
        </div>
      </div>
    </div>
  );
}
