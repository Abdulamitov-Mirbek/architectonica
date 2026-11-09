'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { groundShader, shared, snowify } from './shaders';
import { blades, grass, rng } from './textures';

/* ---------- sky ---------- */

export type SkyUniforms = {
  uTop: { value: THREE.Color };
  uHorizon: { value: THREE.Color };
  uSun: { value: THREE.Color };
  uSunDir: { value: THREE.Vector3 };
};

export function makeSkyUniforms(): SkyUniforms {
  return {
    uTop: { value: new THREE.Color('#3f6f9f') },
    uHorizon: { value: new THREE.Color('#f3c99b') },
    uSun: { value: new THREE.Color('#ffcf9a') },
    uSunDir: { value: new THREE.Vector3(0, 0.3, 1).normalize() },
  };
}

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;
const skyFrag = /* glsl */ `
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSun; uniform vec3 uSunDir;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y, 0.0, 1.0);
  vec3 col = mix(uHorizon, uTop, pow(h, 0.5));
  float s = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSun * (pow(s, 900.0) * 6.0 + pow(s, 24.0) * 0.35 + pow(s, 4.0) * 0.12 * (1.0 - h));
  if (d.y < 0.0) col = uHorizon;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

export function Sky({ uniforms, radius = 1500 }: { uniforms: SkyUniforms; radius?: number }) {
  return (
    <mesh scale={radius} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={skyVert}
        fragmentShader={skyFrag}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

/* ---------- noise ---------- */

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, oct = 5) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(x * f, y * f);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}

/* ---------- ground ---------- */

export function Ground() {
  const { geo, mat } = useMemo(() => {
    const size = 1400;
    const seg = 160;
    const g = new THREE.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r = Math.hypot(x, z);
      const lift = THREE.MathUtils.smoothstep(r, 45, 160);
      pos.setY(i, (fbm(x * 0.012, z * 0.012, 4) - 0.5) * 14 * lift);
      uv.setXY(i, x / 6, z / 6);
      const n = fbm(x * 0.03 + 9, z * 0.03, 3);
      c.setHSL(0.17 + n * 0.05, 0.3, 0.42 + n * 0.25);
      // the mown lawn around the house is greener and more even
      const lawn = 1 - THREE.MathUtils.smoothstep(r, 16, 30);
      c.lerp(new THREE.Color('#8fa46a'), lawn * 0.5);
      colors.set([c.r * 1.45, c.g * 1.4, c.b * 1.3], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const tex = grass();
    const m = snowify(new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: 0.95 }), {
      min: 0.5,
      max: 0.7,
      key: 'ground',
      extra: groundShader,
    });
    return { geo: g, mat: m };
  }, []);
  return <mesh geometry={geo} material={mat} receiveShadow />;
}

/* ---------- grass tufts near the house ---------- */

/** Areas kept free of tufts: house + drip strip, porch, the excavation. */
const builtUp = (x: number, z: number) =>
  (Math.abs(x) < 8.3 && Math.abs(z) < 5.8) || (x > -3.7 && x < 5.4 && z > 4 && z < 6.9) || (x > 1.3 && x < 9.7 && z > 6.3 && z < 12.2);

export function GrassTufts({ count = 16000 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { geo, mat } = useMemo(() => {
    // two crossed quads; normals point up so the tufts shade like the lawn they sit on
    const a = new THREE.PlaneGeometry(0.55, 0.28);
    a.translate(0, 0.14, 0);
    const b = a.clone().rotateY(Math.PI / 2);
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array([...(a.attributes.position.array as Float32Array), ...(b.attributes.position.array as Float32Array)]);
    const uv = new Float32Array([...(a.attributes.uv.array as Float32Array), ...(b.attributes.uv.array as Float32Array)]);
    const idx = [...(a.index!.array as Uint16Array), ...Array.from(b.index!.array as Uint16Array, (i) => i + 4)];
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(pos.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
    g.setIndex(idx);
    const m = new THREE.MeshStandardMaterial({ map: blades(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uSnow = shared.uSnow;
      sh.uniforms.uTime = shared.uTime;
      sh.vertexShader = sh.vertexShader
        .replace('void main() {', `uniform float uSnow;
uniform float uTime;
void main() {`)
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          float tip = transformed.y / 0.28;
          vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          transformed.x += sin(uTime * 1.3 + wp.x * 0.7 + wp.z * 0.4) * 0.03 * tip;
          transformed.y *= 1.0 - uSnow;`,
        );
      sh.fragmentShader = sh.fragmentShader
        .replace('void main() {', `uniform float uSnow;
void main() {`)
        .replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.9, 0.95), uSnow);
// seen from above, crossed quads read as X shapes: fade tufts out on steep views
float steep = abs(dot(normalize(vViewPosition), normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)));
diffuseColor.a *= (1.0 - smoothstep(0.55, 0.8, steep)) * (1.0 - smoothstep(0.2, 0.6, uSnow));`);
    };
    m.customProgramCacheKey = () => 'tufts';
    return { geo: g, mat: m };
  }, []);

  useLayoutEffect(() => {
    const r = rng(91);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const c = new THREE.Color();
    let i = 0;
    let guard = 0;
    while (i < count && guard++ < count * 4) {
      // denser near the house, thinning out to ~30 m
      const a = r() * Math.PI * 2;
      const d = 3 + Math.pow(r(), 0.7) * 30;
      const x = Math.sin(a) * d * 1.1 + 1;
      const z = Math.cos(a) * d + 3;
      if (builtUp(x, z)) continue;
      const s = 0.45 + r() * 0.65;
      e.set(0, r() * Math.PI, 0);
      q.setFromEuler(e);
      m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s * (0.7 + r() * 0.6), s));
      ref.current!.setMatrixAt(i, m4);
      c.setHSL(0.2 + r() * 0.06, 0.25 + r() * 0.2, 0.75 + r() * 0.35);
      ref.current!.setColorAt(i, c);
      i++;
    }
    ref.current!.count = i;
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.instanceColor!.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [count]);

  return <instancedMesh ref={ref} args={[geo, mat, count]} receiveShadow />;
}

/* ---------- mountains: the Ala-Too range ---------- */

export function Mountains() {
  const geo = useMemo(() => {
    const segA = 720;
    const segR = 56;
    const r0 = 380;
    const r1 = 900;
    const pos: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    const rock = new THREE.Color('#5a5f66');
    const foot = new THREE.Color('#6f6b55');
    const snow = new THREE.Color('#eef2f7');
    const c = new THREE.Color();
    for (let i = 0; i <= segR; i++) {
      const t = i / segR;
      const r = r0 + (r1 - r0) * t;
      for (let j = 0; j <= segA; j++) {
        const a = (j / segA) * Math.PI * 2;
        const x = Math.sin(a) * r;
        const z = Math.cos(a) * r;
        const back = (1 - Math.cos(a)) / 2; // 1 behind the house (−z)
        const prof = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 1.2);
        // ridged noise in world space: sharp crests, broad valleys
        const n = fbm(x * 0.004 + 3, z * 0.004, 6);
        const ridged = 1 - Math.abs(n * 2 - 1);
        const h = (12 + 98 * back * back) * prof * (0.25 + 1.1 * ridged * ridged);
        pos.push(x, h - 2, z);
        const snowline = 52 + 22 * fbm(x * 0.01, z * 0.01, 2);
        c.copy(foot).lerp(rock, THREE.MathUtils.smoothstep(h, 8, 55)).lerp(snow, THREE.MathUtils.smoothstep(h, snowline, snowline + 28));
        col.push(c.r, c.g, c.b);
      }
    }
    const row = segA + 1;
    for (let i = 0; i < segR; i++)
      for (let j = 0; j < segA; j++) {
        const a = i * row + j;
        idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  const mat = useMemo(
    () => snowify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), { min: 0.55, max: 0.9, key: 'mtn' }),
    [],
  );
  return <mesh geometry={geo} material={mat} />;
}

/* ---------- trees ---------- */

type Placement = { x: number; z: number; s: number };

function scatter(seed: number, n: number, area: (r: () => number) => [number, number] | null): Placement[] {
  const r = rng(seed);
  const out: Placement[] = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 40) {
    const p = area(r);
    if (p) out.push({ x: p[0], z: p[1], s: 0.75 + r() * 0.5 });
  }
  return out;
}

/** Keeps trees off the house, the yard, the pit and the camera paths. */
const clear = (x: number, z: number) => !(x > -16 && x < 18 && z > -10 && z < 40) && !(x < -10 && x > -40 && z > 10 && z < 45);

export function Trees() {
  const spruces = useMemo(
    () =>
      scatter(4, 150, (r) => {
        const k = r();
        let x: number;
        let z: number;
        if (k < 0.3) {
          x = -22 - r() * 26;
          z = -34 + r() * 40;
        } else if (k < 0.55) {
          x = 22 + r() * 30;
          z = -20 + r() * 50;
        } else {
          const a = r() * Math.PI * 2;
          const d = 60 + r() * 150;
          x = Math.sin(a) * d;
          z = Math.cos(a) * d;
        }
        return clear(x, z) ? [x, z] : null;
      }),
    [],
  );

  const spruceRef = useRef<THREE.InstancedMesh>(null);
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const TIERS = 9;

  const mats = useMemo(
    () => ({
      spruce: snowify(new THREE.MeshStandardMaterial({ color: '#2c4434', roughness: 0.9 }), { min: 0.2, max: 0.45, key: 'spruce' }),
      trunk: new THREE.MeshStandardMaterial({ color: '#4a3a2e', roughness: 1 }),
    }),
    [],
  );
  const geos = useMemo(() => {
    // spruce tier: a cone whose rim is ragged and drooping, like branch tips
    const cone = new THREE.ConeGeometry(1, 1, 18, 2);
    cone.translate(0, 0.5, 0);
    const cp = cone.attributes.position as THREE.BufferAttribute;
    const cr = rng(5);
    for (let i = 0; i < cp.count; i++) {
      const y = cp.getY(i);
      if (y > 0.99) continue;
      const x = cp.getX(i);
      const z = cp.getZ(i);
      const a = Math.atan2(z, x);
      const jag = 0.78 + 0.42 * Math.abs(Math.sin(a * 4.5)) + (cr() - 0.5) * 0.12;
      const k = y < 0.01 ? jag : 0.85 + (jag - 0.78) * 0.4;
      cp.setXYZ(i, x * k, y - (y < 0.01 ? 0.12 * jag : 0), z * k);
    }
    cone.computeVertexNormals();
    const trunk = new THREE.CylinderGeometry(0.5, 0.7, 1, 6);
    trunk.translate(0, 0.5, 0);
    return { cone, trunk };
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const color = new THREE.Color();
    const r = rng(42);
    let k = 0;
    let t = 0;
    spruces.forEach((p) => {
      const h = 9 * p.s + r() * 4;
      const base = h * 0.24;
      for (let i = 0; i < TIERS; i++) {
        const f = i / (TIERS - 1);
        const rad = base * (1 - f * 0.82) * (0.9 + r() * 0.2);
        e.set((r() - 0.5) * 0.06, r() * 6, (r() - 0.5) * 0.06);
        q.setFromEuler(e);
        m.compose(new THREE.Vector3(p.x, h * (0.12 + f * 0.66), p.z), q, new THREE.Vector3(rad, h * 0.3, rad));
        spruceRef.current!.setMatrixAt(k, m);
        color.setHSL(0.36 + r() * 0.04, 0.25 + r() * 0.1, 0.22 + r() * 0.08);
        spruceRef.current!.setColorAt(k, color);
        k++;
      }
      m.compose(new THREE.Vector3(p.x, 0, p.z), q.identity(), new THREE.Vector3(0.35 * p.s, h * 0.2, 0.35 * p.s));
      trunkRef.current!.setMatrixAt(t++, m);
    });
    for (const ref of [spruceRef, trunkRef]) {
      ref.current!.instanceMatrix.needsUpdate = true;
      if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
      ref.current!.computeBoundingSphere();
    }
  }, [spruces]);

  return (
    <>
      <instancedMesh ref={spruceRef} args={[geos.cone, mats.spruce, spruces.length * TIERS]} castShadow receiveShadow />
      <instancedMesh ref={trunkRef} args={[geos.trunk, mats.trunk, spruces.length]} castShadow />
    </>
  );
}

/* ---------- neighbouring houses, far away ---------- */

export function Neighbours() {
  const items = useMemo(
    () => [
      { x: -70, z: -60, w: 9, d: 8, ry: 0.2 },
      { x: 95, z: -70, w: 10, d: 7, ry: -0.3 },
      { x: -95, z: 20, w: 8, d: 7, ry: 0.9 },
      { x: 40, z: -110, w: 11, d: 8, ry: 0.05 },
    ],
    [],
  );
  const wall = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d8d4cc', roughness: 0.9 }), []);
  const roof = useMemo(() => snowify(new THREE.MeshStandardMaterial({ color: '#7b4a3a', roughness: 0.8 }), { min: 0.3, max: 0.6, key: 'nroof' }), []);
  const prism = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 3, 1);
    g.rotateZ(Math.PI / 2);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  return (
    <>
      {items.map((h, i) => (
        <group key={i} position={[h.x, 0, h.z]} rotation-y={h.ry}>
          <mesh material={wall} position-y={1.5} castShadow receiveShadow>
            <boxGeometry args={[h.w, 3, h.d]} />
          </mesh>
          <mesh geometry={prism} material={roof} position-y={3 + 0.9} scale={[h.w * 0.62, 2.1, h.d * 1.16]} rotation-y={Math.PI / 2} castShadow />
        </group>
      ))}
    </>
  );
}

/* ---------- snowfall ---------- */

const snowVert = /* glsl */ `
uniform float uTime; uniform float uPixel;
attribute float aSeed;
void main() {
  vec3 p = position;
  float speed = 0.7 + aSeed * 0.8;
  p.y = mod(p.y - uTime * speed, 26.0) - 2.0;
  p.x += sin(uTime * 0.6 + aSeed * 40.0) * 0.5;
  p.z += cos(uTime * 0.45 + aSeed * 23.0) * 0.4;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPixel * (0.06 + aSeed * 0.05) * (420.0 / -mv.z);
}`;
const snowFrag = /* glsl */ `
uniform float uOpacity;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.15, d) * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vec3(1.0), a);
}`;

export function Snowfall({ animate }: { animate: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const { geo, uniforms } = useMemo(() => {
    const n = 4000;
    const r = rng(77);
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos.set([(r() - 0.5) * 70, r() * 26, (r() - 0.5) * 60 + 8], i * 3);
      seed[i] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return { geo: g, uniforms: { uTime: { value: 0 }, uPixel: { value: 1 }, uOpacity: { value: 0 } } };
  }, []);
  useFrame((state) => {
    uniforms.uPixel.value = state.gl.getPixelRatio();
    if (animate) uniforms.uTime.value = state.clock.elapsedTime;
    const o = THREE.MathUtils.smoothstep(shared.uSnow.value, 0.5, 1) * 0.85;
    uniforms.uOpacity.value = o;
    if (ref.current) ref.current.visible = o > 0.01;
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <shaderMaterial uniforms={uniforms} vertexShader={snowVert} fragmentShader={snowFrag} transparent depthWrite={false} />
    </points>
  );
}
