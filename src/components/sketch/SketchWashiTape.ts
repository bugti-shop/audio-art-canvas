// SketchWashiTape.ts — Washi tape patterns, rendering, and helpers
import type { WashiTapeData } from './SketchTypes';

// --- Washi tape pattern interface ---

export interface WashiTapePattern {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

// --- Washi tape patterns ---

export const WASHI_PATTERNS: WashiTapePattern[] = [
  {
    id: 'solid-pink', name: 'Rose Quartz', color: '#f9a8d4', bgColor: '#fbcfe8',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#fce7f3'); grad.addColorStop(0.3, '#fbcfe8');
      grad.addColorStop(0.7, '#f9a8d4'); grad.addColorStop(1, '#fce7f3');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.08;
      for (let i = 0; i < w * h * 0.02; i++) {
        const fx = Math.random() * w, fy = Math.random() * h;
        const fl = 2 + Math.random() * 6;
        const fa = Math.random() * Math.PI;
        ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 0.3;
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(fa) * fl, fy + Math.sin(fa) * fl); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const shimmer = ctx.createLinearGradient(0, 0, w * 0.5, 0);
      shimmer.addColorStop(0, 'rgba(255,255,255,0)'); shimmer.addColorStop(0.5, 'rgba(255,255,255,0.12)');
      shimmer.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shimmer; ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: 'solid-mint', name: 'Jade Mint', color: '#6ee7b7', bgColor: '#a7f3d0',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w * 0.7, h);
      grad.addColorStop(0, '#d1fae5'); grad.addColorStop(0.4, '#a7f3d0');
      grad.addColorStop(0.8, '#6ee7b7'); grad.addColorStop(1, '#d1fae5');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = '#059669'; ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 4) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.globalAlpha = 1;
    },
  },
  {
    id: 'solid-lavender', name: 'Amethyst', color: '#c4b5fd', bgColor: '#ddd6fe',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h * 0.8);
      grad.addColorStop(0, '#ede9fe'); grad.addColorStop(0.35, '#ddd6fe');
      grad.addColorStop(0.65, '#c4b5fd'); grad.addColorStop(1, '#ede9fe');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < Math.min(w * h * 0.003, 60); i++) {
        const sx = Math.random() * w, sy = Math.random() * h, sr = 0.5 + Math.random() * 1.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    id: 'solid-peach', name: 'Sunset Peach', color: '#fdba74', bgColor: '#fed7aa',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#fff7ed'); grad.addColorStop(0.3, '#fed7aa');
      grad.addColorStop(0.6, '#fdba74'); grad.addColorStop(1, '#fbbf24');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.08;
      for (let i = 0; i < 5; i++) {
        const gx = Math.random() * w, gy = Math.random() * h, gr = 4 + Math.random() * 8;
        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        glow.addColorStop(0, '#ffffff'); glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow; ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    id: 'stripes-blue', name: 'Ocean Stripes', color: '#93c5fd', bgColor: '#bfdbfe',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#dbeafe'); grad.addColorStop(0.5, '#bfdbfe'); grad.addColorStop(1, '#93c5fd');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      for (let x = -h * 2; x < w + h * 2; x += 8) {
        const stripeGrad = ctx.createLinearGradient(x, 0, x + h, h);
        stripeGrad.addColorStop(0, '#3b82f6'); stripeGrad.addColorStop(0.5, '#60a5fa'); stripeGrad.addColorStop(1, '#3b82f6');
        ctx.strokeStyle = stripeGrad;
        ctx.globalAlpha = 0.45;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const shine = ctx.createLinearGradient(0, 0, 0, h * 0.3);
      shine.addColorStop(0, 'rgba(255,255,255,0.2)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine; ctx.fillRect(0, 0, w, h * 0.3);
    },
  },
  {
    id: 'stripes-red', name: 'Cherry Stripes', color: '#fca5a5', bgColor: '#fecaca',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#fee2e2'); grad.addColorStop(0.5, '#fecaca'); grad.addColorStop(1, '#fca5a5');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round'; ctx.lineWidth = 2.5;
      for (let x = -h * 2; x < w + h * 2; x += 7) {
        const stripeGrad = ctx.createLinearGradient(x, 0, x + h, h);
        stripeGrad.addColorStop(0, '#ef4444'); stripeGrad.addColorStop(0.5, '#f87171'); stripeGrad.addColorStop(1, '#ef4444');
        ctx.strokeStyle = stripeGrad;
        ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const shine = ctx.createLinearGradient(0, 0, 0, h * 0.25);
      shine.addColorStop(0, 'rgba(255,255,255,0.18)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine; ctx.fillRect(0, 0, w, h * 0.25);
    },
  },
  {
    id: 'polka-yellow', name: 'Gold Dots', color: '#fde047', bgColor: '#fef9c3',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#fefce8'); grad.addColorStop(0.5, '#fef9c3'); grad.addColorStop(1, '#fde68a');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      for (let x = 6; x < w; x += 12) {
        for (let y = 4; y < h; y += 12) {
          const ox = Math.floor(y / 12) % 2 ? 6 : 0;
          const dx = x + ox, dy = y;
          ctx.globalAlpha = 0.08; ctx.fillStyle = '#92400e';
          ctx.beginPath(); ctx.arc(dx + 0.5, dy + 0.8, 3, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.85;
          const dotGrad = ctx.createRadialGradient(dx - 0.8, dy - 0.8, 0.5, dx, dy, 3);
          dotGrad.addColorStop(0, '#fef08a'); dotGrad.addColorStop(0.6, '#facc15'); dotGrad.addColorStop(1, '#eab308');
          ctx.fillStyle = dotGrad;
          ctx.beginPath(); ctx.arc(dx, dy, 2.8, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.5; ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(dx - 1, dy - 1, 0.8, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    id: 'polka-green', name: 'Emerald Dots', color: '#86efac', bgColor: '#bbf7d0',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w * 0.5, h);
      grad.addColorStop(0, '#ecfdf5'); grad.addColorStop(0.5, '#d1fae5'); grad.addColorStop(1, '#bbf7d0');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      for (let x = 5; x < w; x += 10) {
        for (let y = 5; y < h; y += 10) {
          ctx.globalAlpha = 0.06; ctx.fillStyle = '#064e3b';
          ctx.beginPath(); ctx.arc(x + 0.4, y + 0.6, 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.8;
          const dg = ctx.createRadialGradient(x - 0.5, y - 0.5, 0.3, x, y, 2.5);
          dg.addColorStop(0, '#86efac'); dg.addColorStop(0.7, '#4ade80'); dg.addColorStop(1, '#22c55e');
          ctx.fillStyle = dg;
          ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.45; ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(x - 0.7, y - 0.7, 0.6, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    id: 'floral-pink', name: 'Cherry Blossom', color: '#f9a8d4', bgColor: '#fce7f3',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#fdf2f8'); grad.addColorStop(0.5, '#fce7f3'); grad.addColorStop(1, '#fbcfe8');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      for (let x = 8; x < w; x += 18) {
        for (let y = 7; y < h; y += 16) {
          const ox = Math.floor(y / 16) % 2 ? 9 : 0;
          const fx = x + ox, fy = y;
          ctx.globalAlpha = 0.05; ctx.fillStyle = '#831843';
          ctx.beginPath(); ctx.arc(fx + 0.5, fy + 1, 5, 0, Math.PI * 2); ctx.fill();
          for (let a = 0; a < 5; a++) {
            const ang = (a / 5) * Math.PI * 2 - Math.PI / 2;
            const px = fx + Math.cos(ang) * 3.5, py = fy + Math.sin(ang) * 3.5;
            ctx.globalAlpha = 0.75;
            const pg = ctx.createRadialGradient(px, py, 0, px, py, 2.5);
            pg.addColorStop(0, '#fce7f3'); pg.addColorStop(0.5, '#f9a8d4'); pg.addColorStop(1, '#ec4899');
            ctx.fillStyle = pg;
            ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
          }
          ctx.globalAlpha = 0.9;
          const cg = ctx.createRadialGradient(fx, fy, 0, fx, fy, 2);
          cg.addColorStop(0, '#fef3c7'); cg.addColorStop(0.6, '#fbbf24'); cg.addColorStop(1, '#f59e0b');
          ctx.fillStyle = cg;
          ctx.beginPath(); ctx.arc(fx, fy, 1.8, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.6; ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(fx - 0.4, fy - 0.4, 0.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    id: 'checker-purple', name: 'Royal Checker', color: '#c084fc', bgColor: '#e9d5ff',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#f5f3ff'); grad.addColorStop(0.5, '#ede9fe'); grad.addColorStop(1, '#ddd6fe');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      const s = 7;
      for (let x = 0; x < w; x += s) {
        for (let y = 0; y < h; y += s) {
          if ((Math.floor(x / s) + Math.floor(y / s)) % 2 === 0) {
            const cg = ctx.createLinearGradient(x, y, x + s, y + s);
            cg.addColorStop(0, '#c4b5fd'); cg.addColorStop(1, '#a78bfa');
            ctx.globalAlpha = 0.55; ctx.fillStyle = cg; ctx.fillRect(x, y, s, s);
          }
        }
      }
      ctx.globalAlpha = 1;
      const glass = ctx.createLinearGradient(0, 0, 0, h * 0.4);
      glass.addColorStop(0, 'rgba(255,255,255,0.15)'); glass.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glass; ctx.fillRect(0, 0, w, h * 0.4);
    },
  },
  {
    id: 'galaxy', name: 'Galaxy', color: '#6366f1', bgColor: '#312e81',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0f0a2e'); grad.addColorStop(0.25, '#1e1b4b');
      grad.addColorStop(0.5, '#312e81'); grad.addColorStop(0.75, '#3730a3'); grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 6; i++) {
        const nx = Math.random() * w, ny = Math.random() * h, nr = 8 + Math.random() * 15;
        const nebula = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        const colors = ['#a78bfa', '#c084fc', '#818cf8', '#f472b6', '#38bdf8'];
        nebula.addColorStop(0, colors[i % colors.length]); nebula.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = nebula; ctx.fillRect(nx - nr, ny - nr, nr * 2, nr * 2);
      }
      for (let i = 0; i < Math.min(w * h * 0.008, 120); i++) {
        const sx = Math.random() * w, sy = Math.random() * h;
        const sr = 0.3 + Math.random() * 1.2;
        ctx.globalAlpha = 0.5 + Math.random() * 0.5;
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
        sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.4, '#e0e7ff'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 0.35; ctx.strokeStyle = '#e0e7ff'; ctx.lineWidth = 0.4;
      for (let i = 0; i < 8; i++) {
        const fx = Math.random() * w, fy = Math.random() * h, fl = 2 + Math.random() * 4;
        ctx.beginPath(); ctx.moveTo(fx - fl, fy); ctx.lineTo(fx + fl, fy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(fx, fy - fl); ctx.lineTo(fx, fy + fl); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const shimmer = ctx.createLinearGradient(0, 0, w * 0.6, h * 0.3);
      shimmer.addColorStop(0, 'rgba(139,92,246,0.12)'); shimmer.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shimmer; ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: 'watercolor-splash', name: 'Watercolor Splash', color: '#67e8f9', bgColor: '#ecfeff',
    draw: (ctx, w, h) => {
      const base = ctx.createLinearGradient(0, 0, w, h);
      base.addColorStop(0, '#f0fdfa'); base.addColorStop(0.5, '#ecfeff'); base.addColorStop(1, '#f0f9ff');
      ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.04;
      for (let i = 0; i < w * h * 0.015; i++) { const gx = Math.random() * w, gy = Math.random() * h; ctx.fillStyle = '#334155'; ctx.fillRect(gx, gy, 1, 1); }
      const splashColors = [
        { c: '#22d3ee', a: 0.25 }, { c: '#a78bfa', a: 0.2 }, { c: '#fb923c', a: 0.18 },
        { c: '#34d399', a: 0.22 }, { c: '#f472b6', a: 0.2 }, { c: '#60a5fa', a: 0.18 },
      ];
      for (const splash of splashColors) {
        const bx = Math.random() * w, by = Math.random() * h;
        const br = 6 + Math.random() * 12;
        ctx.globalAlpha = splash.a;
        const bg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        bg.addColorStop(0, splash.c); bg.addColorStop(0.6, splash.c + '88'); bg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = splash.a * 0.4;
        for (let d = 0; d < 4; d++) {
          const dx = bx + (Math.random() - 0.5) * br * 1.5;
          const dy = by + (Math.random() - 0.5) * br * 1.2;
          const dr = 2 + Math.random() * 5;
          const dg = ctx.createRadialGradient(dx, dy, 0, dx, dy, dr);
          dg.addColorStop(0, splash.c + 'aa'); dg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(dx, dy, dr, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      const shine = ctx.createLinearGradient(0, 0, 0, h * 0.35);
      shine.addColorStop(0, 'rgba(255,255,255,0.15)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine; ctx.fillRect(0, 0, w, h * 0.35);
    },
  },
  {
    id: 'gold-foil', name: 'Gold Foil', color: '#fbbf24', bgColor: '#fef3c7',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#fef9c3'); grad.addColorStop(0.2, '#fde68a'); grad.addColorStop(0.4, '#fbbf24');
      grad.addColorStop(0.6, '#f59e0b'); grad.addColorStop(0.8, '#fbbf24'); grad.addColorStop(1, '#fde68a');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.12; ctx.strokeStyle = '#92400e'; ctx.lineWidth = 0.3;
      for (let i = 0; i < 40; i++) {
        const sy = Math.random() * h;
        ctx.beginPath(); ctx.moveTo(0, sy);
        ctx.bezierCurveTo(w * 0.3, sy + (Math.random() - 0.5) * 3, w * 0.7, sy + (Math.random() - 0.5) * 3, w, sy);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.06;
      for (let i = 0; i < w * h * 0.01; i++) {
        const cx = Math.random() * w, cy = Math.random() * h;
        const cl = 1 + Math.random() * 4; const ca = Math.random() * Math.PI;
        ctx.strokeStyle = Math.random() > 0.5 ? '#ffffff' : '#78350f'; ctx.lineWidth = 0.3;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ca) * cl, cy + Math.sin(ca) * cl); ctx.stroke();
      }
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < 10; i++) {
        const hx = Math.random() * w, hy = Math.random() * h, hr = 1 + Math.random() * 4;
        const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
        hg.addColorStop(0, '#ffffff'); hg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      const glass = ctx.createLinearGradient(0, 0, w * 0.8, h * 0.3);
      glass.addColorStop(0, 'rgba(255,255,255,0.3)'); glass.addColorStop(0.5, 'rgba(255,255,255,0.08)');
      glass.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glass; ctx.fillRect(0, 0, w, h * 0.4);
    },
  },
  {
    id: 'sakura-leaves', name: 'Sakura Leaves', color: '#fda4af', bgColor: '#fff1f2',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#fff1f2'); grad.addColorStop(0.4, '#ffe4e6'); grad.addColorStop(0.7, '#fecdd3'); grad.addColorStop(1, '#fff1f2');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < Math.min(w * h * 0.004, 50); i++) {
        const px = Math.random() * w, py = Math.random() * h;
        const angle = Math.random() * Math.PI * 2;
        const size = 2 + Math.random() * 3;
        ctx.save(); ctx.translate(px, py); ctx.rotate(angle);
        ctx.globalAlpha = 0.5 + Math.random() * 0.3;
        const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        pg.addColorStop(0, '#fecdd3'); pg.addColorStop(0.5, '#fda4af'); pg.addColorStop(1, '#fb7185');
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.bezierCurveTo(size * 0.8, -size * 0.6, size * 0.8, size * 0.6, 0, size * 0.5);
        ctx.bezierCurveTo(-size * 0.8, size * 0.6, -size * 0.8, -size * 0.6, 0, -size);
        ctx.fill();
        ctx.globalAlpha = 0.3; ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(-size * 0.2, -size * 0.3, size * 0.25, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 0.06; ctx.strokeStyle = '#9f1239'; ctx.lineWidth = 0.3;
      for (let i = 0; i < 15; i++) {
        const lx = Math.random() * w, ly = Math.random() * h;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + (Math.random() - 0.5) * 4, ly + 3); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const light = ctx.createLinearGradient(0, 0, 0, h * 0.3);
      light.addColorStop(0, 'rgba(255,255,255,0.18)'); light.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = light; ctx.fillRect(0, 0, w, h * 0.3);
    },
  },
  {
    id: 'rainbow-gradient', name: 'Rainbow Gradient', color: '#f472b6', bgColor: '#fdf2f8',
    draw: (ctx, w, h) => {
      const rainbow = ctx.createLinearGradient(0, 0, w, 0);
      rainbow.addColorStop(0, '#ef4444'); rainbow.addColorStop(0.17, '#f97316'); rainbow.addColorStop(0.33, '#eab308');
      rainbow.addColorStop(0.5, '#22c55e'); rainbow.addColorStop(0.67, '#3b82f6'); rainbow.addColorStop(0.83, '#8b5cf6');
      rainbow.addColorStop(1, '#ec4899');
      ctx.fillStyle = rainbow; ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.05;
      for (let i = 0; i < w * h * 0.012; i++) {
        const fx = Math.random() * w, fy = Math.random() * h;
        const fl = 2 + Math.random() * 5; const fa = Math.random() * Math.PI;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.4;
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(fa) * fl, fy + Math.sin(fa) * fl); ctx.stroke();
      }
      ctx.globalAlpha = 0.08;
      for (let x = 0; x < w; x += 12) {
        const band = ctx.createLinearGradient(x, 0, x + 6, 0);
        band.addColorStop(0, 'rgba(255,255,255,0)'); band.addColorStop(0.5, 'rgba(255,255,255,0.3)'); band.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = band; ctx.fillRect(x, 0, 6, h);
      }
      ctx.globalAlpha = 1;
      const glass = ctx.createLinearGradient(0, 0, 0, h * 0.35);
      glass.addColorStop(0, 'rgba(255,255,255,0.22)'); glass.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glass; ctx.fillRect(0, 0, w, h * 0.35);
    },
  },
  {
    id: 'polka-red', name: 'Red Polka', color: '#ef4444', bgColor: '#dc2626',
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#dc2626'; ctx.fillRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(0.5, 'rgba(0,0,0,0.05)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      for (let x = 5; x < w; x += 10) {
        for (let y = 5; y < h; y += 10) {
          const ox = Math.floor(y / 10) % 2 ? 5 : 0;
          ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(x + ox, y, 2.2, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.3; ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(x + ox - 0.6, y - 0.6, 0.7, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      const shine = ctx.createLinearGradient(0, 0, 0, h * 0.3);
      shine.addColorStop(0, 'rgba(255,255,255,0.12)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine; ctx.fillRect(0, 0, w, h * 0.3);
    },
  },
  {
    id: 'stripes-red-diag', name: 'Red Diagonal', color: '#ef4444', bgColor: '#dc2626',
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#dc2626'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 2.5; ctx.lineCap = 'butt';
      ctx.globalAlpha = 0.5;
      for (let x = -h * 2; x < w + h * 2; x += 7) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.2;
      for (let x = -h * 2; x < w + h * 2; x += 7) { ctx.beginPath(); ctx.moveTo(x + 1, 0); ctx.lineTo(x + h + 1, h); ctx.stroke(); }
      ctx.globalAlpha = 1;
      const shine = ctx.createLinearGradient(0, 0, 0, h * 0.25);
      shine.addColorStop(0, 'rgba(255,255,255,0.1)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine; ctx.fillRect(0, 0, w, h * 0.25);
    },
  },
  {
    id: 'grid-red', name: 'Red Grid', color: '#ef4444', bgColor: '#dc2626',
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#dc2626'; ctx.fillRect(0, 0, w, h);
      const spacing = 6;
      ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 1.8; ctx.lineCap = 'butt'; ctx.globalAlpha = 0.5;
      for (let y = 0; y < h; y += spacing) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      for (let x = 0; x < w; x += spacing) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      ctx.globalAlpha = 0.08; ctx.fillStyle = '#ffffff';
      for (let x = 0; x < w; x += spacing) { for (let y = 0; y < h; y += spacing) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); } }
      ctx.globalAlpha = 1;
      const shine = ctx.createLinearGradient(0, 0, 0, h * 0.25);
      shine.addColorStop(0, 'rgba(255,255,255,0.1)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine; ctx.fillRect(0, 0, w, h * 0.25);
    },
  },
  {
    id: 'polka-blue', name: 'Blue Polka', color: '#3b82f6', bgColor: '#2563eb',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#3b82f6'); grad.addColorStop(0.5, '#2563eb'); grad.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      for (let x = 6; x < w; x += 12) {
        for (let y = 4; y < h; y += 12) {
          const ox = Math.floor(y / 12) % 2 ? 6 : 0;
          const dx = x + ox, dy = y;
          ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(dx, dy, 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.4; ctx.fillStyle = '#bfdbfe';
          ctx.beginPath(); ctx.arc(dx - 0.6, dy - 0.6, 0.7, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      const shine = ctx.createLinearGradient(0, 0, 0, h * 0.25);
      shine.addColorStop(0, 'rgba(255,255,255,0.15)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine; ctx.fillRect(0, 0, w, h * 0.25);
    },
  },
  {
    id: 'stripes-green-diag', name: 'Green Diagonal', color: '#22c55e', bgColor: '#16a34a',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#22c55e'); grad.addColorStop(0.5, '#16a34a'); grad.addColorStop(1, '#15803d');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round'; ctx.lineWidth = 3;
      for (let x = -h * 2; x < w + h * 2; x += 8) {
        ctx.strokeStyle = '#15803d'; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const shine = ctx.createLinearGradient(0, 0, 0, h * 0.25);
      shine.addColorStop(0, 'rgba(255,255,255,0.15)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine; ctx.fillRect(0, 0, w, h * 0.25);
    },
  },
  {
    id: 'grid-purple', name: 'Purple Grid', color: '#a855f7', bgColor: '#9333ea',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#a855f7'); grad.addColorStop(0.5, '#9333ea'); grad.addColorStop(1, '#7e22ce');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      const spacing = 6;
      ctx.strokeStyle = '#7e22ce'; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.5;
      for (let y = 0; y < h; y += spacing) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      for (let x = 0; x < w; x += spacing) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      ctx.globalAlpha = 0.08; ctx.fillStyle = '#ffffff';
      for (let x = 0; x < w; x += spacing) { for (let y = 0; y < h; y += spacing) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); } }
      ctx.globalAlpha = 1;
      const shine = ctx.createLinearGradient(0, 0, 0, h * 0.25);
      shine.addColorStop(0, 'rgba(255,255,255,0.12)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine; ctx.fillRect(0, 0, w, h * 0.25);
    },
  },
  {
    id: 'chevron-yellow', name: 'Yellow Chevron', color: '#eab308', bgColor: '#ca8a04',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#fef08a'); grad.addColorStop(0.5, '#facc15'); grad.addColorStop(1, '#eab308');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#a16207'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 0.45;
      const cw = 10, ch = 6;
      for (let x = -cw; x < w + cw; x += cw) {
        for (let y = -ch; y < h + ch; y += ch * 2) {
          const oy = (Math.floor(x / cw) % 2) * ch;
          ctx.beginPath(); ctx.moveTo(x, y + oy); ctx.lineTo(x + cw / 2, y + ch + oy); ctx.lineTo(x + cw, y + oy); ctx.stroke();
        }
      }
      ctx.globalAlpha = 0.2; ctx.strokeStyle = '#fef9c3'; ctx.lineWidth = 0.8;
      for (let x = -cw; x < w + cw; x += cw) {
        for (let y = -ch; y < h + ch; y += ch * 2) {
          const oy = (Math.floor(x / cw) % 2) * ch;
          ctx.beginPath(); ctx.moveTo(x + 1, y + oy + 1); ctx.lineTo(x + cw / 2 + 1, y + ch + oy + 1); ctx.lineTo(x + cw + 1, y + oy + 1); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      const shine = ctx.createLinearGradient(0, 0, 0, h * 0.25);
      shine.addColorStop(0, 'rgba(255,255,255,0.15)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine; ctx.fillRect(0, 0, w, h * 0.25);
    },
  },
  {
    id: 'waves-teal', name: 'Teal Waves', color: '#14b8a6', bgColor: '#0d9488',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#5eead4'); grad.addColorStop(0.5, '#14b8a6'); grad.addColorStop(1, '#0d9488');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#0f766e'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.globalAlpha = 0.5;
      const waveH = 4, waveW = 14;
      for (let y = 3; y < h + waveH; y += waveH * 2) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 1) {
          const yy = y + Math.sin((x / waveW) * Math.PI * 2) * waveH;
          if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = '#99f6e4'; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.3;
      for (let y = 3 + waveH; y < h + waveH; y += waveH * 2) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 1) {
          const yy = y + Math.sin((x / waveW) * Math.PI * 2 + Math.PI * 0.5) * (waveH * 0.6);
          if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const shine = ctx.createLinearGradient(0, 0, 0, h * 0.25);
      shine.addColorStop(0, 'rgba(255,255,255,0.15)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine; ctx.fillRect(0, 0, w, h * 0.25);
    },
  },
  {
    id: 'zigzag-orange', name: 'Orange Zigzag', color: '#f97316', bgColor: '#ea580c',
    draw: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#fdba74'); grad.addColorStop(0.5, '#f97316'); grad.addColorStop(1, '#ea580c');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#9a3412'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 0.45;
      const zw = 8, zh = 5;
      for (let y = zh; y < h; y += zh * 2.5) {
        ctx.beginPath(); ctx.moveTo(0, y);
        for (let x = 0; x < w + zw; x += zw) {
          const peak = (Math.floor(x / zw) % 2 === 0) ? y - zh : y + zh;
          ctx.lineTo(x, peak);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = '#fed7aa'; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.25;
      for (let y = zh; y < h; y += zh * 2.5) {
        ctx.beginPath(); ctx.moveTo(1, y + 1);
        for (let x = 0; x < w + zw; x += zw) {
          const peak = (Math.floor(x / zw) % 2 === 0) ? y - zh + 1 : y + zh + 1;
          ctx.lineTo(x + 1, peak);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const shine = ctx.createLinearGradient(0, 0, 0, h * 0.25);
      shine.addColorStop(0, 'rgba(255,255,255,0.15)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine; ctx.fillRect(0, 0, w, h * 0.25);
    },
  },
];

// --- Washi tape rendering ---

export const washiPatternCache = new Map<string, CanvasPattern | HTMLCanvasElement>();

export const drawTornEdge = (ctx: CanvasRenderingContext2D, x: number, y: number, height: number, direction: 1 | -1) => {
  ctx.beginPath();
  ctx.moveTo(x, y);
  const steps = Math.ceil(height / 4);
  for (let i = 0; i <= steps; i++) {
    const py = y + (i / steps) * height;
    const px = x + direction * (Math.random() * 4 + 1);
    ctx.lineTo(px, py);
  }
  ctx.lineTo(x, y + height);
};

export const drawWashiTape = (ctx: CanvasRenderingContext2D, tape: WashiTapeData, zoom: number, isSelected: boolean) => {
  const pattern = WASHI_PATTERNS.find(p => p.id === tape.patternId) || WASHI_PATTERNS[0];
  ctx.save();
  const cx = tape.x + tape.width / 2;
  const cy = tape.y + tape.height / 2;
  ctx.translate(cx, cy);
  ctx.rotate(tape.rotation);
  ctx.translate(-tape.width / 2, -tape.height / 2);

  // Shadow layer
  ctx.globalAlpha = 0.1;
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#000';
  ctx.fillRect(-1, -1, tape.width + 2, tape.height + 2);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

  // Cached HD pattern
  const legacyCacheKey = `legacy_${pattern.id}_${Math.round(tape.width)}_${Math.round(tape.height)}`;
  let cachedLegacy = washiPatternCache.get(legacyCacheKey) as any;
  if (!cachedLegacy) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = Math.max(4, Math.round(tape.width * 2));
    offCanvas.height = Math.max(4, Math.round(tape.height * 2));
    const offCtx = offCanvas.getContext('2d')!;
    offCtx.scale(2, 2);
    pattern.draw(offCtx, tape.width, tape.height);
    (washiPatternCache as any).set(legacyCacheKey, offCanvas);
    cachedLegacy = offCanvas;
  }

  // Torn edge clipping
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(tape.width, 0);
  const rSteps = Math.ceil(tape.height / 5);
  for (let i = 0; i <= rSteps; i++) {
    const py = (i / rSteps) * tape.height;
    const px = tape.width + (((i * 7 + 3) % 5) - 2) * 1.2;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(0, tape.height);
  for (let i = rSteps; i >= 0; i--) {
    const py = (i / rSteps) * tape.height;
    const px = (((i * 11 + 2) % 5) - 2) * 1.2;
    ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.clip();

  ctx.globalAlpha = tape.opacity;
  ctx.drawImage(cachedLegacy, 0, 0, tape.width, tape.height);

  // Top glossy highlight
  ctx.globalAlpha = 0.12;
  const gloss = ctx.createLinearGradient(0, 0, 0, tape.height * 0.35);
  gloss.addColorStop(0, 'rgba(255,255,255,0.5)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, tape.width, tape.height * 0.35);

  ctx.restore();

  // Selection UI
  if (isSelected) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'hsl(210 100% 50%)';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([6 / zoom, 4 / zoom]);
    ctx.strokeRect(-2 / zoom, -2 / zoom, tape.width + 4 / zoom, tape.height + 4 / zoom);
    ctx.setLineDash([]);
    const hs = 6 / zoom;
    const handles = [
      [0, 0], [tape.width, 0], [0, tape.height], [tape.width, tape.height],
    ];
    for (const [hx, hy] of handles) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'hsl(210 100% 50%)';
      ctx.lineWidth = 1.5 / zoom;
      ctx.beginPath(); ctx.arc(hx, hy, hs, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    const rotX = tape.width / 2;
    const rotY = -20 / zoom;
    ctx.beginPath(); ctx.moveTo(tape.width / 2, 0); ctx.lineTo(rotX, rotY); ctx.strokeStyle = 'hsl(210 100% 50%)'; ctx.lineWidth = 1 / zoom; ctx.stroke();
    ctx.beginPath(); ctx.arc(rotX, rotY, hs * 0.7, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = 'hsl(210 100% 50%)'; ctx.lineWidth = 1.5 / zoom; ctx.stroke();
  }

  ctx.restore();
};
