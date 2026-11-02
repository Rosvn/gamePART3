import { useEffect, useState } from 'react';
import type { Game } from '../game/engine';
import { KENS, ROSAN } from '../game/kens';
import { STAT_LABEL } from '../game/items';
import { audio } from '../game/audio';
import { KenSprite } from './Sprites';

function useTypewriter(text: string, rev: number, voice: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i % 2 === 0) audio.play('blip', voice + Math.random() * 70);
      if (i >= text.length) window.clearInterval(id);
    }, 24);
    return () => window.clearInterval(id);
  }, [text, rev, voice]);
  return [n, () => setN(text.length)] as const;
}

export function DialogueBox({ game }: { game: Game }) {
  const d = game.dlg;
  const k = d ? KENS[d.ken] : KENS[0];
  const ks = game.kens[d ? d.ken : 0];
  const [n, skip] = useTypewriter(d?.text || '', d?.rev || 0, k.voice);
  if (!d) return null;
  const done = n >= d.text.length;
  const hearts = Math.floor(ks.morale);
  return (
    <div className="overlay flex flex-col justify-end slide-up" style={{ background: 'linear-gradient(180deg, rgba(10,5,16,0) 20%, rgba(10,5,16,0.55) 100%)' }}>
      <div style={{ padding: '2cqw', paddingBottom: '3cqw' }}>
        <div className="flex items-end" style={{ gap: '2cqw', marginBottom: '-1cqw', position: 'relative', zIndex: 2 }}>
          <div className="pcard flex items-center justify-center" style={{ width: '24cqw', height: '27cqw', background: d.ken === ROSAN ? 'linear-gradient(180deg,#1c2a4a,#0c0e18)' : 'linear-gradient(180deg,#ffe0ec,#f6b0cc)', overflow: 'hidden' }}>
            <KenSprite id={d.ken} crop="head" scale={0.95 * 1} animate style={{ width: '120%', height: 'auto', marginTop: '3cqw' }} />
          </div>
          <div className="flex flex-col" style={{ gap: '1cqw', paddingBottom: '2cqw', minWidth: 0 }}>
            <div className="plate px" style={{ fontSize: 'max(7px,2.4cqw)' }}>{k.name}</div>
            {d.kind === 'ken' && (
              <div className="flex items-center flex-wrap" style={{ gap: '1cqw' }}>
                <span className="plate" style={{ padding: '0.4cqw 1.2cqw', fontSize: 'max(11px,3.4cqw)', letterSpacing: 1 }}>
                  {Array.from({ length: 10 }, (_, i) => (i < hearts ? '❤️' : '🤍')).join('')}
                </span>
                {ks.raag && <span className="badge px" style={{ background: '#d02a3a', color: '#fff' }}>RAAG &gt;_&lt;</span>}
                <span className="badge px" style={{ background: '#fff', color: '#7a3a5a' }}>x{k.mult}</span>
              </div>
            )}
            {d.check && (
              <span className="badge px" style={{ background: d.check.pass ? '#58c878' : '#e0607a', color: '#fff' }}>
                {d.check.pass ? '✔' : '✖'} {STAT_LABEL[d.check.stat]} {d.check.have}/{d.check.need}
              </span>
            )}
          </div>
        </div>
        <div className="pcard" style={{ padding: '3cqw 3.2cqw 2.4cqw' }}>
          <div
            className="vt" onPointerDown={() => { if (!done) skip(); }}
            style={{ fontSize: 'max(15px,5cqw)', lineHeight: 1.02, minHeight: '14cqw', whiteSpace: 'pre-wrap' }}
          >
            {d.text.slice(0, n)}
            {!done && <span className="blink">▌</span>}
          </div>
          <div className="scroll-y" style={{ maxHeight: '38cqw', opacity: done ? 1 : 0.35 }}>
            {d.opts.map((o, i) => (
              <button
                key={i + d.node + d.rev} className={`opt ${i === game.dlgSel ? 'sel' : ''} ${o.locked ? 'locked' : ''}`}
                onPointerEnter={() => { if (game.dlgSel !== i) { game.dlgSel = i; } }}
                onPointerDown={(e) => { e.preventDefault(); if (!done) { skip(); return; } game.chooseOption(i); }}
              >
                {i + 1}. {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
