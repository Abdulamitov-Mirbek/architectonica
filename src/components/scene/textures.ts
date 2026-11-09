import * as THREE from 'three';

/* Procedural canvas textures. Each texture represents a known real-world size,
   so geometry can use metre-based UVs (see worldUV in House.tsx). */

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function finish(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const pick = <T,>(r: () => number, a: readonly T[]) => a[Math.floor(r() * a.length)];

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, colors: string[], min: number, max: number, r: () => number, alpha = 1) {
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = alpha * (0.5 + r() * 0.5);
    ctx.fillStyle = pick(r, colors);
    const s = min + r() * (max - min);
    ctx.beginPath();
    ctx.ellipse(r() * w, r() * h, s, s * (0.6 + r() * 0.5), r() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** White plaster with stone chips, like the built facade. 1.5 m tile. */
export function terrazzo() {
  const r = rng(11);
  const [c, x] = canvas(512);
  x.fillStyle = '#e7e6e2';
  x.fillRect(0, 0, 512, 512);
  speckle(x, 512, 512, 2600, ['#d6d4cf', '#f4f3f0'], 2, 7, r, 0.6);
  speckle(x, 512, 512, 9000, ['#2a2927', '#4a4743', '#77736c', '#9c978f', '#b9b4ab'], 0.5, 1.8, r, 0.9);
  return finish(c);
}

/** Standing-seam anthracite panels, 0.6 m wide. Tile is 2.4 m × 1.2 m. */
export function fascia() {
  const r = rng(7);
  const [c, x] = canvas(1024, 512);
  for (let i = 0; i < 4; i++) {
    const v = Math.floor(58 + r() * 9);
    const g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, `rgb(${v + 6},${v + 10},${v + 15})`);
    g.addColorStop(1, `rgb(${v - 4},${v},${v + 4})`);
    x.fillStyle = g;
    x.fillRect(i * 256, 0, 256, 512);
    x.fillStyle = 'rgba(0,0,0,0.55)';
    x.fillRect(i * 256, 0, 4, 512);
    x.fillStyle = 'rgba(255,255,255,0.12)';
    x.fillRect(i * 256 + 4, 0, 2, 512);
  }
  return finish(c);
}

/** Larch boards ~9 cm wide running along U. Tile is 1.2 m. */
export function larch() {
  const r = rng(3);
  const [c, x] = canvas(512);
  const boards = 13;
  const bh = 512 / boards;
  for (let b = 0; b < boards; b++) {
    const hue = 26 + r() * 6;
    const light = 52 + r() * 10;
    x.fillStyle = `hsl(${hue} 46% ${light}%)`;
    x.fillRect(0, b * bh, 512, bh);
    for (let k = 0; k < 14; k++) {
      x.strokeStyle = `hsla(${hue - 4} 50% ${light - 14 - r() * 10}% / ${0.25 + r() * 0.35})`;
      x.lineWidth = 0.6 + r() * 1.2;
      x.beginPath();
      const y0 = b * bh + r() * bh;
      x.moveTo(0, y0);
      for (let px = 0; px <= 512; px += 32) x.lineTo(px, y0 + Math.sin(px * 0.02 + k) * (1 + r() * 2));
      x.stroke();
    }
    if (r() < 0.35) {
      x.fillStyle = `hsla(20 45% 28% / 0.7)`;
      x.beginPath();
      x.ellipse(r() * 512, b * bh + bh / 2, 4 + r() * 4, 2.5, 0, 0, Math.PI * 2);
      x.fill();
    }
    x.fillStyle = 'rgba(40,22,10,0.55)';
    x.fillRect(0, b * bh, 512, 1.5);
  }
  return finish(c);
}

/** Lawn / field grass. 6 m tile. */
export function grass() {
  const r = rng(21);
  const [c, x] = canvas(512);
  x.fillStyle = '#5d6c37';
  x.fillRect(0, 0, 512, 512);
  speckle(x, 512, 512, 140, ['#6b7a3c', '#53622f', '#74773f', '#4d5c2e'], 20, 60, r, 0.35);
  for (let i = 0; i < 16000; i++) {
    const px = r() * 512;
    const py = r() * 512;
    x.strokeStyle = pick(r, ['#7d8c45', '#4b5a28', '#8b8a4a', '#66773a', '#3f4d24', '#9a9555']);
    x.globalAlpha = 0.5 + r() * 0.5;
    x.lineWidth = 0.8;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + (r() - 0.5) * 3, py - 2 - r() * 5);
    x.stroke();
  }
  x.globalAlpha = 1;
  return finish(c);
}

/** Grey gravel. 1 m tile. */
export function gravel() {
  const r = rng(5);
  const [c, x] = canvas(256);
  x.fillStyle = '#6d6e6f';
  x.fillRect(0, 0, 256, 256);
  speckle(x, 256, 256, 3200, ['#8a8b8c', '#55575a', '#a3a2a0', '#3f4144', '#7b7670'], 1, 3.2, r);
  return finish(c);
}

/** Concrete. 2 m tile. */
export function concrete() {
  const r = rng(9);
  const [c, x] = canvas(256);
  x.fillStyle = '#a7a8a5';
  x.fillRect(0, 0, 256, 256);
  speckle(x, 256, 256, 60, ['#9a9b98', '#b3b4b0'], 10, 30, r, 0.4);
  speckle(x, 256, 256, 2400, ['#8f908c', '#bdbdb9', '#777874'], 0.4, 1.2, r, 0.6);
  return finish(c);
}

/** Roof membrane. 2 m tile. */
export function membrane() {
  const r = rng(13);
  const [c, x] = canvas(256);
  x.fillStyle = '#4a4e52';
  x.fillRect(0, 0, 256, 256);
  speckle(x, 256, 256, 1800, ['#55595d', '#3f4347', '#5f6266'], 0.5, 1.5, r, 0.7);
  return finish(c);
}

/** Sedum mat. 1.5 m tile. */
export function sedum() {
  const r = rng(17);
  const [c, x] = canvas(256);
  x.fillStyle = '#5b6b33';
  x.fillRect(0, 0, 256, 256);
  speckle(x, 256, 256, 220, ['#7d8a3a', '#8d5a3a', '#4f6a2f', '#a0943f'], 6, 16, r, 0.55);
  speckle(x, 256, 256, 4000, ['#91a24a', '#3d5226', '#a86a43', '#6f8d3a', '#c2b257'], 0.6, 2, r, 0.8);
  return finish(c);
}

/** Excavation wall: grass line, topsoil, clay with stones. U spans 4 m, V spans the full 2.4 m depth. */
export function soil() {
  const r = rng(29);
  const [c, x] = canvas(512);
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#2d241b');
  g.addColorStop(0.14, '#3a2c20');
  g.addColorStop(0.18, '#6e4f33');
  g.addColorStop(0.7, '#7a5a3b');
  g.addColorStop(1, '#5b4634');
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 512);
  x.fillStyle = '#4f6230';
  x.fillRect(0, 0, 512, 7);
  for (let k = 0; k < 9; k++) {
    x.strokeStyle = `rgba(${40 + r() * 30},${28 + r() * 20},${16},0.35)`;
    x.lineWidth = 1 + r() * 3;
    x.beginPath();
    const y0 = 100 + r() * 400;
    x.moveTo(0, y0);
    for (let px = 0; px <= 512; px += 24) x.lineTo(px, y0 + Math.sin(px * 0.015 + k * 2) * 6);
    x.stroke();
  }
  for (let i = 0; i < 260; i++) {
    const py = 80 + r() * 430;
    const s = 2 + r() * 7;
    x.fillStyle = pick(r, ['#8e8578', '#a39b8e', '#6f675c', '#b8afa0']);
    x.beginPath();
    x.ellipse(r() * 512, py, s, s * 0.7, r() * 3, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = 'rgba(0,0,0,0.25)';
    x.beginPath();
    x.ellipse(r() * 512, py + s * 0.5, s * 0.9, s * 0.25, 0, 0, Math.PI * 2);
    x.fill();
  }
  // roots
  x.strokeStyle = 'rgba(30,20,12,0.6)';
  for (let i = 0; i < 40; i++) {
    x.lineWidth = 0.6 + r();
    x.beginPath();
    let px = r() * 512;
    let py = 6;
    x.moveTo(px, py);
    for (let s = 0; s < 6; s++) {
      px += (r() - 0.5) * 14;
      py += 6 + r() * 10;
      x.lineTo(px, py);
    }
    x.stroke();
  }
  return finish(c);
}

/** Mono PV panel, 6 × 10 cells. Matches a 1.05 × 1.75 m panel. */
export function solarCells() {
  const [c, x] = canvas(240, 400);
  x.fillStyle = '#c9ced4';
  x.fillRect(0, 0, 240, 400);
  const cw = 240 / 6;
  const ch = 400 / 10;
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 10; j++) {
      const g = x.createLinearGradient(0, j * ch, 0, (j + 1) * ch);
      g.addColorStop(0, '#16243a');
      g.addColorStop(1, '#0d1726');
      x.fillStyle = g;
      x.fillRect(i * cw + 1.2, j * ch + 1.2, cw - 2.4, ch - 2.4);
      x.fillStyle = 'rgba(190,200,215,0.35)';
      x.fillRect(i * cw + cw * 0.3, j * ch + 1, 0.8, ch - 2);
      x.fillRect(i * cw + cw * 0.7, j * ch + 1, 0.8, ch - 2);
    }
  return finish(c);
}

/** Warm interior seen through glass at dusk: ceiling light, sofa, shelves, plant. */
export function interior(seed = 1) {
  const r = rng(seed);
  const [c, x] = canvas(512);
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#5a412b');
  g.addColorStop(0.35, '#e8b67a');
  g.addColorStop(0.62, '#c58e58');
  g.addColorStop(1, '#4a3424');
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 512);
  // pools of light
  for (let i = 0; i < 3; i++) {
    const px = 80 + r() * 352;
    const rg = x.createRadialGradient(px, 60, 4, px, 120, 240);
    rg.addColorStop(0, 'rgba(255,236,200,0.95)');
    rg.addColorStop(1, 'rgba(255,200,140,0)');
    x.fillStyle = rg;
    x.fillRect(0, 0, 512, 512);
  }
  x.fillStyle = 'rgba(40,26,16,0.85)';
  // shelves
  const sx = r() * 200;
  x.fillRect(sx, 150, 160, 6);
  x.fillRect(sx, 210, 160, 6);
  x.fillRect(sx + 10, 120, 18, 30);
  x.fillRect(sx + 60, 128, 30, 22);
  // sofa
  const so = 180 + r() * 150;
  x.beginPath();
  x.roundRect(so, 340, 230, 70, 12);
  x.fill();
  x.fillRect(so - 6, 380, 242, 80);
  // table
  x.fillRect(so - 150, 420, 110, 8);
  x.fillRect(so - 140, 428, 6, 50);
  x.fillRect(so - 56, 428, 6, 50);
  // plant
  x.fillStyle = 'rgba(30,40,20,0.85)';
  for (let i = 0; i < 9; i++) {
    x.beginPath();
    x.ellipse(60 + Math.sin(i) * 20, 330 + i * 12, 26, 9, i, 0, Math.PI * 2);
    x.fill();
  }
  x.fillRect(48, 420, 26, 60);
  // pendant
  x.fillStyle = 'rgba(255,248,230,1)';
  x.beginPath();
  x.ellipse(300, 70, 26, 10, 0, 0, Math.PI * 2);
  x.fill();
  return finish(c);
}

/** Vertical up/down wash of a facade wall lamp. Used as an additive decal. */
export function lampWash() {
  const [c, x] = canvas(128, 256);
  for (const dir of [-1, 1]) {
    const g = x.createRadialGradient(64, 128, 2, 64, 128 + dir * 40, 130);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(64, 128);
    x.lineTo(64 - 70, 128 + dir * 140);
    x.lineTo(64 + 70, 128 + dir * 140);
    x.closePath();
    x.fill();
  }
  return finish(c);
}

/** Heat-pump fan grille. */
export function grille() {
  const [c, x] = canvas(256);
  x.fillStyle = '#d7dadd';
  x.fillRect(0, 0, 256, 256);
  x.fillStyle = '#2b3036';
  x.beginPath();
  x.arc(128, 128, 104, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = '#9aa1a8';
  x.lineWidth = 2;
  for (let rr = 12; rr < 104; rr += 9) {
    x.beginPath();
    x.arc(128, 128, rr, 0, Math.PI * 2);
    x.stroke();
  }
  for (let a = 0; a < 8; a++) {
    x.beginPath();
    x.moveTo(128, 128);
    x.lineTo(128 + Math.cos(a * 0.785) * 104, 128 + Math.sin(a * 0.785) * 104);
    x.stroke();
  }
  return finish(c);
}

/** Alpha-tested grass blades for the tufts around the house. */
export function blades() {
  const r = rng(61);
  const [c, x] = canvas(256, 128);
  for (let i = 0; i < 70; i++) {
    const bx = 8 + r() * 240;
    const h = 50 + r() * 75;
    const lean = (r() - 0.5) * 40;
    const w = 2 + r() * 3;
    const g = x.createLinearGradient(0, 128, 0, 128 - h);
    const hue = 70 + r() * 25;
    g.addColorStop(0, `hsl(${hue} 32% 30%)`);
    g.addColorStop(1, `hsl(${hue - 10} 42% ${50 + r() * 16}%)`);
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(bx - w, 128);
    x.quadraticCurveTo(bx + lean * 0.3, 128 - h * 0.6, bx + lean, 128 - h);
    x.quadraticCurveTo(bx + lean * 0.3 + w * 0.5, 128 - h * 0.6, bx + w, 128);
    x.fill();
  }
  return finish(c);
}
