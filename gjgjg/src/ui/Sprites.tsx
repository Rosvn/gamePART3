import { useEffect, useRef } from 'react';
import { drawBarbie, drawKen, type Dir } from '../game/sprites';
import type { Look } from '../game/items';
import { KENS, ROSAN } from '../game/kens';

interface BaseProps { scale?: number; animate?: boolean; className?: string; style?: React.CSSProperties }

function useDraw(w: number, h: number, draw: (c: CanvasRenderingContext2D, t: number) => void, animate: boolean | undefined, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const c = cv.getContext('2d')!;
    const run = (t: number) => { c.clearRect(0, 0, w, h); draw(c, t); };
    run(0);
    if (!animate) return;
    const t0 = performance.now();
    const id = window.setInterval(() => run(performance.now() - t0), 90);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/** Barbie full body (28x34) or head portrait crop (24x20). */
export function BarbieSprite({ look, dir = 'down', frame = 0, scale = 3, crop = 'full', animate, className, style }: BaseProps & { look: Look; dir?: Dir; frame?: number; crop?: 'full' | 'head' }) {
  const w = crop === 'full' ? 28 : 24;
  const h = crop === 'full' ? 36 : 20;
  const fy = crop === 'full' ? 33 : 26;
  const fx = crop === 'full' ? 14 : 12;
  const ref = useDraw(w, h, (c, t) => drawBarbie(c, fx, fy, dir, frame, look, t), animate, [JSON.stringify(look), dir, frame, crop, animate]);
  return <canvas ref={ref} width={w} height={h} className={`pix ${className || ''}`} style={{ width: w * scale, height: h * scale, imageRendering: 'pixelated', ...style }} />;
}

export function KenSprite({ id, dir = 'down', frame = 0, scale = 3, crop = 'full', animate, silhouette, className, style }: BaseProps & { id: number; dir?: Dir; frame?: number; crop?: 'full' | 'head'; silhouette?: boolean }) {
  const w = crop === 'full' ? 28 : 24;
  const h = crop === 'full' ? 36 : 20;
  const fy = crop === 'full' ? 33 : 26;
  const fx = crop === 'full' ? 14 : 12;
  const ref = useDraw(w, h, (c, t) => {
    if (id === ROSAN) {
      const g = c.createRadialGradient(fx, fy - 12, 2, fx, fy - 12, 18);
      g.addColorStop(0, 'rgba(130,245,255,0.6)'); g.addColorStop(1, 'rgba(120,200,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
    drawKen(c, fx, fy, dir, animate && crop === 'full' ? Math.floor(t / 150) % 4 : frame, KENS[id].look, t);
  }, animate, [id, dir, frame, crop, animate]);
  return (
    <canvas
      ref={ref} width={w} height={h} className={`pix ${className || ''}`}
      style={{ width: w * scale, height: h * scale, imageRendering: 'pixelated', filter: silhouette ? 'brightness(0) opacity(0.55)' : undefined, ...style }}
    />
  );
}
