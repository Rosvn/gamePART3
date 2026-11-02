import { useState } from 'react';
import type { Game } from '../game/engine';
import { MAX_DAYS } from '../game/engine';
import { audio } from '../game/audio';
import { KENS, ROSAN, rosanStage, ROSAN_STAGES } from '../game/kens';
import { listSlots, deleteSlot, SLOT_COUNT, type SaveData } from '../game/storage';

type View = 'main' | 'new' | 'name' | 'load' | 'codes' | 'scores' | 'help';

const panel: React.CSSProperties = { width: '100%', padding: '2.4cqw 2.6cqw', background: 'rgba(58,31,90,0.94)', color: '#ffe0f0', borderColor: '#d9709a' };
const h = (s: string) => <div className="px" style={{ fontSize: 'max(8px,2.6cqw)', color: '#ffe080', textAlign: 'center', marginBottom: '1.6cqw' }}>{s}</div>;

export function CodesPanel({ game, live }: { game: Game; live: boolean }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const submit = () => {
    if (!code.trim()) return;
    audio.init();
    const r = live ? game.redeem(code) : game.queueCode(code);
    setMsg(r); audio.play(r.ok ? 'unlock' : 'error');
    if (r.ok) setCode('');
  };
  return (
    <div>
      <div className="vt" style={{ fontSize: 'max(13px,3.8cqw)', lineHeight: 1.05, marginBottom: '1.6cqw', textAlign: 'center' }}>
        Enter a secret code to unlock special rewards!{!live && <><br /><small style={{ opacity: 0.75 }}>Codes apply to the next story you start or load.</small></>}
      </div>
      <div className="flex" style={{ gap: '1.6cqw' }}>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') submit(); }} placeholder="ENTER CODE" maxLength={16}
          className="px" style={{ flex: 1, minWidth: 0, fontSize: 'max(9px,2.8cqw)', padding: '2cqw', borderRadius: '1.4cqw', border: '0.5cqw solid #f2c040', background: '#fff6fa', color: '#a02a60', letterSpacing: 2 }} />
        <button className="pbtn" style={{ padding: '2cqw 3cqw' }} onPointerDown={(e) => { e.preventDefault(); submit(); }}>OK</button>
      </div>
      {msg && <div className="vt pop-in" style={{ marginTop: '1.6cqw', fontSize: 'max(13px,3.8cqw)', lineHeight: 1.05, color: msg.ok ? '#8affc0' : '#ff8a9a', textAlign: 'center' }}>{msg.msg}</div>}
      {game.pendingCodes.length > 0 && !live && <div className="vt" style={{ marginTop: '1cqw', fontSize: 'max(12px,3.4cqw)', textAlign: 'center', color: '#7af0ff' }}>Active: {game.pendingCodes.join(', ')}</div>}
    </div>
  );
}

function SlotCard({ d, i, onPick, onDelete, mode }: { d: SaveData | null; i: number; onPick: () => void; onDelete?: () => void; mode: 'new' | 'load' }) {
  const st = d ? rosanStage(d.kens[ROSAN]?.m || 0) : 0;
  return (
    <div className="pcard flex items-center" style={{ padding: '1.6cqw 2cqw', gap: '2cqw', cursor: 'pointer', opacity: mode === 'load' && !d ? 0.5 : 1 }} onPointerDown={(e) => { e.preventDefault(); if (mode === 'load' && !d) return; onPick(); }}>
      <div className="px" style={{ fontSize: 'max(10px,3.4cqw)', color: '#d0346a', width: '6cqw' }}>{i + 1}</div>
      <div className="flex-1 min-w-0 vt" style={{ fontSize: 'max(13px,3.7cqw)', lineHeight: 1 }}>
        {d ? (
          <>
            <b>👱‍♀️ {d.name}</b> · Day {d.day}/{MAX_DAYS}
            <div style={{ opacity: 0.8 }}>💞 {d.unlocked}/{KENS.length} Kens · 💎 {d.gems.toLocaleString()} · ⭐ Rep {Math.round(d.rep)}</div>
            <div style={{ opacity: 0.7 }}>{d.kens[ROSAN]?.u ? `${ROSAN_STAGES[st].icon} Rosan: ${ROSAN_STAGES[st].name}` : '🏙️ Rosan: not met'} · {new Date(d.savedAt).toLocaleDateString()}</div>
          </>
        ) : <span style={{ opacity: 0.7 }}>— Empty slot —</span>}
      </div>
      {d && onDelete && <button className="pbtn alt" style={{ padding: '1.2cqw 2cqw', fontSize: 'max(7px,2cqw)' }} onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}>🗑</button>}
      {mode === 'new' && d && <span className="px" style={{ fontSize: 'max(6px,1.7cqw)', color: '#d02a3a' }}>OVERWRITE</span>}
    </div>
  );
}

export function Home({ game }: { game: Game }) {
  const [view, setView] = useState<View>('main');
  const [slots, setSlots] = useState(listSlots());
  const [slot, setSlot] = useState(0);
  const [name, setName] = useState('');
  const refresh = () => setSlots(listSlots());
  const go = (v: View) => { audio.init(); audio.play('select'); refresh(); setView(v); };
  const latest = slots.map((d, i) => ({ d, i })).filter((x) => x.d).sort((a, b) => b.d!.savedAt - a.d!.savedAt)[0];
  const back = <button className="pbtn alt" style={{ width: '100%', marginTop: '2cqw' }} onPointerDown={(e) => { e.preventDefault(); go('main'); }}>◀ BACK</button>;

  return (
    <div className="overlay flex flex-col justify-between fade-in" style={{ pointerEvents: 'auto' }}>
      <div className="text-center" style={{ padding: '4cqw 3cqw 0', background: 'linear-gradient(180deg, rgba(20,8,34,0.85), rgba(20,8,34,0))', height: view === 'main' ? '34%' : '20%' }}>
        <div className="px" style={{ fontSize: 'max(8px,2.4cqw)', color: '#ffd9e6', letterSpacing: 2 }}>★ A PIXEL DATING ADVENTURE ★</div>
        <div className="px glow-text bob" style={{ fontSize: view === 'main' ? 'max(22px,10cqw)' : 'max(16px,7cqw)', color: '#ff8ac0', marginTop: '1.6cqw', textShadow: '0 1cqw 0 #8a2a58, 0 0 4cqw #ff4f9a' }}>BARBIE</div>
        <div className="px" style={{ fontSize: 'max(9px,4cqw)', color: '#7af0ff', marginTop: '1.2cqw', textShadow: '0 0.6cqw 0 #1a3a6a' }}>&amp; THE {KENS.length} KENS</div>
      </div>

      <div className="flex flex-col items-center scroll-y" style={{ padding: '2cqw 4cqw 4cqw', background: 'linear-gradient(0deg, rgba(20,8,34,0.96) 75%, rgba(20,8,34,0))', gap: '2cqw', maxHeight: '78%' }}>
        {view === 'main' && (
          <>
            {latest && (
              <button className="pbtn" style={{ width: '100%', fontSize: 'max(9px,3cqw)' }} onPointerDown={(e) => { e.preventDefault(); game.load(latest.i); }}>
                <span className="blink">▶</span> CONTINUE · {latest.d!.name} (Day {latest.d!.day})
              </button>
            )}
            <button className={latest ? 'pbtn alt' : 'pbtn'} style={{ width: '100%', fontSize: 'max(9px,3cqw)' }} onPointerDown={(e) => { e.preventDefault(); go('new'); }}>✨ NEW STORY</button>
            <button className="pbtn alt" style={{ width: '100%', fontSize: 'max(9px,3cqw)' }} onPointerDown={(e) => { e.preventDefault(); go('load'); }}>💾 LOAD STORY</button>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '1.6cqw', width: '100%' }}>
              <button className="pbtn alt" style={{ fontSize: 'max(7px,2.2cqw)', padding: '2.4cqw 1cqw' }} onPointerDown={(e) => { e.preventDefault(); go('codes'); }}>🔑 CODES</button>
              <button className="pbtn alt" style={{ fontSize: 'max(7px,2.2cqw)', padding: '2.4cqw 1cqw' }} onPointerDown={(e) => { e.preventDefault(); go('scores'); }}>🏆 SCORES</button>
              <button className="pbtn alt" style={{ fontSize: 'max(7px,2.2cqw)', padding: '2.4cqw 1cqw' }} onPointerDown={(e) => { e.preventDefault(); go('help'); }}>❓ HELP</button>
            </div>
            {game.pendingCodes.length > 0 && <div className="vt" style={{ color: '#7af0ff', fontSize: 'max(12px,3.4cqw)' }}>🔑 Active codes: {game.pendingCodes.join(', ')}</div>}
          </>
        )}

        {view === 'new' && (
          <div className="pcard" style={panel}>
            {h('✨ CHOOSE A SAVE SLOT')}
            <div className="flex flex-col" style={{ gap: '1.4cqw', color: '#3a1f2a' }}>
              {Array.from({ length: SLOT_COUNT }, (_, i) => <SlotCard key={i} d={slots[i]} i={i} mode="new" onPick={() => { setSlot(i); setName(''); go('name'); }} />)}
            </div>
            {back}
          </div>
        )}

        {view === 'name' && (
          <div className="pcard" style={panel}>
            {h('👱‍♀️ WHAT IS YOUR BARBIE\'S NAME?')}
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={14} placeholder="Barbie"
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') game.newGame(name || 'Barbie', slot); }}
              className="vt" style={{ width: '100%', fontSize: 'max(18px,6cqw)', padding: '1.6cqw 2.4cqw', borderRadius: '1.6cqw', border: '0.6cqw solid #f2c040', background: '#fff6fa', color: '#a02a60', textAlign: 'center' }} />
            <div className="flex flex-wrap justify-center" style={{ gap: '1cqw', marginTop: '1.6cqw' }}>
              {['Barbie', 'Sophia', 'Aisha', 'Luna', 'Priya', 'Mia', 'Rosa'].map((n) => (
                <button key={n} className="vt" style={{ fontSize: 'max(12px,3.4cqw)', padding: '0.6cqw 2cqw', borderRadius: '3cqw', background: name === n ? '#ff8ac0' : 'rgba(255,255,255,0.12)', color: '#fff', border: '0.3cqw solid #d9709a', cursor: 'pointer' }} onPointerDown={(e) => { e.preventDefault(); setName(n); }}>{n}</button>
              ))}
            </div>
            <div className="vt" style={{ fontSize: 'max(12px,3.4cqw)', textAlign: 'center', marginTop: '1.4cqw', opacity: 0.8 }}>Slot {slot + 1}{slots[slot] ? ` — this will overwrite ${slots[slot]!.name}'s story!` : ''}</div>
            <button className="pbtn" style={{ width: '100%', marginTop: '2cqw' }} onPointerDown={(e) => { e.preventDefault(); game.newGame(name || 'Barbie', slot); }}>💖 BEGIN {(name || 'BARBIE').toUpperCase()}'S STORY</button>
            <button className="pbtn alt" style={{ width: '100%', marginTop: '1.6cqw' }} onPointerDown={(e) => { e.preventDefault(); go('new'); }}>◀ BACK</button>
          </div>
        )}

        {view === 'load' && (
          <div className="pcard" style={panel}>
            {h('💾 LOAD A STORY')}
            <div className="flex flex-col" style={{ gap: '1.4cqw', color: '#3a1f2a' }}>
              {Array.from({ length: SLOT_COUNT }, (_, i) => <SlotCard key={i} d={slots[i]} i={i} mode="load" onPick={() => game.load(i)} onDelete={() => { if (window.confirm(`Delete ${slots[i]?.name}'s story?`)) { deleteSlot(i); refresh(); } }} />)}
            </div>
            {back}
          </div>
        )}

        {view === 'codes' && <div className="pcard" style={panel}>{h('🔑 SECRET CODES')}<CodesPanel game={game} live={false} />{back}</div>}

        {view === 'scores' && (
          <div className="pcard" style={panel}>
            {h('🏆 HIGH SCORES')}
            <div className="vt" style={{ fontSize: 'max(13px,3.8cqw)', lineHeight: 1.05 }}>
              {game.scores.length ? game.scores.map((s, i) => (
                <div key={i} className="flex justify-between" style={{ padding: '0.4cqw 1cqw', background: i % 2 ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
                  <span>{i + 1}. {s.name} <small style={{ opacity: 0.7 }}>· {s.ending} · {s.kens}K</small></span><b>{s.score.toLocaleString()}</b>
                </div>
              )) : <div style={{ textAlign: 'center', opacity: 0.8 }}>No scores yet — be the first!</div>}
            </div>
            {back}
          </div>
        )}

        {view === 'help' && (
          <div className="pcard" style={panel}>
            {h('❓ HOW TO PLAY')}
            <div className="vt" style={{ fontSize: 'max(13px,3.7cqw)', lineHeight: 1.05 }}>
              <p>💞 Date {KENS.length} Kens across 12 locations in Dreamtown. Unlock them in order with 💎.</p>
              <p>👗 Dress up to match each Ken's favourite stat for 1.5x rewards. Masterpiece outfits give 3x!</p>
              <p>📖 Story chapters appear on certain days. Your choices change your ⭐ Reputation, Rosan's 🤝 Trust and your ENDING (8 endings!).</p>
              <p>🗺️ New places: Central Park, Sweet Café, Glamour Mall, Glow Spa, City Library, Sunset Pier, Rose Garden. Go fishing, shop, perform, pick roses!</p>
              <p>🏙️ Rosan Sawad has 6 relationship stages, daily moods and 7 secret memories.</p>
              <p>🎣 FISHING: cast at the Pier, Beach or Park Pond. Tap when ❗ appears, then HOLD to keep the fish in the green bar. 24 species, 5 rods, 4 baits — sell at the Seafood Shack or gift fish to Kens!</p>
              <p>📋 Daily quests, 🏆 trophies, ⭐ 4 hidden Lucky Stars every day, 🐾 adoptable pets (Mall Pet Corner) and 💃 rhythm Dance Battles at the club's DJ Booth. Open the 📖 Journal (J).</p>
              <p>⌨️ WASD walk · SPACE talk · Q/E/R wardrobe · K catalog · J journal · N night · P pause</p>
            </div>
            {back}
          </div>
        )}
      </div>
    </div>
  );
}
