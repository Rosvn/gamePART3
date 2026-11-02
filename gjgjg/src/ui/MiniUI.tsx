import type { Game } from '../game/engine';
import { audio } from '../game/audio';
import { BAIT_BY_ID, FISH_BY_ID, RARITY_COL, RODS, SPOT_INFO } from '../game/extras';
import { BAG_MAX, DIFF_NAME, biteOf, cycleBait, danceHit, dancesLeft, fishPress, leaveDance, leaveFishing, luckOf, startDance, timeBucket } from '../game/features';

const down = (fn: () => void) => (e: React.PointerEvent) => { e.preventDefault(); e.stopPropagation(); audio.init(); fn(); };
const TIME_LABEL = { day: '☀️ Day', dusk: '🌇 Dusk', night: '🌙 Night' } as const;

/* ------------------------------------------------------------------ FISHING */
export function FishingUI({ game }: { game: Game }) {
  const f = game.fish;
  if (!f) return null;
  const ex = game.ex;
  const bait = BAIT_BY_ID[ex.bait];
  const luck = Math.round(luckOf(game) * 100);
  const bite = Math.round(biteOf(game) * 100);
  const info = SPOT_INFO[f.spot];

  if (f.stage === 'fight') {
    return (
      <div className="absolute inset-0" style={{ zIndex: 12, touchAction: 'none', cursor: 'pointer' }}
        onPointerDown={(e) => { e.preventDefault(); game.actionDown(); }}
        onPointerUp={() => game.actionUp()} onPointerLeave={() => game.actionUp()} onPointerCancel={() => game.actionUp()}>
        <div className="absolute flex justify-center" style={{ left: 0, right: 0, bottom: '2cqw', pointerEvents: 'none' }}>
          <span className="vt bob" style={{ background: 'rgba(28,15,42,0.92)', color: '#9affb0', border: '0.5cqw solid #4aff7a', borderRadius: '2cqw', padding: '0.8cqw 2.4cqw', fontSize: 'max(13px,4cqw)', lineHeight: 1 }}>
            HOLD to lift the green bar · keep the fish inside!
          </span>
        </div>
      </div>
    );
  }

  if (f.stage === 'bite') {
    return (
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 12 }}>
        <button className="pbtn blink" style={{ fontSize: 'max(14px,5cqw)', padding: '3cqw 6cqw', background: 'linear-gradient(180deg,#ffe58a,#f2a630)', borderColor: '#8a5a00', color: '#5a2a00', textShadow: 'none', marginTop: '36cqw' }}
          onPointerDown={down(() => fishPress(game))}>❗ BITE! TAP NOW ❗</button>
      </div>
    );
  }

  if (f.stage === 'result' && f.result) {
    const r = f.result; const col = RARITY_COL[r.fish.rarity];
    return (
      <div className="absolute inset-0 flex items-center justify-center fade-in" style={{ zIndex: 14, background: 'rgba(10,5,24,0.55)' }}>
        <div className="pcard pop-in text-center" style={{ width: '82%', padding: '3cqw' }}>
          <div className="px" style={{ fontSize: 'max(8px,2.4cqw)', color: r.perfect ? '#d09a00' : '#a02a60' }}>{r.perfect ? '🎯 PERFECT CATCH!' : '🎣 YOU CAUGHT...'}</div>
          <div className="bob" style={{ fontSize: '15cqw', lineHeight: 1.1 }}>{r.fish.icon}</div>
          <div className="px" style={{ fontSize: 'max(9px,3cqw)', color: col }}>{r.fish.name}</div>
          <div className="px" style={{ fontSize: 'max(6px,1.8cqw)', color: col, margin: '0.8cqw 0' }}>{r.fish.rarity.toUpperCase()}</div>
          <div className="flex justify-center flex-wrap" style={{ gap: '1cqw', margin: '1cqw 0' }}>
            {r.isNew && <span className="badge px" style={{ background: '#ff7ab4', color: '#fff' }}>✨ NEW!</span>}
            {r.record && !r.isNew && <span className="badge px" style={{ background: '#2a8ad8', color: '#fff' }}>📏 RECORD</span>}
            {r.fish.id === ex.fotd && <span className="badge px" style={{ background: '#f2b630', color: '#5a3a00' }}>🌟 FISH OF THE DAY +50%</span>}
          </div>
          <div className="vt" style={{ fontSize: 'max(14px,4.4cqw)', lineHeight: 1.05 }}>
            {r.fish.desc}<br />
            {r.fish.treasure ? '' : <>📏 {r.size} cm · </>}💎 {r.v.toLocaleString()}<br />
            <small style={{ opacity: 0.75 }}>{r.note}</small>
          </div>
          <div className="flex" style={{ gap: '2cqw', marginTop: '2cqw' }}>
            <button className="pbtn flex-1" onPointerDown={down(() => fishPress(game))}>🎣 AGAIN</button>
            <button className="pbtn alt flex-1" onPointerDown={down(() => leaveFishing(game))}>🚪 LEAVE</button>
          </div>
        </div>
      </div>
    );
  }

  // ready / wait
  return (
    <div className="absolute inset-0" style={{ zIndex: 12, pointerEvents: 'none' }}>
      <div className="absolute flex flex-col items-center" style={{ left: 0, right: 0, bottom: '2cqw', gap: '1.4cqw' }}>
        {f.stage === 'ready' && (
          <>
            {f.msg && <span className="vt fade-in" style={{ background: 'rgba(28,15,42,0.92)', color: '#ffd0f0', border: '0.5cqw solid #f2c040', borderRadius: '1.6cqw', padding: '0.8cqw 2.4cqw', fontSize: 'max(13px,4cqw)', lineHeight: 1 }}>{f.msg}</span>}
            {ex.stats.fish === undefined && !f.msg && (
              <span className="vt" style={{ background: 'rgba(255,240,246,0.96)', color: '#a02a60', border: '0.5cqw solid #d9709a', borderRadius: '1.6cqw', padding: '0.8cqw 2cqw', fontSize: 'max(12px,3.6cqw)', lineHeight: 1, maxWidth: '88%', textAlign: 'center' }}>
                1) CAST · 2) wait for the ❗ and tap fast · 3) HOLD to keep the fish in the green bar!
              </span>
            )}
            <div className="flex flex-wrap justify-center" style={{ gap: '0.8cqw', maxWidth: '94%' }}>
              <span className="badge px" style={{ background: 'rgba(28,15,42,0.9)', color: '#ffe0f0' }}>{info.icon} {info.name}</span>
              <span className="badge px" style={{ background: 'rgba(28,15,42,0.9)', color: '#ffe0f0' }}>{TIME_LABEL[timeBucket(game)]}{game.weather === 'rainy' ? ' 🌧' : ''}</span>
              <span className="badge px" style={{ background: 'rgba(28,15,42,0.9)', color: luck >= 0 ? '#9affb0' : '#ff9aa8' }}>🍀 {luck >= 0 ? '+' : ''}{luck}%</span>
              <span className="badge px" style={{ background: 'rgba(28,15,42,0.9)', color: bite >= 0 ? '#9affb0' : '#ff9aa8' }}>⚡ {bite >= 0 ? '+' : ''}{bite}%</span>
              <span className="badge px" style={{ background: 'rgba(28,15,42,0.9)', color: '#ffe0f0' }}>🎒 {ex.bag.length}/{BAG_MAX}</span>
            </div>
            <div className="flex items-stretch" style={{ gap: '1.6cqw', pointerEvents: 'auto' }}>
              <button className="pbtn" onPointerDown={down(() => fishPress(game))}>🎣 CAST</button>
              <button className="pbtn alt" style={{ fontSize: 'max(6px,1.8cqw)', padding: '1.6cqw 2.4cqw' }} onPointerDown={down(() => cycleBait(game))}>
                {bait.icon} {bait.name}{ex.bait === 'none' ? '' : ` ×${ex.baits[ex.bait] || 0}`}<br /><span style={{ opacity: 0.8 }}>tap to change</span>
              </button>
              <button className="pbtn alt" onPointerDown={down(() => leaveFishing(game))}>🚪</button>
            </div>
          </>
        )}
        {f.stage === 'wait' && (
          <div className="flex items-center" style={{ gap: '2cqw', pointerEvents: 'auto' }}>
            <span className="vt blink" style={{ background: 'rgba(28,15,42,0.92)', color: '#bfe4ff', border: '0.5cqw solid #7ad0ff', borderRadius: '1.6cqw', padding: '0.8cqw 2.4cqw', fontSize: 'max(14px,4.4cqw)', lineHeight: 1 }}>🌊 Waiting for a bite...</span>
            <button className="pbtn alt" style={{ padding: '1.6cqw 2.4cqw' }} onPointerDown={down(() => fishPress(game))}>↩</button>
          </div>
        )}
        <span className="vt" style={{ fontSize: 'max(10px,2.8cqw)', color: '#ffe0f0', opacity: 0.75, textShadow: '0 0.3cqw 0 #000' }}>{RODS[ex.rod].icon} {RODS[ex.rod].name} · B = bait · ESC = leave</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ DANCE */
const PAD = ['#ff4f9a', '#38e8ff', '#ffd23c', '#7aff7a'];
const GLYPH = ['◀', '▼', '▲', '▶'];
export function DanceUI({ game }: { game: Game }) {
  const d = game.dance;
  if (!d) return null;
  if (d.stage === 'result' && d.result) {
    const r = d.result;
    const gc = r.grade === 'S' ? '#e0b020' : r.grade === 'A' ? '#d0346a' : r.grade === 'B' ? '#2a8ad8' : '#7a6a8a';
    return (
      <div className="absolute inset-0 flex items-center justify-center fade-in" style={{ zIndex: 14, background: 'rgba(10,5,24,0.6)' }}>
        <div className="pcard pop-in text-center" style={{ width: '84%', padding: '3cqw' }}>
          <div className="px" style={{ fontSize: 'max(8px,2.4cqw)', color: '#a02a60' }}>💃 {DIFF_NAME[d.diff].toUpperCase()} BATTLE COMPLETE</div>
          <div className="px bob" style={{ fontSize: '18cqw', color: gc, textShadow: '0 1cqw 0 rgba(0,0,0,0.25)', lineHeight: 1.2 }}>{r.grade}</div>
          <div className="vt" style={{ fontSize: 'max(14px,4.4cqw)', lineHeight: 1.05 }}>
            ✨ Perfect {r.perfect} · 👍 Good {r.good} · 💔 Miss {r.miss}<br />
            🔥 Best combo {r.combo} · Accuracy {Math.round(r.acc * 100)}%<br />
            <b>Score {r.score.toLocaleString()}</b><br />
            💎 +{r.gems.toLocaleString()} · ✨ +{r.charm.toLocaleString()}
          </div>
          <div className="flex" style={{ gap: '2cqw', marginTop: '2cqw' }}>
            <button className="pbtn flex-1" style={{ opacity: dancesLeft(game) > 0 ? 1 : 0.5 }} onPointerDown={down(() => { if (dancesLeft(game) > 0) startDance(game, d.diff); else game.say('💃 No battles left today!'); })}>AGAIN ({dancesLeft(game)})</button>
            <button className="pbtn alt flex-1" onPointerDown={down(() => leaveDance(game))}>🚪 LEAVE</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0" style={{ zIndex: 12, pointerEvents: 'none' }}>
      {[0, 1, 2, 3].map((l) => (
        <button key={l} style={{
          position: 'absolute', left: `${((24 + l * 32) / 176) * 100}%`, width: `${(32 / 176) * 100}%`, top: `${(170 / 208) * 100}%`, height: `${(38 / 208) * 100}%`,
          pointerEvents: 'auto', touchAction: 'none', background: `linear-gradient(180deg, ${PAD[l]}55, ${PAD[l]}22)`, border: `0.6cqw solid ${PAD[l]}`, borderRadius: '2cqw 2cqw 0 0',
          color: PAD[l], fontSize: '7cqw', cursor: 'pointer', padding: 0,
        }} onPointerDown={(e) => { e.preventDefault(); audio.init(); danceHit(game, l); }}>{GLYPH[l]}</button>
      ))}
    </div>
  );
}

export { FISH_BY_ID };
