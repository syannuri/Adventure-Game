/**
 * Shared wind animation for vegetation. Patches a standard material's vertex shader so
 * geometry sways based on its local height and the instance position (cheap, GPU only).
 */
import type * as THREE from 'three';

export const windUniforms = { uTime: { value: 0 } };

export function windify<T extends THREE.Material>(mat: T, amp = 0.08, heightScale = 1): T {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.vertexShader =
      'uniform float uTime;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #else
          vec3 ip = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #endif
        float wh = max(transformed.y, 0.0) * ${heightScale.toFixed(3)};
        float ww = sin(uTime * 1.6 + ip.x * 0.33 + ip.z * 0.21) * 0.65 + sin(uTime * 3.3 + ip.x * 0.9 + ip.z * 0.4) * 0.25;
        transformed.x += ww * wh * wh * ${amp.toFixed(4)};
        transformed.z += cos(uTime * 1.25 + ip.z * 0.37) * wh * wh * ${(amp * 0.6).toFixed(4)};`,
      );
  };
  mat.customProgramCacheKey = () => `wind-${amp}-${heightScale}`;
  return mat;
}
