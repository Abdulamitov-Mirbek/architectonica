import * as THREE from 'three';

/** Uniforms shared by every patched material, updated once per frame. */
export const shared = {
  uSnow: { value: 0 }, // 0 summer → 1 winter
  uOpen: { value: 0 }, // ground cut-away over the geothermal loop
  uTime: { value: 0 },
  uHole: { value: new THREE.Vector4(1.5, 6.5, 9.5, 12) }, // xMin, zMin, xMax, zMax
};

type Shader = THREE.WebGLProgramParametersWithUniforms;

/**
 * Snow settles on surfaces that face up. `min`/`max` are the world-normal Y range
 * over which coverage fades in (a spruce cone needs a lower threshold than a roof).
 */
export function snowify<T extends THREE.MeshStandardMaterial>(
  mat: T,
  { min = 0.45, max = 0.8, key = 'snow', extra }: { min?: number; max?: number; key?: string; extra?: (s: Shader) => void } = {},
) {
  mat.onBeforeCompile = (s) => {
    s.uniforms.uSnow = shared.uSnow;
    s.fragmentShader = s.fragmentShader
      .replace('void main() {', 'uniform float uSnow;\nvoid main() {')
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          float sUp = inverseTransformDirection(normal, viewMatrix).y;
          float sAmt = uSnow * smoothstep(${min.toFixed(3)}, ${max.toFixed(3)}, sUp);
          // keep a trace of the surface underneath so snow is not a flat fill
          float sLum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
          vec3 snowCol = vec3(0.86, 0.9, 0.95) * (0.9 + 0.25 * clamp(sLum * 2.0, 0.0, 1.0));
          diffuseColor.rgb = mix(diffuseColor.rgb, snowCol, sAmt);
          roughnessFactor = mix(roughnessFactor, 0.75, sAmt);
          metalnessFactor = mix(metalnessFactor, 0.0, sAmt);
        }`,
      );
    extra?.(s);
  };
  mat.customProgramCacheKey = () => `${key}-${min}-${max}`;
  return mat;
}

/** Ground: snow + a dissolving cut-out that reveals the excavation with the ground loop. */
export function groundShader(s: Shader) {
  s.uniforms.uOpen = shared.uOpen;
  s.uniforms.uHole = shared.uHole;
  s.vertexShader = s.vertexShader
    .replace('void main() {', 'varying vec3 vGWorld;\nvoid main() {')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  s.fragmentShader = s.fragmentShader
    .replace('void main() {', 'varying vec3 vGWorld;\nuniform float uOpen;\nuniform vec4 uHole;\nvoid main() {')
    .replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
      if (uOpen > 0.001 && vGWorld.x > uHole.x && vGWorld.x < uHole.z && vGWorld.z > uHole.y && vGWorld.z < uHole.w) {
        vec2 cell = floor(vGWorld.xz * 3.0);
        float n = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
        if (n < uOpen * 1.02) discard;
      }`,
    );
}
