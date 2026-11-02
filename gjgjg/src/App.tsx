import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Game } from './game/engine';
import { audio } from './game/audio';
import { Hud } from './ui/Hud';
import { Controls } from './ui/Controls';
import { DialogueBox } from './ui/Dialogue';
import { Wardrobe } from './ui/Wardrobe';
import { Roster } from './ui/Roster';
import { Pause, GameOver, NightCard, Cutscene } from './ui/Screens';
import { Home } from './ui/Home';
import { Journal } from './ui/Journal';
import { FishingUI, DanceUI } from './ui/MiniUI';

const noopSub = () => () => { /* noop */ };
const zero = () => 0;
const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game | null>(null);
  useSyncExternalStore(game ? game.subscribe : noopSub, game ? game.getVersion : zero);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const g = new Game(cv);
    setGame(g);
    (window as unknown as { __game: Game }).__game = g;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      g.update(dt);
      g.render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const GAME_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);
    const isInput = (e: KeyboardEvent) => { const t = e.target as HTMLElement | null; return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'); };
    const kd = (e: KeyboardEvent) => {
      if (isInput(e)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      audio.init();
      if (g.mode === 'cutscene') return;
      g.keyDown(e.code, e.repeat);
    };
    const ku = (e: KeyboardEvent) => { if (!isInput(e)) g.keyUp(e.code); };
    const blur = () => { g.keys.clear(); g.input.ax = 0; g.input.ay = 0; if (g.mode === 'play') g.togglePause(); };
    const vis = () => { if (document.hidden && g.mode === 'play') g.togglePause(); };
    const unload = () => { if (g.mode !== 'title') g.save(); };
    window.addEventListener('beforeunload', unload);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', vis);
    const ctx = (e: Event) => e.preventDefault();
    window.addEventListener('contextmenu', ctx);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('beforeunload', unload);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('contextmenu', ctx);
    };
  }, []);

  const mode = game?.mode;
  const showHud = game && mode !== 'title' && mode !== 'gameover' && mode !== 'dance';
  const prompt = game?.prompt || '';
  return (
    <div className="stage">
      <div className="phone">
        <div className="screen">
          <div className="statusbar px">
            <span style={{ fontSize: '2.2cqw' }}>♥ {game ? game.playerName.toUpperCase() : 'BARBIE'}-OS</span>
            <div className="notch"><i /><b /></div>
            <span style={{ fontSize: '2.2cqw' }}>{game ? game.timeLabel : ''} 📶🔋</span>
          </div>
          <div className="gamewrap">
            <canvas ref={canvasRef} />
            {game && showHud && <Hud game={game} />}
            {game && game.popups.map((p) => (
              <div key={p.id} className="popup" style={{ left: `${p.x}%`, top: `${p.y}%`, color: p.color, fontSize: p.big ? 'max(9px,3cqw)' : 'max(7px,2.3cqw)' }}>{p.text}</div>
            ))}
            {game && game.banner && mode === 'play' && (
              <div className="absolute flex justify-center" style={{ left: 0, right: 0, top: '33cqw', zIndex: 11, pointerEvents: 'none' }}>
                <div className="plate px pop-in" style={{ fontSize: 'max(7px,2.2cqw)', background: 'rgba(58,31,90,0.9)', color: '#ffe0f0', borderColor: '#f2c040' }}>📍 {game.banner.text}</div>
              </div>
            )}
            {game && game.toast && (mode === 'play' || mode === 'dialogue' || mode === 'wardrobe' || mode === 'roster' || mode === 'paused' || mode === 'fishing' || mode === 'dance' || mode === 'journal') && (
              <div className="absolute fade-in" style={{ left: '50%', bottom: '14cqw', transform: 'translateX(-50%)', zIndex: 40, width: '92%', textAlign: 'center', pointerEvents: 'none' }}>
                <span className="vt" style={{ display: 'inline-block', fontSize: 'max(13px,4.2cqw)', background: 'rgba(28,15,42,0.92)', border: '0.5cqw solid #f2c040', borderRadius: '1.6cqw', padding: '1cqw 2.4cqw', lineHeight: 1.05, color: '#fff0f6' }}>{game.toast.text}</span>
              </div>
            )}
            {game && mode === 'fishing' && <FishingUI game={game} />}
            {game && mode === 'dance' && <DanceUI game={game} />}
            {game && mode === 'play' && game.hint && (
              <div className="absolute flex justify-center" style={{ left: 0, right: 0, top: '46cqw', zIndex: 11, pointerEvents: 'none' }}>
                <span className="vt bob" style={{ display: 'inline-block', maxWidth: '86%', textAlign: 'center', fontSize: 'max(13px,4cqw)', background: 'rgba(255,240,246,0.95)', color: '#a02a60', border: '0.5cqw solid #d9709a', borderRadius: '1.6cqw', padding: '0.8cqw 2cqw', lineHeight: 1 }}>👋 {game.hint}</span>
              </div>
            )}
            {game && mode === 'play' && prompt && (
              <div className="absolute flex justify-center" style={{ left: 0, right: 0, bottom: '2cqw', zIndex: 12, pointerEvents: 'none' }}>
              <button className="pop-in" style={{ zIndex: 12, pointerEvents: 'auto', background: 'rgba(28,15,42,0.9)', border: '0.5cqw solid #ffe080', color: '#ffe080', borderRadius: '3cqw', padding: '0.8cqw 2.6cqw', cursor: 'pointer' }}
                onPointerDown={(e) => { e.preventDefault(); game.interact(); }}>
                <span className="px" style={{ fontSize: 'max(6px,1.9cqw)' }}>{touch ? 'A' : 'SPACE'} ▸ </span>
                <span className="vt" style={{ fontSize: 'max(13px,4cqw)' }}>{prompt}</span>
              </button>
              </div>
            )}
          </div>
          {game && mode !== 'title' && <Controls game={game} />}

          {game && mode === 'title' && <Home game={game} />}
          {game && mode === 'dialogue' && <DialogueBox game={game} />}
          {game && mode === 'wardrobe' && <Wardrobe game={game} />}
          {game && mode === 'roster' && <Roster game={game} />}
          {game && mode === 'journal' && <Journal game={game} />}
          {game && mode === 'night' && <NightCard game={game} />}
          {game && mode === 'paused' && <Pause game={game} />}
          {game && mode === 'gameover' && <GameOver game={game} />}
          {game && mode === 'cutscene' && <Cutscene key={game.cutscene} game={game} />}
        </div>
      </div>
    </div>
  );
}
