'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { loopCurve } from './House';

/*
 * The same house as the 3D model, as an architect's line drawing that draws itself.
 * One LineSegments draw call; every segment carries its place in the drawing order (aT),
 * so a single uniform (uProgress) reveals the whole drawing like a pen.
 */

const BLUE = new THREE.Color('#8cc6f2');
const FAINT = new THREE.Color('#4f77a3');
const LARCH = new THREE.Color('#e4b886');
const GLOW = new THREE.Color('#ffcf8f');
const GREEN = new THREE.Color('#9fd38a');

type Seg = { a: THREE.Vector3; b: THREE.Vector3; ca: THREE.Color; cb: THREE.Color; dash: boolean; w: number };

class Drawing {
  segs: Seg[] = [];
  line(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Color, { dash = false, w = 1, cb }: { dash?: boolean; w?: number; cb?: THREE.Color } = {}) {
    this.segs.push({ a, b, ca: c, cb: cb ?? c, dash, w });
  }
  poly(pts: THREE.Vector3[], c: THREE.Color, opts: { dash?: boolean; w?: number; closed?: boolean; c2?: THREE.Color } = {}) {
    const n = opts.closed ? pts.length : pts.length - 1;
    for (let i = 0; i < n; i++) {
      const k0 = i / n;
      const k1 = (i + 1) / n;
      const ca = opts.c2 ? c.clone().lerp(opts.c2, k0) : c;
      const cb = opts.c2 ? c.clone().lerp(opts.c2, k1) : c;
      this.line(pts[i], pts[(i + 1) % pts.length], ca, { dash: opts.dash, w: opts.w, cb });
    }
  }
  /** Axis-aligned rectangle in a vertical plane (x-y at fixed z, or z-y at fixed x). */
  rectXY(x0: number, x1: number, y0: number, y1: number, z: number, c = BLUE) {
    const V = (x: number, y: number) => new THREE.Vector3(x, y, z);
    this.poly([V(x0, y0), V(x1, y0), V(x1, y1), V(x0, y1)], c, { closed: true });
  }
  rectZY(z0: number, z1: number, y0: number, y1: number, x: number, c = BLUE) {
    const V = (z: number, y: number) => new THREE.Vector3(x, y, z);
    this.poly([V(z0, y0), V(z1, y0), V(z1, y1), V(z0, y1)], c, { closed: true });
  }
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c = BLUE, w = 1) {
    const p = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const b = [p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)];
    const t = [p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1)];
    this.poly(b, c, { closed: true, w });
    this.poly(t, c, { closed: true, w });
    for (let i = 0; i < 4; i++) this.line(b[i], t[i], c, { w });
  }

  build() {
    const total = this.segs.reduce((s, g) => s + g.a.distanceTo(g.b) * g.w, 0);
    const n = this.segs.length * 2;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const t = new Float32Array(n);
    const dist = new Float32Array(n);
    const dash = new Float32Array(n);
    let acc = 0;
    this.segs.forEach((s, i) => {
      const len = s.a.distanceTo(s.b);
      const t0 = acc / total;
      acc += len * s.w;
      const t1 = acc / total;
      pos.set([s.a.x, s.a.y, s.a.z, s.b.x, s.b.y, s.b.z], i * 6);
      col.set([s.ca.r, s.ca.g, s.ca.b, s.cb.r, s.cb.g, s.cb.b], i * 6);
      t.set([t0, t1], i * 2);
      dist.set([0, len], i * 2);
      dash.set([s.dash ? 1 : 0, s.dash ? 1 : 0], i * 2);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aT', new THREE.BufferAttribute(t, 1));
    g.setAttribute('aDist', new THREE.BufferAttribute(dist, 1));
    g.setAttribute('aDash', new THREE.BufferAttribute(dash, 1));
    return g;
  }
}

function drawHouse() {
  const d = new Drawing();
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  // site grid, drawn quickly
  for (let k = -16; k <= 16; k += 2) {
    d.line(V(k, 0, -14), V(k, 0, 16), FAINT, { w: 0.08 });
    d.line(V(-16, 0, k), V(16, 0, k), FAINT, { w: 0.08 });
  }

  // walls: body 14 × 9 × 3 m with the porch recess
  d.poly([V(-7, 0, -4.5), V(7, 0, -4.5), V(7, 0, 4.5), V(4.6, 0, 4.5), V(4.6, 0, 3), V(0.6, 0, 3), V(0.6, 0, 4.5), V(-7, 0, 4.5)], BLUE, { closed: true });
  for (const [x, z] of [[-7, -4.5], [7, -4.5], [7, 4.5], [-7, 4.5], [0.6, 4.5], [4.6, 4.5], [0.6, 3], [4.6, 3]]) d.line(V(x, 0, z), V(x, 3, z), BLUE);

  // openings
  d.rectXY(-4.6, -2.2, 0.3, 2.7, 4.5);
  d.line(V(-3.4, 0.3, 4.5), V(-3.4, 2.7, 4.5), BLUE, { w: 0.5 });
  d.line(V(-4.6, 2.12, 4.5), V(-2.2, 2.12, 4.5), BLUE, { w: 0.5 });
  d.rectXY(1.1, 2.1, 0.14, 2.25, 3);
  d.rectXY(2.9, 3.9, 0.14, 2.95, 3);
  d.rectXY(1.0, 2.3, 2.25, 3, 3.01, LARCH);
  d.rectXY(5.7, 6.3, 0.15, 3, 4.52, LARCH);
  d.rectZY(-0.5, 0.9, 0.3, 2.75, -7);
  d.rectZY(2.65, 3.25, 0.3, 2.75, -7);
  d.rectZY(-0.7, 1.1, 0.9, 2.7, 7);
  d.rectXY(3.4, 5, 0.9, 2.7, -4.5);
  d.rectXY(-3.4, -1, 0.3, 2.7, -4.5);

  // roof slab with 1 m overhang and the larch soffit
  d.box(-8, 8, 3, 4.15, -5.5, 5.5, BLUE, 1.2);
  d.poly([V(-8, 3, 5.5), V(8, 3, 5.5), V(8, 3, -5.5), V(-8, 3, -5.5)], LARCH, { closed: true });
  for (let x = -7.4; x < 8; x += 0.6) d.line(V(x, 3, 5.5), V(x, 4.15, 5.5), FAINT, { w: 0.15 });

  // solar array: 3 rows × 6 panels tilted 25° to the south
  const tilt = THREE.MathUtils.degToRad(25);
  const dy = Math.sin(tilt) * 0.875;
  const dz = Math.cos(tilt) * 0.875;
  for (const zc of [-3.9, -1.5, 0.9])
    for (let i = 0; i < 6; i++) {
      const xc = -7 + i * 1.1;
      const y = 4.6;
      d.poly(
        [V(xc - 0.52, y - dy, zc + dz), V(xc + 0.52, y - dy, zc + dz), V(xc + 0.52, y + dy, zc - dz), V(xc - 0.52, y + dy, zc - dz)],
        BLUE,
        { closed: true, w: 0.6 },
      );
    }

  // green roof with hatching
  d.poly([V(0.6, 4.16, -5.25), V(7.75, 4.16, -5.25), V(7.75, 4.16, 5.25), V(0.6, 4.16, 5.25)], GREEN, { closed: true });
  for (let k = 0; k < 18; k += 0.7) {
    const a = V(0.6 + Math.max(0, k - 10.5), 4.16, -5.25 + Math.min(k, 10.5));
    const b = V(Math.min(7.75, 0.6 + k), 4.16, -5.25 + Math.max(0, k - 7.15));
    d.line(a, b, GREEN, { w: 0.25 });
  }

  // heat pump
  d.box(7.22, 7.62, 0.15, 1.1, 2.78, 3.82, BLUE, 0.6);

  // ground loop under the lawn: cold in, warm out
  const loop = loopCurve().getPoints(160);
  d.poly([V(7.6, 0.6, 3.8), V(7.6, 0, 6.75)], FAINT, { dash: true });
  d.poly(loop, new THREE.Color('#5fb4ff'), { c2: new THREE.Color('#ff9a52'), w: 0.9 });

  // dimensions: 14 m, 9 m, 4.15 m
  const tick = (p: THREE.Vector3, axis: 'x' | 'z' | 'y') => {
    const o = axis === 'y' ? V(0.25, 0, 0) : axis === 'x' ? V(0, 0.25, 0) : V(0, 0.25, 0);
    d.line(p.clone().sub(o), p.clone().add(o), GLOW, { w: 0.3 });
  };
  d.line(V(-7, 0, 14), V(7, 0, 14), GLOW, { dash: true });
  tick(V(-7, 0, 14), 'x');
  tick(V(7, 0, 14), 'x');
  d.line(V(-10, 0, -4.5), V(-10, 0, 4.5), GLOW, { dash: true });
  tick(V(-10, 0, -4.5), 'z');
  tick(V(-10, 0, 4.5), 'z');
  d.line(V(-9.2, 0, 5.5), V(-9.2, 4.15, 5.5), GLOW, { dash: true });

  // sun paths: summer noon 69°, winter noon 26° (Bishkek)
  const R = 11.5;
  for (const [maxEl, c] of [
    [69, GLOW],
    [26, new THREE.Color('#b7d8ff')],
  ] as const) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 48; i++) {
      const az = -Math.PI / 2 + (i / 48) * Math.PI;
      const el = THREE.MathUtils.degToRad(maxEl) * Math.cos(az);
      pts.push(V(Math.sin(az) * Math.cos(el) * R, Math.sin(el) * R, Math.cos(az) * Math.cos(el) * R));
    }
    d.poly(pts, c, { dash: true, w: 0.5 });
    // the noon sun and its ray onto the façade
    const el = THREE.MathUtils.degToRad(maxEl);
    const sun = V(0, Math.sin(el) * R, Math.cos(el) * R);
    const ring: THREE.Vector3[] = [];
    for (let i = 0; i < 16; i++) ring.push(sun.clone().add(V(Math.cos((i / 16) * 6.283) * 0.45, Math.sin((i / 16) * 6.283) * 0.45, 0)));
    d.poly(ring, c, { closed: true, w: 0.5 });
    d.line(sun, V(0, 3, 5.5), c, { w: 0.6 });
  }
  return d.build();
}

const vert = /* glsl */ `
attribute float aT; attribute float aDist; attribute float aDash;
varying float vT; varying float vDist; varying float vDash; varying vec3 vColor;
void main() {
  vT = aT; vDist = aDist; vDash = aDash; vColor = color;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const frag = /* glsl */ `
uniform float uProgress; uniform float uOpacity;
varying float vT; varying float vDist; varying float vDash; varying vec3 vColor;
void main() {
  if (vT > uProgress) discard;
  if (vDash > 0.5 && fract(vDist * 2.2) > 0.55) discard;
  // the pen tip glows while it draws
  float tip = smoothstep(uProgress - 0.025, uProgress, vT) * step(uProgress, 0.999);
  gl_FragColor = vec4(vColor * (1.0 + tip * 2.5), uOpacity);
}`;

function Drawing3D({ input, animate }: { input: React.RefObject<{ visible: boolean; px: number; py: number }>; animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { camera, size } = useThree();
  const geo = useMemo(() => drawHouse(), []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uProgress: { value: animate ? 0 : 1 }, uOpacity: { value: 0.9 } },
        vertexShader: vert,
        fragmentShader: frag,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [animate],
  );
  const uniforms = mat.uniforms;
  const state = useRef({ started: false, t: 0, spin: 0 });

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const wide = size.width >= 1024;
    cam.fov = size.width / size.height < 0.8 ? 38 : 30;
    if (wide) cam.setViewOffset(size.width, size.height, -size.width * 0.21, size.height * 0.06, size.width, size.height);
    else cam.setViewOffset(size.width, size.height, 0, size.height * 0.17, size.width, size.height);
    cam.updateProjectionMatrix();
    cam.lookAt(0, 1.5, 1.5);
  }, [camera, size]);

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.1);
    const s = state.current;
    const inp = input.current!;
    if (inp.visible) s.started = true;
    if (animate && s.started && uniforms.uProgress.value < 1) uniforms.uProgress.value = Math.min(1, uniforms.uProgress.value + dt / 5.5);
    if (animate) s.spin += dt * 0.07;
    if (group.current) {
      group.current.rotation.y = -0.5 + s.spin + inp.px * 0.12;
      group.current.rotation.x = inp.py * 0.04;
    }
  });

  return (
    <group ref={group}>
      <lineSegments geometry={geo} material={mat} />
    </group>
  );
}

export default function Blueprint({
  input,
  running,
  animate,
}: {
  input: React.RefObject<{ visible: boolean; px: number; py: number }>;
  running: boolean;
  animate: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      camera={{ position: [31, 19, 35], fov: 30, near: 1, far: 300 }}
      frameloop={running ? 'always' : 'never'}
      aria-hidden
    >
      <Drawing3D input={input} animate={animate} />
    </Canvas>
  );
}
