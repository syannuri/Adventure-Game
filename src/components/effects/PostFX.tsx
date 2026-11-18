import { EffectComposer, Bloom, Vignette, ToneMapping, SMAA, N8AO } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

/** Bloom/glow, vignette and filmic tone mapping. Disabled on the "Fast" graphics setting. */
export function PostFX({ quality }: { quality: 'high' | 'low' }) {
  if (quality === 'low') return null;
  return (
    <EffectComposer multisampling={0}>
      {/* soft ambient occlusion: contact shadows under props, depth between trees */}
      <N8AO aoRadius={1.1} intensity={1.6} distanceFalloff={0.6} halfRes color="#1d2a1a" />
      <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.82} luminanceSmoothing={0.2} radius={0.7} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette offset={0.32} darkness={0.42} />
      <SMAA />
    </EffectComposer>
  );
}
