import { memo } from 'react';
import type { Game } from '../game/engine';
import { MAX_DAYS } from '../game/engine';
import { audio } from '../game/audio';
import { BarbieSprite } from './Sprites';

function Clock({ minutes }: { minutes: number }) {
  const m = minutes % 1440;
  const h = Math.floor(m / 60) % 12;
  const mm = Math.floor(m) % 60;
  const ha = (h + mm / 60) * 30;
  const ma = mm * 6;
  const ticks = Array.from({ length: 12 }, (_, i) => i);
  return (
    <svg viewBox="0 0 100 100" style={{ width: '17cqw', height: '17cqw', filter: 'drop-shadow(0 1cqw 0 rgba(90,36,72,0.9))' }}>
      <circle cx="50" cy="50" r="47" fill="#e08aab" stroke="#8a3a68" strokeWidth="4" />
      <circle cx="50" cy="50" r="39" fill="#fff6ea" stroke="#f2c040" strokeWidth="3" />
      {ticks.map((i) => (
        <rect key={i} x="48.5" y="14" width={i % 3 === 0 ? 3 : 1.5} height={i % 3 === 0 ? 8 : 5} fill="#7a3a5a" transform={`rotate(${i * 30} 50 50)`} />
      ))}
      <text x="50" y="35" textAnchor="middle" fontSize="11" fontFamily="'Press Start 2P'" fill="#7a3a5a">12</text>
      <text x="82" y="54" textAnchor="middle" fontSize="11" fontFamily="'Press Start 2P'" fill="#7a3a5a">3</text>
      <text x="50" y="80" textAnchor="middle" fontSize="11" fontFamily="'Press Start 2P'" fill="#7a3a5a">6</text>
      <text x="18" y="54" textAnchor="middle" fontSize="11" fontFamily="'Press Start 2P'" fill="#7a3a5a">9</text>
      <line x1="50" y1="50" x2="50" y2="28" stroke="#4a1f4a" strokeWidth="5" strokeLinecap="square" transform={`rotate(${ha} 50 50)`} />
      <line x1="50" y1="50" x2="50" y2="17" stroke="#d0346a" strokeWidth="3.5" strokeLinecap="square" transform={`rotate(${ma} 50 50)`} />
      <circle cx="50" cy="50" r="4" fill="#f2c040" stroke="#4a1f4a" strokeWidth="2" />
    </svg>
  );
}

function HudInner({ game }: { game: Game }) {
  const mp = game.masterpiece;
  const env = game.env;
  const wx = game.weather === 'rainy' ? '🌧️' : env.night > 0.5 ? '🌙' : env.minutes > 1050 ? '🌇' : '☀️';
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {/* top-left: portrait + charm + gems */}
      <div className="absolute" style={{ left: '1.6cqw', top: '1.6cqw', width: '58cqw' }}>
        <div className="flex items-start" style={{ gap: '1cqw' }}>
          <button className="portrait" aria-label="Ken catalog" onPointerDown={(e) => { e.preventDefault(); game.openRoster(); }}>
            <BarbieSprite look={game.look} crop="head" scale={0.62 * 1} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
          </button>
          <div className="flex flex-col min-w-0" style={{ gap: '0.9cqw', paddingTop: '0.4cqw' }}>
            <div className="plate px" style={{ fontSize: 'max(7px,2.3cqw)' }}>CHARM: {game.charm.toLocaleString()}</div>
            <div className="plate flex items-center" style={{ gap: '1cqw' }}>
              <span style={{ fontSize: '3cqw' }}>💎</span>
              <span className="px" style={{ fontSize: 'max(7px,2.2cqw)' }}>{game.gems.toLocaleString()}</span>
              <span className="vt" style={{ fontSize: 'max(10px,2.8cqw)', opacity: 0.8 }}>STYLE GEMS</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap" style={{ gap: '0.8cqw', marginTop: '1.4cqw' }}>
          {mp && <span className="badge px pop-in" style={{ background: 'linear-gradient(180deg,#ffe58a,#f2b630)', color: '#5a3a00' }}>🏆 x3 {mp.name}</span>}
          {game.kissActive && <span className="badge px" style={{ background: '#ff7ab4', color: '#fff' }}>💋 +50%</span>}
          {game.anyRaag && <span className="badge px" style={{ background: '#d02a3a', color: '#fff' }}>😤 -30%</span>}
          {game.heartbroken > 0 && <span className="badge px" style={{ background: '#4a4a6a', color: '#fff' }}>💔 0%</span>}
        </div>
      </div>

      {/* top-right: weather window, clock, date */}
      <div className="absolute flex flex-col items-end" style={{ right: '1.6cqw', top: '1.2cqw' }}>
        <div className="flex items-center" style={{ gap: '0.6cqw' }}>
          <div
            className="flex items-center justify-center"
            style={{ width: '10cqw', height: '12cqw', borderRadius: '6cqw 6cqw 1.5cqw 1.5cqw', border: '0.7cqw solid #8a3a68', background: `linear-gradient(180deg,${env.skyTop},${env.skyBot})`, fontSize: '5cqw', boxShadow: '0 0.6cqw 0 #5a2448', marginRight: '-1.4cqw' }}
          >
            {wx}
          </div>
          <Clock minutes={game.minutes} />
        </div>
        <div className="plate px" style={{ marginTop: '1cqw', fontSize: 'max(6px,1.9cqw)', padding: '0.8cqw 1.4cqw' }}>
          {game.dayName} · DAY {game.day}/{MAX_DAYS} - {game.timeLabel}
        </div>
        <div className="flex" style={{ gap: '1cqw', marginTop: '1.2cqw' }}>
          <button className="hbtn" aria-label="Journal" style={{ position: 'relative' }} onPointerDown={(e) => { e.preventDefault(); game.openJournal(); }}>📖
            {game.ex.quests.some((q) => !q.done) && <i style={{ position: 'absolute', right: '-0.4cqw', top: '-0.4cqw', width: '2.4cqw', height: '2.4cqw', borderRadius: '50%', background: '#e0243c', border: '0.4cqw solid #fff' }} />}
          </button>
          <button className="hbtn" aria-label="Ken catalog" onPointerDown={(e) => { e.preventDefault(); game.openRoster(); }}>💞</button>
          <button className="hbtn" aria-label="Sound" onPointerDown={(e) => { e.preventDefault(); audio.init(); audio.setMuted(!audio.muted); game.emit(); }}>{audio.muted ? '🔇' : '🔊'}</button>
          <button className="hbtn" aria-label="Pause" onPointerDown={(e) => { e.preventDefault(); game.togglePause(); }}>⏸</button>
        </div>
      </div>
    </div>
  );
}
export const Hud = memo(HudInner, () => false);
