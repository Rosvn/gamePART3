import { memo, useRef, useState } from 'react';
import type { Game } from '../game/engine';
import { audio } from '../game/audio';

function tri(dir: 'u' | 'd' | 'l' | 'r', on: boolean): React.CSSProperties {
  const c = '#8a3a68';
  const s = { 'u': { left: '15.2cqw', top: '2.6cqw', borderWidth: '0 2.8cqw 4.4cqw 2.8cqw', borderColor: `transparent transparent ${c} transparent` },
    'd': { left: '15.2cqw', bottom: '2.6cqw', borderWidth: '4.4cqw 2.8cqw 0 2.8cqw', borderColor: `${c} transparent transparent transparent` },
    'l': { left: '2.6cqw', top: '15.2cqw', borderWidth: '2.8cqw 4.4cqw 2.8cqw 0', borderColor: `transparent ${c} transparent transparent` },
    'r': { right: '2.6cqw', top: '15.2cqw', borderWidth: '2.8cqw 0 2.8cqw 4.4cqw', borderColor: `transparent transparent transparent ${c}` } }[dir];
  void on;
  return s as React.CSSProperties;
}

function ControlsInner({ game }: { game: Game }) {
  const padRef = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);
  const [v, setV] = useState({ x: 0, y: 0 });
  const [down, setDown] = useState('');

  const upd = (e: React.PointerEvent) => {
    const el = padRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const m = Math.hypot(dx, dy);
    const dead = 0.16;
    let ax = 0, ay = 0;
    if (m > dead) { const k = Math.min(1, (m - dead) / 0.5) / m; ax = dx * k; ay = dy * k; }
    game.input.ax = ax; game.input.ay = ay;
    setV({ x: ax, y: ay });
  };
  const release = () => { active.current = null; game.input.ax = 0; game.input.ay = 0; setV({ x: 0, y: 0 }); };

  const press = (id: string, fn: () => void) => (e: React.PointerEvent) => {
    e.preventDefault();
    audio.init();
    setDown(id);
    window.setTimeout(() => setDown(''), 120);
    fn();
  };

  const canNight = game.minutes >= 1200;
  const fs = game.fish?.stage;
  const aLabel = game.mode === 'fishing' ? (fs === 'ready' ? 'CAST' : fs === 'wait' ? 'PULL' : fs === 'bite' ? 'HOOK!' : fs === 'fight' ? 'REEL' : 'AGAIN') : game.mode === 'dance' ? 'DANCE' : game.target?.type === 'star' ? 'GRAB' : 'TALK';
  const T = 0.3;
  return (
    <div className="controls">
      <div
        ref={padRef} className="dpad"
        onPointerDown={(e) => { e.preventDefault(); audio.init(); active.current = e.pointerId; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); upd(e); }}
        onPointerMove={(e) => { if (active.current === e.pointerId) upd(e); }}
        onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="arm h" /><div className="arm v" />
        <div className="cap"><div className="nub" style={{ transform: `translate(${v.x * 3}cqw, ${v.y * 3}cqw)` }} /></div>
        <div className={`tri ${v.y < -T ? 'on' : ''}`} style={tri('u', v.y < -T)} />
        <div className={`tri ${v.y > T ? 'on' : ''}`} style={tri('d', v.y > T)} />
        <div className={`tri ${v.x < -T ? 'on' : ''}`} style={tri('l', v.x < -T)} />
        <div className={`tri ${v.x > T ? 'on' : ''}`} style={tri('r', v.x > T)} />
      </div>

      <button className={`bigA ${down === 'A' ? 'down' : ''} ${game.target || game.mode === 'fishing' ? 'ready' : ''}`} onPointerDown={press('A', () => game.actionDown())}
        onPointerUp={() => game.actionUp()} onPointerLeave={() => game.actionUp()} onPointerCancel={() => game.actionUp()} aria-label="Interact">
        A<small>{aLabel}</small>
      </button>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(2, auto)', gap: '1.6cqw 2.4cqw' }}>
        <button className={`abtn ${down === 'dress' ? 'down' : ''}`} onPointerDown={press('dress', () => game.openWardrobe('dress'))}>
          <div className="orb">👗</div><span>DRESS-UP</span>
        </button>
        <button className={`abtn ${down === 'hm' ? 'down' : ''}`} onPointerDown={press('hm', () => game.openWardrobe('hm'))}>
          <div className="orb">💄</div><span>HAIR/MAKEUP</span>
        </button>
        <button className={`abtn ${down === 'hair' ? 'down' : ''}`} onPointerDown={press('hair', () => game.openWardrobe('hair'))}>
          <div className="orb">💇‍♀️</div><span>HAIR</span>
        </button>
        <button className={`abtn night ${canNight ? '' : 'off'} ${down === 'night' ? 'down' : ''}`} onPointerDown={press('night', () => game.nightlyButton())}>
          <div className="orb">🌙</div><span>NIGHTLY CHOICE</span>
        </button>
      </div>
    </div>
  );
}
export const Controls = memo(ControlsInner, () => false);
