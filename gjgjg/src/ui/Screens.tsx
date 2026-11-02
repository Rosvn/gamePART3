import { useEffect, useMemo, useRef, useState } from 'react';
import type { Game } from '../game/engine';
import { MAX_DAYS } from '../game/engine';
import { audio } from '../game/audio';
import { KENS, ROSAN, ROSAN_CUTSCENES } from '../game/kens';
import { drawBarbie, drawKen, drawHeart } from '../game/sprites';
import { DEFAULT_LOOK } from '../game/items';
import { KenSprite } from './Sprites';
import { CodesPanel } from './Home';

const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

function ScoreTable({ game, hl = -1, n = 5 }: { game: Game; hl?: number; n?: number }) {
  const list = game.scores.slice(0, n);
  if (!list.length) return <div className="vt" style={{ fontSize: 'max(12px,3.6cqw)', textAlign: 'center', opacity: 0.8 }}>No scores yet — be the first!</div>;
  return (
    <div className="vt" style={{ fontSize: 'max(13px,3.9cqw)', lineHeight: 1.05 }}>
      {list.map((s, i) => (
        <div key={i} className="flex justify-between" style={{ padding: '0.4cqw 1.4cqw', background: i === hl ? '#ffe58a' : i % 2 ? 'rgba(255,255,255,0.06)' : 'transparent', color: i === hl ? '#5a3a00' : undefined, borderRadius: '1cqw' }}>
          <span>{i + 1}. {s.name} <small style={{ opacity: 0.7 }}>· {s.ending} · D{s.days} · {s.kens}K</small></span>
          <b>{s.score.toLocaleString()}</b>
        </div>
      ))}
    </div>
  );
}

export function Title({ game }: { game: Game }) {
  return (
    <div className="overlay flex flex-col justify-between fade-in" style={{ pointerEvents: 'auto' }}>
      <div className="text-center" style={{ padding: '5cqw 3cqw 0', background: 'linear-gradient(180deg, rgba(20,8,34,0.85), rgba(20,8,34,0))', height: '38%' }}>
        <div className="px" style={{ fontSize: 'max(9px,2.6cqw)', color: '#ffd9e6', letterSpacing: 2 }}>★ A PIXEL DATING ADVENTURE ★</div>
        <div className="px glow-text bob" style={{ fontSize: 'max(22px,10cqw)', color: '#ff8ac0', marginTop: '2cqw', textShadow: '0 1cqw 0 #8a2a58, 0 0 4cqw #ff4f9a' }}>BARBIE</div>
        <div className="px" style={{ fontSize: 'max(10px,4.4cqw)', color: '#7af0ff', marginTop: '1.4cqw', textShadow: '0 0.6cqw 0 #1a3a6a' }}>&amp; THE 20 KENS</div>
      </div>
      <div className="text-center flex flex-col items-center" style={{ padding: '2cqw 4cqw 4cqw', background: 'linear-gradient(0deg, rgba(20,8,34,0.95) 60%, rgba(20,8,34,0))', gap: '2.4cqw' }}>
        <button className="pbtn" style={{ fontSize: 'max(10px,3.4cqw)', padding: '3cqw 8cqw' }} onPointerDown={(e) => { e.preventDefault(); game.startFromTitle(); }}>
          <span className="blink">▶</span> START
        </button>
        <div className="pcard" style={{ width: '100%', padding: '1.6cqw 2cqw', background: 'rgba(58,31,90,0.9)', color: '#ffe0f0', borderColor: '#d9709a' }}>
          <div className="px" style={{ fontSize: 'max(6px,1.9cqw)', color: '#ffe080', textAlign: 'center', marginBottom: '1cqw' }}>🏆 HIGH SCORES</div>
          <ScoreTable game={game} />
        </div>
        <div className="vt" style={{ fontSize: 'max(11px,3.2cqw)', color: '#c8a8e0', lineHeight: 1 }}>
          {touch ? 'D-pad to walk · A to talk · tap the orbs for outfits' : 'WASD / Arrows walk · SPACE talk · Q/E/R wardrobe · J journal · N night · P pause · M mute'}
        </div>
      </div>
    </div>
  );
}

export function Pause({ game }: { game: Game }) {
  const [codes, setCodes] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div className="overlay flex items-center justify-center fade-in scroll-y" style={{ background: 'rgba(10,5,16,0.78)' }}>
      <div className="pcard text-center pop-in" style={{ width: '84%', padding: '4cqw', margin: '2cqw 0' }}>
        <div className="px" style={{ fontSize: 'max(12px,4.4cqw)', color: '#d0346a' }}>⏸ PAUSED</div>
        <div className="vt" style={{ fontSize: 'max(13px,4cqw)', lineHeight: 1.05, margin: '2cqw 0' }}>
          👱‍♀️ {game.playerName} · Day {game.day}/{MAX_DAYS} · {game.timeLabel}<br />Charm {game.charm.toLocaleString()} · 💎 {game.gems.toLocaleString()}<br />
          ⭐ Reputation {Math.round(game.rep)} · 🤝 Rosan Trust {game.rosanTrust} · 📸 Scandals {game.scandals}/3<br />
          {game.storyLog.length > 0 && <small style={{ opacity: 0.75 }}>📖 Last choice: {game.storyLog[game.storyLog.length - 1]}<br /></small>}
          <small style={{ opacity: 0.75 }}>Tip: match a Ken's favourite stat for 1.5x rewards, and wear a Masterpiece set for 3x!</small>
        </div>
        {codes ? (
          <div style={{ background: '#3a1f5a', color: '#ffe0f0', borderRadius: '1.6cqw', padding: '2cqw', marginBottom: '2cqw' }}>
            <CodesPanel game={game} live />
            <button className="pbtn alt" style={{ width: '100%', marginTop: '2cqw' }} onPointerDown={(e) => { e.preventDefault(); setCodes(false); }}>◀ BACK</button>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: '2cqw' }}>
            <button className="pbtn" onPointerDown={(e) => { e.preventDefault(); game.togglePause(); }}>▶ RESUME</button>
            <button className="pbtn alt" onPointerDown={(e) => { e.preventDefault(); game.save(); setSaved(true); audio.play('chime'); }}>{saved ? '✔ SAVED!' : `💾 SAVE (SLOT ${game.slot + 1})`}</button>
            <button className="pbtn alt" onPointerDown={(e) => { e.preventDefault(); setCodes(true); }}>🔑 CODES</button>
            <button className="pbtn alt" onPointerDown={(e) => { e.preventDefault(); audio.init(); audio.setMuted(!audio.muted); game.emit(); }}>{audio.muted ? '🔇 SOUND OFF' : '🔊 SOUND ON'}</button>
            <button className="pbtn alt" onPointerDown={(e) => { e.preventDefault(); game.goHome(); }}>🏠 SAVE &amp; HOME MENU</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function GameOver({ game }: { game: Game }) {
  const o = game.over;
  if (!o) return null;
  const scandal = o.reason === 'scandal';
  return (
    <div className="overlay flex items-center justify-center fade-in scroll-y" style={{ background: scandal ? 'rgba(40,6,20,0.9)' : 'rgba(20,8,40,0.9)' }}>
      <div className="pcard text-center pop-in" style={{ width: '88%', padding: '3.4cqw', margin: '2cqw 0' }}>
        <div className="px" style={{ fontSize: 'max(11px,3.9cqw)', color: scandal ? '#d02a3a' : '#d0346a' }}>
          {o.ending.icon} {o.ending.name.toUpperCase()} ENDING
        </div>
        <div className="vt" style={{ fontSize: 'max(13px,3.9cqw)', lineHeight: 1.05, margin: '1.6cqw 0' }}>
          {game.nm(o.ending.text)}<br /><small style={{ opacity: 0.75 }}>{game.playerName} · ⭐ Rep {Math.round(game.rep)} · 🤝 Rosan Trust {game.rosanTrust} · {game.storyLog.length} story choices</small>
        </div>
        <div style={{ background: '#fff', borderRadius: '1.4cqw', padding: '1.4cqw 2cqw', border: '0.5cqw solid #c47a9a' }} className="vt">
          {o.parts.map((p) => (
            <div key={p.label} className="flex justify-between" style={{ fontSize: 'max(12px,3.6cqw)', lineHeight: 1.1 }}><span>{p.label}</span><b>{p.value.toLocaleString()}</b></div>
          ))}
          <div className="flex justify-between px" style={{ fontSize: 'max(8px,2.6cqw)', marginTop: '1cqw', color: '#d0346a' }}><span>FINAL SCORE</span><span>{o.score.toLocaleString()}</span></div>
        </div>
        <div className="px" style={{ fontSize: 'max(6px,1.9cqw)', margin: '1.6cqw 0 0.8cqw', color: '#a02a60' }}>{o.rank === 0 ? '🥇 NEW HIGH SCORE!' : o.rank > 0 ? `RANK #${o.rank + 1}` : 'HIGH SCORES'}</div>
        <div style={{ background: '#3a1f5a', borderRadius: '1.4cqw', padding: '1cqw', color: '#ffe0f0' }}><ScoreTable game={game} hl={o.rank} n={6} /></div>
        <button className="pbtn" style={{ marginTop: '3cqw', width: '100%' }} onPointerDown={(e) => { e.preventDefault(); game.goHome(); }}>🏠 HOME MENU</button>
      </div>
    </div>
  );
}

export function NightCard({ game }: { game: Game }) {
  const c = game.card;
  const hearts = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ l: (i * 37) % 100, d: 3 + (i % 5) * 0.8, dl: (i % 7) * 0.35, e: ['❤️', '💖', '💋', '💗'][i % 4] })), []);
  const confetti = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ l: (i * 29) % 100, d: 3 + (i % 5) * 0.7, dl: (i % 6) * 0.3, e: ['🎉', '✨', '💎', '🎊', '🥂'][i % 5] })), []);
  if (!c) return null;
  const fx = c.fx === 'hearts' ? hearts : c.fx === 'confetti' ? confetti : null;
  const bg = c.tone === 'bad' ? 'linear-gradient(180deg,#3a0a1a,#14050c)' : 'linear-gradient(180deg,#1c1850,#0a0620)';
  return (
    <div className={`overlay flex items-center justify-center fade-in stars ${c.fx === 'anger' ? 'shake' : ''}`} style={{ background: bg, overflow: 'hidden' }}>
      {c.fx === 'flash' && <div className="flashbang" />}
      {fx && fx.map((h, i) => <span key={i} className="rise" style={{ left: `${h.l}%`, animationDuration: `${h.d}s`, animationDelay: `${h.dl}s`, fontSize: '6cqw' }}>{h.e}</span>)}
      {c.fx === 'anger' && Array.from({ length: 8 }, (_, i) => <span key={i} className="rise" style={{ left: `${10 + i * 11}%`, animationDuration: `${2 + i * 0.3}s`, fontSize: '7cqw' }}>💢</span>)}
      <div className="pcard pop-in scroll-y" style={{ width: '90%', maxHeight: '94%', padding: '3.4cqw', position: 'relative', zIndex: 2 }}>
        <div className="flex flex-col items-center">
          {c.ken !== undefined ? <KenSprite id={c.ken} scale={3.4} animate={false} /> : <div style={{ fontSize: '11cqw' }} className="bob">{c.emoji}</div>}
          <div className="px text-center" style={{ fontSize: 'max(10px,3.6cqw)', color: c.tone === 'bad' ? '#d02a3a' : '#d0346a', margin: '1cqw 0' }}>{c.emoji} {c.title}</div>
        </div>
        <div className="vt" style={{ fontSize: 'max(14px,4.4cqw)', lineHeight: 1.05, textAlign: 'center' }}>
          {c.body.map((l, i) => <div key={i} style={{ marginBottom: '1cqw' }}>{l}</div>)}
        </div>
        <div className="scroll-y" style={{ maxHeight: '46cqw' }}>
          {c.opts.map((o, i) => (
            <button key={o.id} className={`opt ${i === game.cardSel ? 'sel' : ''}`} onPointerDown={(e) => { e.preventDefault(); game.cardChoice(o.id); }}>
              {o.label}
              {o.sub && <div style={{ fontSize: 'max(11px,3.2cqw)', opacity: 0.7 }}>{o.sub}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Cutscene({ game }: { game: Game }) {
  const id = game.cutscene || 'dance';
  const scene = ROSAN_CUTSCENES[id];
  const [page, setPage] = useState(0);
  const [n, setN] = useState(0);
  const ref = useRef<HTMLCanvasElement>(null);
  const text = game.nm(scene.pages[page]);

  useEffect(() => {
    setN(0);
    let i = 0;
    const t = window.setInterval(() => { i++; setN(i); if (i % 2 === 0) audio.play('blip', 400 + Math.random() * 50); if (i >= text.length) window.clearInterval(t); }, 28);
    return () => window.clearInterval(t);
  }, [text]);

  const advance = () => {
    if (n < text.length) { setN(text.length); return; }
    if (page + 1 >= scene.pages.length) game.endCutscene(); else { setPage(page + 1); audio.play('select'); }
  };
  const adv = useRef(advance);
  adv.current = advance;
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); adv.current(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    const cv = ref.current!;
    const c = cv.getContext('2d')!;
    c.imageSmoothingEnabled = false;
    const fw: { x: number; y: number; vx: number; vy: number; life: number; col: string }[] = [];
    const hearts: { x: number; y: number; s: number }[] = [];
    let raf = 0;
    const t0 = performance.now();
    let lastBurst = 0;
    const look = { ...DEFAULT_LOOK, ...game.look };
    const loop = (now: number) => {
      const t = now - t0;
      c.clearRect(0, 0, 176, 120);
      const g = c.createLinearGradient(0, 0, 0, 120);
      g.addColorStop(0, '#0a0e30'); g.addColorStop(1, '#5a2a7a');
      c.fillStyle = g; c.fillRect(0, 0, 176, 120);
      for (let i = 0; i < 40; i++) { if (Math.sin(t / 300 + i * 2.1) > -0.3) { c.fillStyle = '#fff'; c.fillRect((i * 53) % 176, (i * 29) % 70, 1, 1); } }
      let x = 0, i = 0;
      while (x < 176) {
        const w = 10 + ((i * 7) % 9), h = 28 + ((i * 13) % 34);
        c.fillStyle = '#14123a'; c.fillRect(x, 96 - h, w, h + 24);
        for (let wy = 96 - h + 3; wy < 110; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) if ((wx * 3 + wy * 7) % 5 > 1) { c.fillStyle = (wx + wy) % 3 ? '#ffe6a0' : '#ff9ad0'; c.fillRect(wx, wy, 2, 2); }
        x += w + 1; i++;
      }
      c.fillStyle = '#2a2040'; c.fillRect(0, 108, 176, 12); c.fillStyle = '#4a3a60'; c.fillRect(0, 108, 176, 2);
      if (id === 'love' && t - lastBurst > 650) {
        lastBurst = t;
        const bx = 20 + Math.random() * 136, by = 14 + Math.random() * 40;
        const col = ['#ff4f9a', '#38e8ff', '#ffd23c', '#7a5aff', '#4aff9a'][Math.floor(Math.random() * 5)];
        for (let k = 0; k < 26; k++) { const a = (k / 26) * 6.28; fw.push({ x: bx, y: by, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30, life: 1.1, col }); }
        audio.play('gem');
      }
      for (let k = fw.length - 1; k >= 0; k--) { const p = fw[k]; p.x += p.vx / 60; p.y += p.vy / 60; p.vy += 0.5; p.life -= 1 / 60; if (p.life <= 0) { fw.splice(k, 1); continue; } c.globalAlpha = Math.min(1, p.life); c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
      c.globalAlpha = 1;
      if (Math.random() < 0.06) hearts.push({ x: 60 + Math.random() * 56, y: 100, s: Math.random() });
      for (let k = hearts.length - 1; k >= 0; k--) { const hh = hearts[k]; hh.y -= 0.5; hh.x += Math.sin(hh.y / 6 + hh.s * 6) * 0.3; if (hh.y < 20) { hearts.splice(k, 1); continue; } drawHeart(c, hh.x, hh.y, '#ff6aa8'); }
      c.save(); c.scale(3, 3);
      const sway = id === 'dance' ? Math.sin(t / 500) * 1.2 : 0;
      const gl = c.createRadialGradient(34 + sway, 24, 2, 34 + sway, 24, 20);
      gl.addColorStop(0, 'rgba(130,245,255,0.7)'); gl.addColorStop(1, 'rgba(120,200,255,0)');
      c.fillStyle = gl; c.fillRect(10, 5, 50, 36);
      const fr = id === 'dance' ? (Math.floor(t / 400) % 2) * 2 : 0;
      drawBarbie(c, 23 + sway, 38, 'right', fr, look, t);
      drawKen(c, 35 + sway, 38, 'left', fr, KENS[ROSAN].look, t);
      c.restore();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [id]);

  return (
    <div className="overlay flex flex-col fade-in" style={{ background: '#0a0510' }} onPointerDown={advance}>
      <div className="px text-center" style={{ fontSize: 'max(9px,3cqw)', color: '#ff8ac0', padding: '3cqw' }}>💖 {scene.title}</div>
      <canvas ref={ref} width={176} height={120} className="pix" style={{ width: '100%', imageRendering: 'pixelated' }} />
      <div className="pcard flex-1" style={{ margin: '3cqw', padding: '3cqw' }}>
        <div className="vt" style={{ fontSize: 'max(15px,4.8cqw)', lineHeight: 1.05 }}>{text.slice(0, n)}{n < text.length && <span className="blink">▌</span>}</div>
        <div className="px blink text-right" style={{ fontSize: 'max(6px,2cqw)', color: '#d0346a', marginTop: '2cqw' }}>{page + 1 >= scene.pages.length && n >= text.length ? 'TAP ▶ FINISH' : 'TAP ▶'}</div>
      </div>
    </div>
  );
}
