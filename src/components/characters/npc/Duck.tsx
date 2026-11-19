/** A simple duck (adult: white, duckling: small and yellow). Position/animation come from the parent. */
import { forwardRef } from 'react';
import * as THREE from 'three';

export const Duck = forwardRef<THREE.Group, { baby?: boolean; scale?: number }>(function Duck({ baby = false, scale = 1 }, ref) {
  const body = baby ? '#ffe27a' : '#ffffff';
  return (
    <group ref={ref} scale={scale * (baby ? 0.55 : 1)}>
      <mesh position={[0, 0.14, 0]} scale={[0.9, 0.66, 1.25]} castShadow>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshStandardMaterial color={body} roughness={0.7} />
      </mesh>
      {/* little tail and wings */}
      <mesh position={[0, 0.22, -0.26]} rotation={[0.8, 0, 0]} scale={[0.5, 0.3, 0.6]}>
        <coneGeometry args={[0.12, 0.2, 8]} />
        <meshStandardMaterial color={body} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0.17 * s, 0.17, -0.02]} scale={[0.25, 0.5, 0.9]}>
          <sphereGeometry args={[0.18, 10, 8]} />
          <meshStandardMaterial color={baby ? '#ffd23f' : '#eef2f4'} />
        </mesh>
      ))}
      <group position={[0, 0.34, 0.2]}>
        <mesh castShadow>
          <sphereGeometry args={[0.13, 16, 12]} />
          <meshStandardMaterial color={body} />
        </mesh>
        <mesh position={[0, -0.02, 0.13]} scale={[1, 0.4, 1.2]}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshStandardMaterial color="#ff9a3c" />
        </mesh>
        {[1, -1].map((s) => (
          <group key={s}>
            <mesh position={[0.065 * s, 0.04, 0.1]}>
              <sphereGeometry args={[0.022, 8, 6]} />
              <meshStandardMaterial color="#1a1414" />
            </mesh>
            <mesh position={[0.07 * s, 0.05, 0.118]}>
              <sphereGeometry args={[0.007, 6, 4]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
        {baby && (
          <mesh position={[0, 0.13, 0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.025, 0.08, 6]} />
            <meshStandardMaterial color="#ffd23f" />
          </mesh>
        )}
      </group>
      {!baby && (
        // orange feet
        [1, -1].map((s) => (
          <mesh key={s} position={[0.07 * s, 0.01, 0.04]} scale={[1, 0.25, 1.4]}>
            <sphereGeometry args={[0.05, 8, 6]} />
            <meshStandardMaterial color="#ff9a3c" />
          </mesh>
        ))
      )}
    </group>
  );
});
