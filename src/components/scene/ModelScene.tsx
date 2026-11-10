'use client';

import { Environment, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, SMAA, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ANCHORS, House, houseState } from './House';
import { shared } from './shaders';
import { GrassTufts, Ground, makeSkyUniforms, Mountains, Neighbours, Sky, Snowfall, Trees } from './World';

export type Season = 'summer' | 'winter';
export const PARTS = ['sun', 'shield', 'loop', 'pump'] as const;
export type PartId = (typeof PARTS)[number];

/* The visitor turns the model by hand. A hotspot click flies the camera to that part;
   after that the controls are theirs again. */

const ANCHOR: Record<PartId, THREE.Vector3> = {
  sun: ANCHORS.solar,
  shield: ANCHORS.overhang,
  loop: ANCHORS.groundLoop,
  pump: ANCHORS.heatPump,
};
type Shot = { pos: [number, number, number]; target: [number, number, number] };
const HOME: Shot = { pos: [-19, 15, 27], target: [2, 0.6, 3.5] };
const SHOTS: Record<PartId, Shot> = {
  sun: { pos: [-9.5, 12.5, 12], target: [-4.2, 4.6, -1.4] },
  shield: { pos: [-6.8, 2.4, 15], target: [-3.1, 2.1, 4.5] },
  loop: { pos: [-1.5, 10.5, 22.5], target: [5.5, -1.4, 9.2] },
  pump: { pos: [13.5, 2.8, 9.5], target: [7.4, 0.85, 3.3] },
};

type Look = { top: string; horizon: string; sun: string; sunI: number; hemiSky: string; hemiGround: string; hemiI: number; fog: string; env: number; az: number; el: number };
const LOOK: Record<Season, Look> = {
  summer: { top: '#3f78b0', horizon: '#e9d7bc', sun: '#ffe2bd', sunI: 5, hemiSky: '#b2c9df', hemiGround: '#62603f', hemiI: 1.35, fog: '#d6d2c4', env: 1.15, az: -0.6, el: 0.62 },
  winter: { top: '#2a4166', horizon: '#d2c0c6', sun: '#ffc3a0', sunI: 3, hemiSky: '#9aaccb', hemiGround: '#d9dfe8', hemiI: 1.2, fog: '#c3c3cf', env: 0.95, az: -0.8, el: 0.3 },
};
const c1 = new THREE.Color();
const c2 = new THREE.Color();
const mixC = (out: THREE.Color, k: keyof Look, t: number) => out.copy(c1.set(LOOK.summer[k] as string)).lerp(c2.set(LOOK.winter[k] as string), t);
const mixN = (k: keyof Look, t: number) => THREE.MathUtils.lerp(LOOK.summer[k] as number, LOOK.winter[k] as number, t);

function Rig({
  season,
  animate,
  focus,
  markers,
  sky,
}: {
  season: Season;
  animate: boolean;
  focus: { id: PartId | null; n: number };
  markers: React.RefObject<(HTMLElement | null)[]>;
  sky: ReturnType<typeof makeSkyUniforms>;
}) {
  const { camera, size, scene, gl, clock } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const st = useRef({ mix: season === 'winter' ? 1 : 0, fly: null as Shot | null, idleAt: 0 });
  const v = useMemo(() => ({ p: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), target: new THREE.Object3D() }), []);
  const portrait = size.width / size.height < 0.9;

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = portrait ? 46 : 32;
    cam.updateProjectionMatrix();
  }, [camera, portrait]);

  // vertical swipes keep scrolling the page on phones; sideways drags turn the model
  useEffect(() => {
    gl.domElement.style.touchAction = 'pan-y';
  });

  useEffect(() => {
    scene.fog = new THREE.Fog(LOOK.summer.fog, 90, 1250);
    scene.add(v.target);
    v.target.position.set(2, 0, 3);
    if (sun.current) sun.current.target = v.target;
    shared.uOpen.value = 1; // the ground loop is always shown in its trench here
    return () => {
      scene.fog = null;
      scene.remove(v.target);
    };
  }, [scene, v]);

  // hotspot click: fly to the part
  useEffect(() => {
    if (focus.id) st.current.fly = SHOTS[focus.id];
    else if (focus.n > 0) st.current.fly = HOME;
  }, [focus]);

  useFrame((state, dt) => {
    dt = Math.min(dt, 0.1);
    const s = st.current;
    s.mix = THREE.MathUtils.damp(s.mix, season === 'winter' ? 1 : 0, 2.2, dt);
    shared.uSnow.value = s.mix;
    if (animate) shared.uTime.value += dt;
    houseState.dusk = THREE.MathUtils.lerp(0.2, 0.75, s.mix);

    const ctl = controls.current;
    if (ctl && s.fly) {
      const k = 1 - Math.exp(-(animate ? 3 : 14) * dt);
      const scale = portrait ? 1.35 : 1;
      v.a.set(...s.fly.target);
      v.b.set(...s.fly.pos).sub(v.a).multiplyScalar(scale).add(v.a);
      ctl.target.lerp(v.a, k);
      camera.position.lerp(v.b, k);
      if (camera.position.distanceTo(v.b) < 0.05) s.fly = null;
    }
    if (ctl) {
      ctl.autoRotate = animate && !s.fly && state.clock.elapsedTime > s.idleAt;
      ctl.update();
    }

    // light & sky
    const az = mixN('az', s.mix);
    const el = mixN('el', s.mix);
    const dir = v.p.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    if (sun.current) {
      sun.current.position.copy(v.target.position).addScaledVector(dir, 80);
      mixC(sun.current.color, 'sun', s.mix);
      sun.current.intensity = mixN('sunI', s.mix);
    }
    if (hemi.current) {
      mixC(hemi.current.color, 'hemiSky', s.mix);
      mixC(hemi.current.groundColor, 'hemiGround', s.mix);
      hemi.current.intensity = mixN('hemiI', s.mix);
    }
    sky.uSunDir.value.copy(dir);
    mixC(sky.uTop.value, 'top', s.mix);
    mixC(sky.uHorizon.value, 'horizon', s.mix);
    mixC(sky.uSun.value, 'sun', s.mix);
    if (scene.fog) mixC((scene.fog as THREE.Fog).color, 'fog', s.mix);
    scene.environmentIntensity = mixN('env', s.mix);

    // DOM hotspots follow their anchors
    const els = markers.current;
    if (els)
      PARTS.forEach((id, i) => {
        const el2 = els[i];
        if (!el2) return;
        v.a.copy(ANCHOR[id]).project(camera);
        const visible = v.a.z < 1 && Math.abs(v.a.x) < 1.05 && Math.abs(v.a.y) < 1.05;
        el2.style.transform = `translate3d(${((v.a.x * 0.5 + 0.5) * size.width).toFixed(1)}px, ${((-v.a.y * 0.5 + 0.5) * size.height).toFixed(1)}px, 0)`;
        el2.style.opacity = visible ? '1' : '0';
        el2.style.pointerEvents = visible ? 'auto' : 'none';
      });
  });

  return (
    <>
      <OrbitControls
        ref={controls}
        makeDefault
        target={HOME.target}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        autoRotateSpeed={0.35}
        minPolarAngle={0.45}
        maxPolarAngle={1.38}
        onStart={() => {
          st.current.fly = null;
          st.current.idleAt = Infinity;
        }}
        onEnd={() => {
          st.current.idleAt = clock.elapsedTime + 5; // spin again after 5 s untouched
        }}
      />
      <hemisphereLight ref={hemi} args={['#b2c9df', '#62603f', 1.35]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={5}
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
  const uniforms = useMemo(() => {
    const u = makeSkyUniforms();
    const L = LOOK[season];
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

export default function ModelScene({
  season,
  running,
  reducedMotion,
  hq,
  focus,
  markers,
  onReady,
}: {
  season: Season;
  running: boolean;
  reducedMotion: boolean;
  hq: boolean;
  focus: { id: PartId | null; n: number };
  markers: React.RefObject<(HTMLElement | null)[]>;
  onReady: () => void;
}) {
  const sky = useMemo(() => makeSkyUniforms(), []);
  return (
    <Canvas
      shadows
      dpr={hq ? [1, 1.75] : [1, 1.5]}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ position: HOME.pos, fov: 32, near: 0.5, far: 3000 }}
      frameloop={running ? 'always' : 'never'}
      onCreated={() => requestAnimationFrame(() => requestAnimationFrame(onReady))}
    >
      <Rig season={season} animate={!reducedMotion} focus={focus} markers={markers} sky={sky} />
      <Reflections season={season} />
      <Sky uniforms={sky} />
      <Mountains />
      <Ground />
      <GrassTufts count={hq ? 9000 : 4000} />
      <Trees />
      <Neighbours />
      <House />
      <Snowfall animate={!reducedMotion} />
      <EffectComposer multisampling={hq ? 4 : 0} enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.25} intensity={0.55} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}
