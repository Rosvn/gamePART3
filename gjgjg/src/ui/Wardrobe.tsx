import { useMemo, useState } from 'react';
import type { Game } from '../game/engine';
import { HAIR_COLORS, ITEM_BY_ID, MASTERPIECES, STAT_COLOR, STAT_ICON, STAT_LABEL, comboCount, itemsOf, type Slot, type StatKey, type Item } from '../game/items';
import { BarbieSprite } from './Sprites';
import type { Dir } from '../game/sprites';

type TabDef = { key: string; label: string; slot?: Slot | 'color' | 'sets' };
const TAB_ALL: TabDef[] = [
  { key: 'hair', label: '💇 Style', slot: 'hair' }, { key: 'color', label: '🎨 Color', slot: 'color' },
  { key: 'outfit', label: '👗 Outfit', slot: 'outfit' }, { key: 'shoes', label: '👠 Shoes', slot: 'shoes' },
  { key: 'makeup', label: '💄 Makeup', slot: 'makeup' }, { key: 'neck', label: '📿 Neck', slot: 'neck' },
  { key: 'ears', label: '✨ Ears', slot: 'ears' }, { key: 'head', label: '👑 Head', slot: 'head' },
  { key: 'eyes', label: '🕶️ Eyes', slot: 'eyes' }, { key: 'hand', label: '👛 Hand', slot: 'hand' },
];
const pick = (keys: string[]) => TAB_ALL.filter((t) => keys.includes(t.key));
const TABS: Record<string, TabDef[]> = {
  dress: pick(['outfit', 'shoes']),
  hm: pick(['makeup', 'neck', 'ears', 'head', 'eyes', 'hand']),
  hair: pick(['hair', 'color']),
  all: TAB_ALL,
};
const DIRS: Dir[] = ['down', 'right', 'up', 'left'];
const HEAD_SLOTS: (Slot | 'color')[] = ['hair', 'color', 'makeup', 'neck', 'ears', 'head', 'eyes'];

function Chips({ it }: { it: Item }) {
  return (
    <div className="flex flex-wrap justify-center" style={{ gap: '0.5cqw', marginTop: '0.6cqw' }}>
      {(Object.keys(it.stats) as StatKey[]).filter((k) => it.stats[k] > 0).map((k) => (
        <span key={k} className="px" style={{ fontSize: 'max(5px,1.5cqw)', background: STAT_COLOR[k], color: '#fff', padding: '0.4cqw 0.7cqw', borderRadius: '0.8cqw', textShadow: '0 0.2cqw 0 rgba(0,0,0,0.4)' }}>
          {STAT_ICON[k]}{it.stats[k]}
        </span>
      ))}
    </div>
  );
}

export function Wardrobe({ game }: { game: Game }) {
  const tabs = useMemo(() => [...TABS[game.wardrobe], { key: 'sets', label: '🏆 Sets', slot: 'sets' as const }], [game.wardrobe]);
  const [ti, setTi] = useState(0);
  const [dirI, setDirI] = useState(0);
  const tab = tabs[Math.min(ti, tabs.length - 1)];
  const st = game.stats;
  const mp = game.masterpiece;
  const L = game.look as unknown as Record<string, string | null>;

  return (
    <div className="overlay flex flex-col fade-in" style={{ background: 'linear-gradient(180deg,#3a1f5a,#1c0f2a)' }}>
      <div className="flex items-center justify-between" style={{ padding: '2.4cqw 3cqw' }}>
        <div className="px glow-text" style={{ fontSize: 'max(9px,3cqw)' }}>✨ BARBIE'S CLOSET</div>
        <button className="pbtn" style={{ padding: '1.6cqw 3cqw' }} onPointerDown={(e) => { e.preventDefault(); game.closeWardrobe(); }}>DONE ✔</button>
      </div>

      <div className="flex" style={{ gap: '2.4cqw', padding: '0 3cqw' }}>
        <div className="pcard flex flex-col items-center justify-center" style={{ width: '38cqw', padding: '1.5cqw', background: 'linear-gradient(180deg,#ffd9ec,#d8b8f0)' }} onPointerDown={() => setDirI((d) => (d + 1) % 4)}>
          <BarbieSprite look={game.look} dir={DIRS[dirI]} animate scale={4.4} />
          <div className="px" style={{ fontSize: 'max(5px,1.5cqw)', color: '#7a3a5a', marginTop: '0.6cqw' }}>TAP TO TURN</div>
        </div>
        <div className="flex-1 min-w-0 flex flex-col" style={{ gap: '1cqw' }}>
          {(Object.keys(STAT_LABEL) as StatKey[]).map((k) => (
            <div key={k}>
              <div className="flex justify-between vt" style={{ fontSize: 'max(11px,3.2cqw)', lineHeight: 1 }}>
                <span>{STAT_ICON[k]} {STAT_LABEL[k]}</span><span>{st[k]}/100</span>
              </div>
              <div style={{ height: '2cqw', background: '#1c0f2a', border: '0.4cqw solid #8a3a68', borderRadius: '1cqw', overflow: 'hidden' }}>
                <div style={{ width: `${st[k]}%`, height: '100%', background: STAT_COLOR[k], transition: 'width .25s' }} />
              </div>
            </div>
          ))}
          <div className="px" style={{ fontSize: 'max(6px,1.8cqw)', padding: '1.2cqw', borderRadius: '1.2cqw', textAlign: 'center', background: mp ? 'linear-gradient(180deg,#ffe58a,#f2b630)' : '#2a1a3a', color: mp ? '#5a3a00' : '#b79ad6', border: '0.5cqw solid #8a3a68' }}>
            {mp ? `🏆 MASTERPIECE x3: ${mp.name}` : 'No Masterpiece set yet — see 🏆 Sets'}
          </div>
          <div className="vt" style={{ fontSize: 'max(10px,2.9cqw)', color: '#d8b8f0', lineHeight: 1 }}>
            Look power: <b style={{ color: '#ffe080' }}>{st.total}</b> · {comboCount().toLocaleString()}+ possible looks
          </div>
        </div>
      </div>

      <div className="flex scroll-y" style={{ gap: '1cqw', padding: '2cqw 3cqw 1.4cqw', overflowX: 'auto', overflowY: 'hidden', flex: 'none' }}>
        {tabs.map((t, i) => (
          <button key={t.key} onPointerDown={(e) => { e.preventDefault(); setTi(i); }} className="px"
            style={{ flex: 'none', fontSize: 'max(6px,1.9cqw)', padding: '1.5cqw 2cqw', borderRadius: '1.4cqw', border: '0.5cqw solid #8a3a68', background: i === ti ? 'linear-gradient(180deg,#ffb0cf,#e0609a)' : '#3a2a4a', color: '#fff', boxShadow: i === ti ? '0 0.6cqw 0 #5a1438' : 'none', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="scroll-y flex-1 min-h-0" style={{ padding: '0 3cqw 3cqw' }}>
        {tab.slot === 'sets' ? (
          <div className="flex flex-col" style={{ gap: '1.4cqw' }}>
            <div className="vt" style={{ fontSize: 'max(12px,3.6cqw)', color: '#ffe080' }}>Equip a matching set for a Masterpiece Synergy Bonus: daily Style Points x3!</div>
            {MASTERPIECES.map((m) => {
              const on = m.test(game.look);
              return (
                <div key={m.id} className="pcard" style={{ padding: '1.6cqw 2.4cqw', background: on ? 'linear-gradient(180deg,#fff2b0,#ffd860)' : undefined, opacity: on ? 1 : 0.92 }}>
                  <div className="px" style={{ fontSize: 'max(6px,1.9cqw)', color: '#7a3a5a' }}>{on ? '✔ ' : '◇ '}{m.name}</div>
                  <div className="vt" style={{ fontSize: 'max(12px,3.6cqw)', lineHeight: 1 }}>{m.hint}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '2cqw' }}>
            {tab.slot === 'color'
              ? HAIR_COLORS.map((hc) => (
                <button key={hc.id} onPointerDown={(e) => { e.preventDefault(); game.setHairColor(hc.id); }} className={`pcard flex flex-col items-center ${game.look.hairColor === hc.id ? 'pop-in' : ''}`}
                  style={{ padding: '1.2cqw', outline: game.look.hairColor === hc.id ? '0.9cqw solid #e0407a' : 'none', cursor: 'pointer' }}>
                  <BarbieSprite look={{ ...game.look, hairColor: hc.id }} crop="head" scale={2.4} />
                  <div className="flex" style={{ gap: 0, marginTop: '0.6cqw' }}>{[hc.s, hc.m, hc.h].map((c) => <i key={c} style={{ width: '3cqw', height: '3cqw', background: c, display: 'block' }} />)}</div>
                  <div className="vt" style={{ fontSize: 'max(11px,3.2cqw)', lineHeight: 1, marginTop: '0.5cqw' }}>{hc.name}</div>
                </button>
              ))
              : itemsOf(tab.slot as Slot).map((it) => {
                const owned = game.isOwned(it.id);
                const equipped = L[it.slot] === it.id;
                const look = { ...game.look, [it.slot]: it.id };
                const head = HEAD_SLOTS.includes(it.slot);
                return (
                  <button key={it.id} onPointerDown={(e) => { e.preventDefault(); game.equip(it.slot, it.id); }}
                    className="pcard flex flex-col items-center"
                    style={{ padding: '1.2cqw', outline: equipped ? '0.9cqw solid #e0407a' : 'none', cursor: 'pointer', opacity: owned ? 1 : 0.75, position: 'relative', background: it.secret ? 'linear-gradient(180deg,#e8dcff,#c8b0f0)' : undefined }}>
                    {owned ? <BarbieSprite look={look} crop={head ? 'head' : 'full'} scale={head ? 2.4 : 2.1} />
                      : <div className="flex items-center justify-center" style={{ width: '16cqw', height: '16cqw', fontSize: '8cqw' }}>🔒</div>}
                    {equipped && <span className="px" style={{ position: 'absolute', top: '0.6cqw', right: '0.8cqw', fontSize: 'max(6px,1.8cqw)', color: '#e0407a' }}>✔</span>}
                    <div className="vt" style={{ fontSize: 'max(11px,3.2cqw)', lineHeight: 0.95, textAlign: 'center', marginTop: '0.4cqw' }}>{owned ? `${it.icon} ${it.name}` : '??? Rare Item'}</div>
                    {owned ? <Chips it={ITEM_BY_ID[it.id]} /> : <div className="vt" style={{ fontSize: 'max(9px,2.6cqw)', color: '#7a5aa0', textAlign: 'center', lineHeight: 1 }}>Find it on a midnight rooftop</div>}
                  </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
