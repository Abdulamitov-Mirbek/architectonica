'use client';

import { Environment } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ANCHORS, House, houseState } from './House';
import { shared } from './shaders';
import { GrassTufts, Ground, makeSkyUniforms, Mountains, Neighbours, Sky, Snowfall, Trees } from './World';

export type Season = 'summer' | 'winter';
export const CHAPTERS = ['hero', 'overview', 'solar', 'greenRoof', 'overhang', 'groundLoop', 'heatPump'] as const;
export type ChapterId = (typeof CHAPTERS)[number];

/** Scroll position in chapters (0 = hero, 1 = overview, …) plus pointer offset, written by the page. */
export type StoryInput = { p: number; px: number; py: number };

type Shot = { pos: [number, number, number]; target: [number, number, number] };
const SHOTS: Record<ChapterId, Shot> = {
  hero: { pos: [-18, 4.4, 26], target: [1.4, 3.6, 1.5] },
  overview: { pos: [-21, 25, 31], target: [2, 0.5, 3] },
  solar: { pos: [-9.5, 12.5, 12], target: [-4.2, 4.6, -1.4] },
  greenRoof: { pos: [13.5, 11.5, -9.5], target: [4, 4.2, 0.5] },
  overhang: { pos: [-6.8, 1.75, 15], target: [-3.1, 2.1, 4.5] },
  groundLoop: { pos: [-1.5, 10.5, 22.5], target: [5.5, -1.4, 9.2] },
  heatPump: { pos: [13.5, 2.5, 8.6], target: [7.4, 0.85, 3.3] },
};

/* Light & atmosphere. "mood" is golden hour (summer) / blue hour (winter);
   "noon" is used while the overhang chapter explains the sun angle. */
type Look = { top: string; horizon: string; sun: string; sunI: number; hemiSky: string; hemiGround: string; hemiI: number; fog: string; env: number; az: number; el: number };
const LOOKS: Record<'summerMood' | 'winterMood' | 'summerNoon' | 'winterNoon', Look> = {
  summerMood: { top: '#3a6797', horizon: '#f0c79c', sun: '#ffd2a0', sunI: 5, hemiSky: '#a8c0d8', hemiGround: '#5d5838', hemiI: 1.3, fog: '#d9c4aa', env: 1.1, az: -0.78, el: 0.38 },
  winterMood: { top: '#1d2c4a', horizon: '#c8a7b2', sun: '#ffa27c', sunI: 2.2, hemiSky: '#7d93ba', hemiGround: '#cdd5e1', hemiI: 1.1, fog: '#a9a6ba', env: 0.8, az: -1.0, el: 0.11 },
  summerNoon: { top: '#4a82bd', horizon: '#d4e4f0', sun: '#fff4e2', sunI: 5.2, hemiSky: '#bad2e8', hemiGround: '#6a6849', hemiI: 1.4, fog: '#cad9e5', env: 1.2, az: 0, el: THREE.MathUtils.degToRad(69) },
  winterNoon: { top: '#6890bb', horizon: '#e0e7ee', sun: '#fff0dc', sunI: 4, hemiSky: '#c2d1e3', hemiGround: '#e6ebf1', hemiI: 1.3, fog: '#dbe3ea', env: 1.1, az: 0, el: THREE.MathUtils.degToRad(26) },
};

const smooth = (x: number, a: number, b: number) => THREE.MathUtils.smoothstep(x, a, b);
const tmp = [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()];
function mixColor(out: THREE.Color, a: string, b: string, c: string, d: string, season: number, noon: number) {
  tmp[0].set(a).lerp(tmp[1].set(b), season);
  tmp[2].set(c).lerp(tmp[3].set(d), season);
  return out.copy(tmp[0]).lerp(tmp[2], noon);
}
function mixNum(k: keyof Look, season: number, noon: number) {
  const mood = THREE.MathUtils.lerp(LOOKS.summerMood[k] as number, LOOKS.winterMood[k] as number, season);
  const nn = THREE.MathUtils.lerp(LOOKS.summerNoon[k] as number, LOOKS.winterNoon[k] as number, season);
  return THREE.MathUtils.lerp(mood, nn, noon);
}

function Rig({
  input,
  season,
  animate,
  marker,
  sky,
}: {
  input: React.RefObject<StoryInput>;
  season: Season;
  animate: boolean;
  marker: React.RefObject<HTMLDivElement | null>;
  sky: ReturnType<typeof makeSkyUniforms>;
}) {
  const { camera, size, scene } = useThree();
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const state = useRef({ mix: season === 'winter' ? 1 : 0, pos: new THREE.Vector3(...SHOTS.hero.pos), target: new THREE.Vector3(...SHOTS.hero.target), first: true });
  const v = useMemo(() => ({ pos: new THREE.Vector3(), target: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), p: new THREE.Vector3(), lightTarget: new THREE.Object3D() }), []);
  const portrait = size.width / size.height < 0.9;
  const side = size.width >= 1024;

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    cam.fov = aspect < 0.7 ? 52 : aspect < 1.05 ? 44 : aspect < 1.4 ? 38 : 34;
    cam.far = 3000;
    if (side) cam.setViewOffset(size.width, size.height, -size.width * 0.21, 0, size.width, size.height);
    else cam.setViewOffset(size.width, size.height, 0, size.height * (portrait ? 0.17 : 0.1), size.width, size.height);
    cam.updateProjectionMatrix();
  }, [camera, size, side, portrait]);

  useEffect(() => {
    scene.fog = new THREE.Fog('#d9c4aa', 80, 1250);
    scene.add(v.lightTarget);
    v.lightTarget.position.set(2, 0, 3);
    if (sun.current) sun.current.target = v.lightTarget;
    return () => {
      scene.fog = null;
      scene.remove(v.lightTarget);
    };
  }, [scene, v]);

  useFrame((st, dt) => {
    dt = Math.min(dt, 0.1);
    const s = state.current;
    const inp = input.current!;
    const p = THREE.MathUtils.clamp(inp.p, 0, CHAPTERS.length - 1);

    // season blend
    s.mix = THREE.MathUtils.damp(s.mix, season === 'winter' ? 1 : 0, 2.2, dt);
    shared.uSnow.value = s.mix;
    if (animate) shared.uTime.value += dt;

    // chapter weights
    const noon = Math.max(0, 1 - Math.abs(p - 4) * 1.4);
    shared.uOpen.value = smooth(p, 4.35, 4.95);
    houseState.dusk = THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.4, 1, s.mix), 0.04, noon);

    // camera: hold on each shot, travel between them
    const i = Math.min(Math.floor(p), CHAPTERS.length - 2);
    const f = smooth(p - i, 0.15, 0.85);
    const A = SHOTS[CHAPTERS[i]];
    const B = SHOTS[CHAPTERS[i + 1]];
    v.pos.set(...A.pos).lerp(v.a.set(...B.pos), f);
    v.target.set(...A.target).lerp(v.b.set(...B.target), f);
    // lift the path a little mid-flight so the camera never clips the house
    v.pos.y += Math.sin(f * Math.PI) * 2.5;
    if (portrait) v.pos.sub(v.target).multiplyScalar(1.55).add(v.target);
    if (animate) {
      const sway = Math.sin(st.clock.elapsedTime * 0.11) * 0.07 * Math.max(0, 1 - p);
      v.pos.sub(v.target).applyAxisAngle(THREE.Object3D.DEFAULT_UP, sway).add(v.target);
    }
    v.pos.x += inp.px * 0.6;
    v.pos.y += inp.py * 0.3;

    if (s.first) {
      s.pos.copy(v.pos);
      s.target.copy(v.target);
      s.first = false;
    }
    const k = 1 - Math.exp(-(animate ? 3.2 : 12) * dt);
    s.pos.lerp(v.pos, k);
    s.target.lerp(v.target, k);
    camera.position.copy(s.pos);
    camera.lookAt(s.target);

    // sun & sky
    const az = mixNum('az', s.mix, noon);
    const el = mixNum('el', s.mix, noon);
    const dir = v.p.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    if (sun.current) {
      sun.current.position.copy(v.lightTarget.position).addScaledVector(dir, 80);
      mixColor(sun.current.color, LOOKS.summerMood.sun, LOOKS.winterMood.sun, LOOKS.summerNoon.sun, LOOKS.winterNoon.sun, s.mix, noon);
      sun.current.intensity = mixNum('sunI', s.mix, noon);
    }
    if (hemi.current) {
      mixColor(hemi.current.color, LOOKS.summerMood.hemiSky, LOOKS.winterMood.hemiSky, LOOKS.summerNoon.hemiSky, LOOKS.winterNoon.hemiSky, s.mix, noon);
      mixColor(hemi.current.groundColor, LOOKS.summerMood.hemiGround, LOOKS.winterMood.hemiGround, LOOKS.summerNoon.hemiGround, LOOKS.winterNoon.hemiGround, s.mix, noon);
      hemi.current.intensity = mixNum('hemiI', s.mix, noon);
    }
    sky.uSunDir.value.copy(dir);
    mixColor(sky.uTop.value, LOOKS.summerMood.top, LOOKS.winterMood.top, LOOKS.summerNoon.top, LOOKS.winterNoon.top, s.mix, noon);
    mixColor(sky.uHorizon.value, LOOKS.summerMood.horizon, LOOKS.winterMood.horizon, LOOKS.summerNoon.horizon, LOOKS.winterNoon.horizon, s.mix, noon);
    mixColor(sky.uSun.value, LOOKS.summerMood.sun, LOOKS.winterMood.sun, LOOKS.summerNoon.sun, LOOKS.winterNoon.sun, s.mix, noon);
    if (scene.fog) mixColor((scene.fog as THREE.Fog).color, LOOKS.summerMood.fog, LOOKS.winterMood.fog, LOOKS.summerNoon.fog, LOOKS.winterNoon.fog, s.mix, noon);
    scene.environmentIntensity = mixNum('env', s.mix, noon);

    // overlay marker on the feature in focus
    const el2 = marker.current;
    if (el2) {
      const n = Math.round(p);
      const id = CHAPTERS[n];
      const anchor = id in ANCHORS ? ANCHORS[id as keyof typeof ANCHORS] : null;
      let o = anchor ? Math.max(0, 1 - Math.abs(p - n) * 3.2) : 0;
      if (anchor) {
        v.p.copy(anchor).project(camera);
        if (v.p.z > 1) o = 0;
        const x = (v.p.x * 0.5 + 0.5) * size.width;
        const y = (-v.p.y * 0.5 + 0.5) * size.height;
        el2.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
      el2.style.opacity = o.toFixed(3);
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={['#a8c0d8', '#5d5838', 0.75]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={3}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
        shadow-radius={3}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={200}
      />
    </>
  );
}

function Reflections({ season }: { season: Season }) {
  // A static sky per season feeds the reflections in glass, metal and PV panels.
  const uniforms = useMemo(() => {
    const u = makeSkyUniforms();
    const L = season === 'winter' ? LOOKS.winterMood : LOOKS.summerMood;
    u.uTop.value.set(L.top);
    u.uHorizon.value.set(L.horizon);
    u.uSun.value.set(L.sun);
    u.uSunDir.value.set(Math.sin(L.az) * Math.cos(L.el), Math.sin(L.el), Math.cos(L.az) * Math.cos(L.el));
    return u;
  }, [season]);
  return (
    <Environment key={season} frames={1} resolution={128}>
      <Sky uniforms={uniforms} radius={100} />
      <mesh position={[0, -40, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial color={season === 'winter' ? '#c9d0db' : '#55573c'} />
      </mesh>
    </Environment>
  );
}

export default function StoryScene({
  input,
  season,
  running,
  reducedMotion,
  hq,
  marker,
  onReady,
}: {
  input: React.RefObject<StoryInput>;
  season: Season;
  running: boolean;
  reducedMotion: boolean;
  hq: boolean;
  marker: React.RefObject<HTMLDivElement | null>;
  onReady: () => void;
}) {
  const sky = useMemo(() => makeSkyUniforms(), []);
  return (
    <Canvas
      shadows
      dpr={hq ? [1, 1.75] : [1, 1.5]}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ position: SHOTS.hero.pos, fov: 34, near: 0.5, far: 3000 }}
      frameloop={running ? 'always' : 'never'}
      onCreated={() => requestAnimationFrame(() => requestAnimationFrame(onReady))}
      aria-hidden
    >
      <Rig input={input} season={season} animate={!reducedMotion} marker={marker} sky={sky} />
      <Reflections season={season} />
      <Sky uniforms={sky} />
      <Mountains />
      <Ground />
      <GrassTufts count={hq ? 16000 : 7000} />
      <Trees />
      <Neighbours />
      <House />
      <Snowfall animate={!reducedMotion} />
      {hq ? (
        <EffectComposer multisampling={4} enableNormalPass={false}>
          <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.25} intensity={0.65} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.3} darkness={0.5} />
        </EffectComposer>
      ) : (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.25} intensity={0.6} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  );
}
