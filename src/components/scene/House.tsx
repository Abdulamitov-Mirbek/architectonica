'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { shared, snowify } from './shaders';
import * as T from './textures';

/* Dimensions follow the built house: 14 × 9 m single storey, 3 m walls,
   1.15 m anthracite fascia, roof overhang 1 m on every side. */
const W = 14;
const D = 9;
const H = 3;
const WALL = 0.3;
const ROOF_T = 1.15;
const OVER = 1;
const ROOF_TOP = H + ROOF_T;

/** Live values the camera rig writes and the house reads every frame. */
export const houseState = { dusk: 0.4 };

/** Box with UVs in metres so one tiling texture lines up across all boxes. */
function box(w: number, h: number, d: number, scale: [number, number][] | number = 1) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const dims = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let f = 0; f < 6; f++) {
    const [su, sv] = typeof scale === 'number' ? [scale, scale] : scale[f];
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / su, (uv.getY(i) * dims[f][1]) / sv);
    }
  }
  return g;
}

type Opening = { u0: number; u1: number; v0: number; v1: number; kind: 'window' | 'door'; seed?: number; transom?: number };

type Mats = ReturnType<typeof useMaterials>;

function useMaterials() {
  return useMemo(() => {
    const terr = T.terrazzo();
    const interiors = [1, 2, 3].map((s) => {
      const tex = T.interior(s);
      return new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.5, color: '#3b3632', roughness: 1 });
    });
    return {
      wall: new THREE.MeshStandardMaterial({ map: terr, roughness: 0.92, color: '#f2f1ee' }),
      wallTop: snowify(new THREE.MeshStandardMaterial({ map: terr, roughness: 0.92 }), { key: 'wall' }),
      fascia: new THREE.MeshStandardMaterial({ map: T.fascia(), metalness: 0.55, roughness: 0.42, color: '#ffffff' }),
      membrane: snowify(new THREE.MeshStandardMaterial({ map: T.membrane(), roughness: 0.97 }), { key: 'roof' }),
      larch: new THREE.MeshStandardMaterial({ map: T.larch(), roughness: 0.7 }),
      cap: snowify(new THREE.MeshStandardMaterial({ color: '#33383d', metalness: 0.6, roughness: 0.35 }), { key: 'cap' }),
      frame: new THREE.MeshStandardMaterial({ color: '#25292d', metalness: 0.4, roughness: 0.45 }),
      door: new THREE.MeshStandardMaterial({ color: '#1f2327', metalness: 0.2, roughness: 0.55 }),
      glass: new THREE.MeshStandardMaterial({
        color: '#b9c6cf',
        metalness: 1,
        roughness: 0.04,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      interiors,
      concrete: snowify(new THREE.MeshStandardMaterial({ map: T.concrete(), roughness: 0.9 }), { key: 'concrete' }),
      gravel: snowify(new THREE.MeshStandardMaterial({ map: T.gravel(), roughness: 1 }), { key: 'gravel' }),
      sedum: snowify(new THREE.MeshStandardMaterial({ map: T.sedum(), roughness: 0.95 }), { key: 'sedum' }),
      tuft: snowify(new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), { min: 0.3, max: 0.6, key: 'tuft' }),
      solar: new THREE.MeshStandardMaterial({ map: T.solarCells(), metalness: 0.35, roughness: 0.18 }),
      alu: new THREE.MeshStandardMaterial({ color: '#b5bcc3', metalness: 0.8, roughness: 0.35 }),
      lampBody: new THREE.MeshStandardMaterial({ color: '#1c1f22', emissive: '#ffd59a', emissiveIntensity: 0 }),
      lampWash: new THREE.MeshBasicMaterial({
        map: T.lampWash(),
        color: '#ffc27a',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      pumpBody: snowify(new THREE.MeshStandardMaterial({ color: '#d9dcdf', metalness: 0.3, roughness: 0.5 }), { key: 'pump' }),
      grille: new THREE.MeshStandardMaterial({ map: T.grille(), metalness: 0.3, roughness: 0.5 }),
      pipe: new THREE.MeshStandardMaterial({ color: '#181a1c', roughness: 0.7 }),
      soil: new THREE.MeshStandardMaterial({ map: T.soil(), roughness: 1, side: THREE.BackSide }),
      soilFloor: new THREE.MeshStandardMaterial({ color: '#4c3b2c', roughness: 1, side: THREE.BackSide }),
    };
  }, []);
}

/** A wall built around its openings, so windows sit in real reveals. Local u runs along +x, outer face at z = 0. */
function Facade({
  m,
  start,
  rot,
  length,
  openings = [],
  children,
}: {
  m: Mats;
  start: [number, number];
  rot: number;
  length: number;
  openings?: Opening[];
  children?: React.ReactNode;
}) {
  const pieces = useMemo(() => {
    const out: { u0: number; u1: number; v0: number; v1: number }[] = [];
    const sorted = [...openings].sort((a, b) => a.u0 - b.u0);
    let u = 0;
    for (const o of sorted) {
      if (o.u0 > u) out.push({ u0: u, u1: o.u0, v0: 0, v1: H });
      if (o.v0 > 0) out.push({ u0: o.u0, u1: o.u1, v0: 0, v1: o.v0 });
      if (o.v1 < H) out.push({ u0: o.u0, u1: o.u1, v0: o.v1, v1: H });
      u = o.u1;
    }
    if (u < length) out.push({ u0: u, u1: length, v0: 0, v1: H });
    return out.map((p) => ({ ...p, geo: box(p.u1 - p.u0, p.v1 - p.v0, WALL, 1.5) }));
  }, [openings, length]);

  return (
    <group position={[start[0], 0, start[1]]} rotation-y={rot}>
      {pieces.map((p, i) => (
        <mesh
          key={i}
          geometry={p.geo}
          material={p.v1 === H ? m.wall : m.wallTop}
          position={[(p.u0 + p.u1) / 2, (p.v0 + p.v1) / 2, -WALL / 2]}
          castShadow
          receiveShadow
        />
      ))}
      {openings.map((o, i) => (
        <OpeningFill key={i} m={m} o={o} />
      ))}
      {children}
    </group>
  );
}

function OpeningFill({ m, o }: { m: Mats; o: Opening }) {
  const w = o.u1 - o.u0;
  const h = o.v1 - o.v0;
  const cx = (o.u0 + o.u1) / 2;
  const cy = (o.v0 + o.v1) / 2;
  const GZ = -0.11; // glass plane, set back in the reveal
  const f = 0.06; // frame profile
  const bars: [number, number, number, number][] = [
    [cx, o.v1 - f / 2, w, f],
    [cx, o.v0 + f / 2, w, f],
    [o.u0 + f / 2, cy, f, h],
    [o.u1 - f / 2, cy, f, h],
  ];
  if (o.kind === 'window') {
    if (w > 1.6) bars.push([cx, cy, 0.05, h]);
    const tr = o.transom ?? (h > 2 ? o.v1 - h * 0.24 : null);
    if (tr) bars.push([cx, tr, w, 0.05]);
  }
  const doorTop = o.transom ?? o.v1;
  return (
    <group>
      {/* the room behind the glass */}
      <mesh position={[cx, cy, -WALL + 0.02]} material={m.interiors[(o.seed ?? 0) % 3]}>
        <planeGeometry args={[w, h]} />
      </mesh>
      {o.kind === 'door' ? (
        <>
          <mesh position={[cx, (o.v0 + doorTop) / 2, GZ]} material={m.door} castShadow>
            <boxGeometry args={[w - 0.1, doorTop - o.v0 - 0.05, 0.05]} />
          </mesh>
          <mesh position={[cx, o.v0 + (doorTop - o.v0) * 0.72, GZ + 0.03]} material={m.glass}>
            <planeGeometry args={[w * 0.32, (doorTop - o.v0) * 0.3]} />
          </mesh>
          <mesh position={[o.u0 + w * 0.82, o.v0 + 1.05, GZ + 0.05]} material={m.alu}>
            <boxGeometry args={[0.03, 0.32, 0.04]} />
          </mesh>
          {doorTop < o.v1 && (
            <mesh position={[cx, (doorTop + o.v1) / 2, GZ]} material={m.glass}>
              <planeGeometry args={[w, o.v1 - doorTop]} />
            </mesh>
          )}
        </>
      ) : (
        <mesh position={[cx, cy, GZ]} material={m.glass}>
          <planeGeometry args={[w, h]} />
        </mesh>
      )}
      {bars.map(([x, y, bw, bh], i) => (
        <mesh key={i} position={[x, y, GZ]} material={m.frame} castShadow>
          <boxGeometry args={[bw, bh, 0.08]} />
        </mesh>
      ))}
      {o.kind === 'window' && (
        <mesh position={[cx, o.v0 - 0.02, 0.02]} material={m.cap} castShadow>
          <boxGeometry args={[w + 0.1, 0.04, 0.12]} />
        </mesh>
      )}
    </group>
  );
}

function Lamp({ m, u, v = 2.35 }: { m: Mats; u: number; v?: number }) {
  return (
    <group position={[u, v, 0]}>
      <mesh material={m.lampBody} position-z={0.05}>
        <boxGeometry args={[0.16, 0.08, 0.1]} />
      </mesh>
      <mesh material={m.lampWash} position-z={0.012} renderOrder={2}>
        <planeGeometry args={[0.9, 1.9]} />
      </mesh>
    </group>
  );
}

function Roof({ m }: { m: Mats }) {
  const geo = useMemo(() => {
    const fs: [number, number] = [2.4, 1.2];
    return box(W + OVER * 2, ROOF_T, D + OVER * 2, [fs, fs, [2, 2], [1.2, 1.2], fs, fs]);
  }, []);
  const mats = useMemo(() => [m.fascia, m.fascia, m.membrane, m.larch, m.fascia, m.fascia], [m]);
  return (
    <group>
      <mesh geometry={geo} material={mats} position-y={H + ROOF_T / 2} castShadow receiveShadow />
      <mesh material={m.cap} position-y={ROOF_TOP + 0.025} castShadow receiveShadow>
        <boxGeometry args={[W + OVER * 2 + 0.06, 0.05, D + OVER * 2 + 0.06]} />
      </mesh>
    </group>
  );
}

function SolarArray({ m }: { m: Mats }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const cols = 6;
  const rows = [-3.9, -1.5, 0.9];
  const tilt = THREE.MathUtils.degToRad(25);
  const xs = Array.from({ length: cols }, (_, i) => -7.0 + i * 1.1);
  const geo = useMemo(() => new THREE.BoxGeometry(1.05, 0.04, 1.75), []);
  const mats = useMemo(() => [m.alu, m.alu, m.solar, m.alu, m.alu, m.alu], [m]);
  useLayoutEffect(() => {
    const mat = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, 0, 0));
    let k = 0;
    for (const z of rows)
      for (const x of xs) {
        mat.compose(new THREE.Vector3(x, ROOF_TOP + 0.45, z), q, new THREE.Vector3(1, 1, 1));
        ref.current!.setMatrixAt(k++, mat);
      }
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  });
  const rowW = (cols - 1) * 1.1 + 1.05;
  const cx = xs[0] + (cols - 1) * 0.55;
  const rise = Math.sin(tilt) * 0.875;
  return (
    <group>
      <instancedMesh ref={ref} args={[geo, mats, rows.length * cols]} castShadow receiveShadow />
      {rows.map((z) => (
        <group key={z}>
          <mesh material={m.alu} position={[cx, ROOF_TOP + 0.45 - rise - 0.06, z + 0.8]} castShadow>
            <boxGeometry args={[rowW, 0.05, 0.05]} />
          </mesh>
          <mesh material={m.alu} position={[cx, ROOF_TOP + 0.45 + rise - 0.06, z - 0.8]} castShadow>
            <boxGeometry args={[rowW, 0.05, 0.05]} />
          </mesh>
          {[xs[0] - 0.5, cx, xs[cols - 1] + 0.5].map((x) => (
            <mesh key={x} material={m.alu} position={[x, ROOF_TOP + (0.45 + rise) / 2, z - 0.8]} castShadow>
              <boxGeometry args={[0.05, 0.45 + rise, 0.05]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function GreenRoof({ m }: { m: Mats }) {
  const x0 = 0.6;
  const x1 = W / 2 + OVER - 0.25;
  const z1 = D / 2 + OVER - 0.25;
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 2600;
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  useLayoutEffect(() => {
    const r = T.rng(31);
    const mat = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    const palette = ['#5f7a33', '#6f8a3a', '#8a5638', '#4d6a2b', '#97913f', '#66803a', '#58702f'];
    for (let i = 0; i < N; i++) {
      const s = 0.035 + r() * 0.06;
      q.setFromEuler(new THREE.Euler(r(), r() * 6, r()));
      const inDeck = (x: number, z: number) => x > 4.1 && x < 6.9 && z > 2.0 && z < 4.9;
      let x = 0;
      let z = 0;
      do {
        x = x0 + 0.2 + r() * (x1 - x0 - 0.4);
        z = -z1 + 0.2 + r() * (2 * z1 - 0.4);
      } while (inDeck(x, z));
      mat.compose(new THREE.Vector3(x, ROOF_TOP + 0.09, z), q, new THREE.Vector3(s * 1.5, s * 0.8, s * 1.5));
      ref.current!.setMatrixAt(i, mat);
      ref.current!.setColorAt(i, c.set(palette[Math.floor(r() * palette.length)]));
    }
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.instanceColor!.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  });
  return (
    <group>
      <mesh material={m.sedum} position={[(x0 + x1) / 2, ROOF_TOP + 0.06, 0]} receiveShadow>
        <boxGeometry args={[x1 - x0, 0.06, z1 * 2]} />
      </mesh>
      <instancedMesh ref={ref} args={[geo, m.tuft, N]} castShadow receiveShadow />
      {/* a small larch deck — the roof is also a place to sit */}
      <mesh material={m.larch} position={[5.5, ROOF_TOP + 0.12, 3.45]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.08, 2.9]} />
      </mesh>
    </group>
  );
}

function HeatPump({ m }: { m: Mats }) {
  const mats = useMemo(() => [m.grille, m.pumpBody, m.pumpBody, m.pumpBody, m.pumpBody, m.pumpBody], [m]);
  return (
    <group position={[W / 2 + 0.42, 0, 3.3]}>
      <mesh material={mats} position-y={0.62} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.95, 1.05]} />
      </mesh>
      {[-0.42, 0.42].map((z) => (
        <mesh key={z} material={m.frame} position={[0, 0.07, z]}>
          <boxGeometry args={[0.44, 0.14, 0.08]} />
        </mesh>
      ))}
      {[-0.2, 0.05].map((z) => (
        <mesh key={z} material={m.pipe} position={[-0.12, 0.05, z]}>
          <cylinderGeometry args={[0.045, 0.045, 0.4, 10]} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- geothermal loop in an excavation ---------- */

const PIT = { x0: 1.5, x1: 9.5, z0: 6.5, z1: 12, depth: 2.4 };

export function loopCurve() {
  const y = -PIT.depth + 0.35;
  const rows = [7.3, 8.1, 8.9, 9.7, 10.5, 11.3];
  const pts: THREE.Vector3[] = [new THREE.Vector3(7.6, 0.05, 6.75), new THREE.Vector3(7.6, y + 0.6, 6.8), new THREE.Vector3(7.6, y, 7.05)];
  rows.forEach((z, i) => {
    const a = i % 2 === 0 ? [7.6, 2.3] : [2.3, 8.7];
    pts.push(new THREE.Vector3(a[0], y, z), new THREE.Vector3(a[1], y, z));
  });
  pts.push(new THREE.Vector3(9.15, y, 11.0), new THREE.Vector3(9.15, y, 7.4), new THREE.Vector3(9.15, y + 0.6, 6.8), new THREE.Vector3(9.15, 0.05, 6.75));
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.15);
}

function GroundLoop({ m }: { m: Mats }) {
  const group = useRef<THREE.Group>(null);
  const dots = useRef<THREE.InstancedMesh>(null);
  const { curve, tube, glow, pit, pitMats } = useMemo(() => {
    const curve = loopCurve();
    const tube = new THREE.TubeGeometry(curve, 700, 0.07, 10, false);
    const glow = new THREE.TubeGeometry(curve, 300, 0.16, 8, false);
    // cold in (blue) → warmed by the ground (amber)
    const cA = new THREE.Color('#3aa0ff');
    const cB = new THREE.Color('#ff8a3d');
    for (const g of [tube, glow]) {
      const pos = g.attributes.position as THREE.BufferAttribute;
      const uv = g.attributes.uv as THREE.BufferAttribute;
      const col = new Float32Array(pos.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        c.copy(cA).lerp(cB, THREE.MathUtils.smoothstep(uv.getX(i), 0.08, 0.92)).multiplyScalar(1.8);
        col.set([c.r, c.g, c.b], i * 3);
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    const w = PIT.x1 - PIT.x0;
    const d = PIT.z1 - PIT.z0;
    const pit = box(w, PIT.depth, d, [
      [4, PIT.depth],
      [4, PIT.depth],
      [2, 2],
      [2, 2],
      [4, PIT.depth],
      [4, PIT.depth],
    ]);
    return { curve, tube, glow, pit, pitMats: [m.soil, m.soil, m.soilFloor, m.soilFloor, m.soil, m.soil] };
  }, [m]);
  const tubeMat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), []);
  const glowMat = useMemo(
    () => new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    [],
  );
  const dotMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 4, 4), toneMapped: false }), []);
  const N = 26;
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), p: new THREE.Vector3() }), []);
  useFrame((state) => {
    const open = shared.uOpen.value;
    if (group.current) group.current.visible = open > 0.01;
    if (!dots.current || open < 0.01) return;
    const t = shared.uTime.value;
    for (let i = 0; i < N; i++) {
      curve.getPointAt((i / N + t * 0.03) % 1, tmp.p);
      tmp.m.makeTranslation(tmp.p.x, tmp.p.y, tmp.p.z);
      dots.current.setMatrixAt(i, tmp.m);
    }
    dots.current.instanceMatrix.needsUpdate = true;
    void state;
  });
  return (
    <group ref={group} visible={false}>
      <mesh geometry={pit} material={pitMats} position={[(PIT.x0 + PIT.x1) / 2, -PIT.depth / 2 + 0.001, (PIT.z0 + PIT.z1) / 2]} receiveShadow />
      <mesh geometry={tube} material={tubeMat} />
      <mesh geometry={glow} material={glowMat} />
      <instancedMesh ref={dots} args={[undefined, dotMat, N]} frustumCulled={false}>
        <sphereGeometry args={[0.085, 10, 8]} />
      </instancedMesh>
    </group>
  );
}

/* ---------- the house ---------- */

const front: Opening[] = [{ u0: 2.4, u1: 4.8, v0: 0.3, v1: 2.7, kind: 'window', seed: 0 }];
const recess: Opening[] = [
  { u0: 0.5, u1: 1.5, v0: 0.14, v1: 2.25, kind: 'door', seed: 1 },
  { u0: 2.3, u1: 3.3, v0: 0.14, v1: 2.95, kind: 'door', seed: 2, transom: 2.4 },
];
const west: Opening[] = [
  { u0: 4.0, u1: 5.4, v0: 0.3, v1: 2.75, kind: 'window', seed: 1, transom: 2.15 },
  { u0: 7.15, u1: 7.75, v0: 0.3, v1: 2.75, kind: 'window', seed: 2, transom: 2.15 },
];
const east: Opening[] = [{ u0: 3.4, u1: 5.2, v0: 0.9, v1: 2.7, kind: 'window', seed: 0 }];
const back: Opening[] = [
  { u0: 2, u1: 3.6, v0: 0.9, v1: 2.7, kind: 'window', seed: 2 },
  { u0: 8, u1: 10.4, v0: 0.3, v1: 2.7, kind: 'window', seed: 1 },
];


export function House() {
  const m = useMaterials();

  useFrame(() => {
    const d = houseState.dusk;
    for (const im of m.interiors) im.emissiveIntensity = 0.12 + d * 1.9;
    m.lampBody.emissiveIntensity = d * 9;
    m.lampWash.opacity = d * 0.55;
  });

  const g = useMemo(
    () => ({
      gravel: box(W + OVER * 2, 0.04, D + OVER * 2, 1),
      footing: box(W + 0.16, 0.18, D + 0.16, 2),
      porch: box(8.6, 0.14, 1.7, 2),
      recessFloor: box(4, 0.14, 1.5, 2),
      step: box(7.6, 0.07, 0.4, 2),
      pier: box(0.6, 2.85, 0.04, 1.2),
      overDoor: box(1.4, 0.72, 0.04, 1.2),
      side: box(WALL, H, 1.5, 1.5),
    }),
    [],
  );

  return (
    <group>
      {/* footing, gravel drip strip, porch */}
      <mesh material={m.gravel} position-y={0.015} receiveShadow geometry={g.gravel} />
      <mesh material={m.concrete} position-y={0.04} receiveShadow castShadow geometry={g.footing} />
      <mesh material={m.concrete} position={[0.9, 0.07, 5.35]} receiveShadow castShadow geometry={g.porch} />
      <mesh material={m.concrete} position={[2.6, 0.07, 3.75]} receiveShadow geometry={g.recessFloor} />
      <mesh material={m.concrete} position={[0.95, 0.035, 6.4]} receiveShadow castShadow geometry={g.step} />

      {/* walls */}
      <Facade m={m} start={[-W / 2, D / 2]} rot={0} length={7.6} openings={front}>
        <Lamp m={m} u={1.75} />
        <Lamp m={m} u={5.45} />
      </Facade>
      <Facade m={m} start={[4.6, D / 2]} rot={0} length={2.4}>
        <mesh material={m.larch} position={[1.4, 1.58, 0.02]} geometry={g.pier} castShadow />
        <Lamp m={m} u={0.45} />
      </Facade>
      <Facade m={m} start={[0.6, 3.0]} rot={0} length={4.0} openings={recess}>
        <mesh material={m.larch} position={[1.0, 2.62, 0.02]} geometry={g.overDoor} />
        <Lamp m={m} u={1.9} v={2.5} />
      </Facade>
      {/* recess side walls */}
      <mesh material={m.wall} position={[0.75, H / 2, 3.75]} castShadow receiveShadow geometry={g.side} />
      <mesh material={m.wall} position={[4.45, H / 2, 3.75]} castShadow receiveShadow geometry={g.side} />
      <Facade m={m} start={[W / 2, D / 2]} rot={Math.PI / 2} length={D} openings={east} />
      <Facade m={m} start={[W / 2, -D / 2]} rot={Math.PI} length={W} openings={back} />
      <Facade m={m} start={[-W / 2, -D / 2]} rot={-Math.PI / 2} length={D} openings={west}>
        <Lamp m={m} u={6.3} />
      </Facade>

      <Roof m={m} />
      <SolarArray m={m} />
      <GreenRoof m={m} />
      <HeatPump m={m} />
      <GroundLoop m={m} />
    </group>
  );
}

/** Points the overlay marker attaches to, one per feature. */
export const ANCHORS = {
  solar: new THREE.Vector3(-4.3, ROOF_TOP + 0.9, -1.4),
  greenRoof: new THREE.Vector3(3.6, ROOF_TOP + 0.3, -1.6),
  overhang: new THREE.Vector3(-3.4, H - 0.05, D / 2 + OVER),
  groundLoop: new THREE.Vector3(5.4, -PIT.depth + 0.4, 9.3),
  heatPump: new THREE.Vector3(W / 2 + 0.45, 1.25, 3.3),
} as const;
