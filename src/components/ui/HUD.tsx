import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../systems/store';
import { player } from '../../systems/playerState';
import { COINS, FAIRY_POS, PATHS, POND, STARS, TREASURES } from '../worlds/EnchantedForest/layout';
import { FOREST_HINTS, forestObjective } from '../gameplay/missions/forestObjective';
import { audio } from '../audio/audioEngine';
import { cameraState } from '../../systems/playerState';
import { useT } from '../../i18n/useT';

function Counter({ ico, color, value, total }: { ico: string; color: string; value: number; total: number }) {
  const [bump, setBump] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      setBump(true);
      const t = setTimeout(() => setBump(false), 400);
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <div className={'counter' + (bump ? ' bump' : '')}>
      <span className="ico" style={{ background: color }}>
        {ico}
      </span>
      {value}
      <span style={{ opacity: 0.45, fontSize: '0.8em' }}>/{total}</span>
    </div>
  );
}

const MAP_R = 42;

function Minimap() {
  const svg = useRef<SVGSVGElement>(null);
  const playerG = useRef<SVGGElement>(null);
  const target = useRef<SVGCircleElement>(null);
  const world = useRef<SVGGElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const g = useGame.getState();
      const obj = forestObjective(g.level.stage, g.level.stars);
      // map rotates with the camera so "up" is always forward
      const rot = (cameraState.yaw * 180) / Math.PI;
      world.current?.setAttribute('transform', `rotate(${rot}) translate(${-player.position.x} ${-player.position.z})`);
      playerG.current?.setAttribute('transform', `rotate(${rot + 180 - (player.facing * 180) / Math.PI})`);
      if (target.current) {
        if (obj.target) {
          target.current.setAttribute('cx', String(obj.target.x));
          target.current.setAttribute('cy', String(obj.target.z));
          target.current.style.display = '';
        } else target.current.style.display = 'none';
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="minimap" aria-label="map">
      <svg ref={svg} viewBox={`${-22} ${-22} 44 44`} width="100%" height="100%">
        <g ref={world}>
          <circle cx={0} cy={0} r={MAP_R} fill="#bfe6a8" />
          {PATHS.map((p, i) => (
            <polyline key={i} points={p.map(([x, z]) => `${x},${z}`).join(' ')} fill="none" stroke="#e7cd98" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          <circle cx={POND.x} cy={POND.z} r={POND.r} fill="#7fd0e0" />
          <circle cx={FAIRY_POS.x} cy={FAIRY_POS.z} r={1.6} fill="#b8a2ff" />
          <circle ref={target} r={2.2} fill="#ff5fa8" stroke="white" strokeWidth={0.8}>
            <animate attributeName="r" values="1.8;3;1.8" dur="1.2s" repeatCount="indefinite" />
          </circle>
        </g>
        <g ref={playerG}>
          <path d="M0 -3.2 L2.4 2.4 L0 1.2 L-2.4 2.4 Z" fill="#f7a800" stroke="white" strokeWidth={0.7} />
        </g>
      </svg>
    </div>
  );
}

export function HUD() {
  const level = useGame((s) => s.level);
  const prompt = useGame((s) => s.prompt);
  const dialogue = useGame((s) => s.dialogue);
  const toasts = useGame((s) => s.toasts);
  const cinematic = useGame((s) => s.cinematic);
  const t = useT();
  const setPaused = useGame((s) => s.setPaused);
  const [objText, setObjText] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const iv = setInterval(() => {
      const g = useGame.getState();
      setObjText(forestObjective(g.level.stage, g.level.stars).text);
      const idle = performance.now() - g.level.lastProgressAt;
      setHint(!g.dialogue && !g.cinematic && idle > 45000 && g.level.stage !== 'done' ? FOREST_HINTS()[g.level.stage] : null);
    }, 300);
    return () => clearInterval(iv);
  }, []);

  const worldReady = useGame((s) => s.worldReady);
  const showIntroBanner = cinematic?.kind === 'intro';
  if (!worldReady)
    return (
      <div className="loading">
        <div style={{ textAlign: 'center' }}>
          <div className="loading-star">★</div>
          {t.hud.loading}
        </div>
      </div>
    );
  const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

  return (
    <>
      {!showIntroBanner && (
        <div className="hud-top">
          <div className="counters">
            <Counter ico="★" color="#f2a900" value={level.stars.length} total={STARS.length} />
            <Counter ico="●" color="#c77a10" value={level.coins.length} total={COINS.length} />
            <Counter ico="◆" color="#3fb7e0" value={level.treasures.length} total={TREASURES.length} />
          </div>
          <div className="objective passthrough">
            <small>{t.hud.mission}</small>
            <span className="objective-text">{objText}</span>
          </div>
          <div className="hud-right">
            <button
              className="icon-btn"
              aria-label={t.hud.pause}
              onClick={() => {
                audio.sfx('click');
                setPaused(true);
              }}
            >
              ❚❚
            </button>
            <Minimap />
          </div>
        </div>
      )}
      {showIntroBanner && (
        <div className="world-banner passthrough">
          <small>{t.hud.worldN(1)}</small>
          <div>{t.worlds['enchanted-forest'].name}</div>
        </div>
      )}
      {prompt && !dialogue && (
        <div className="prompt passthrough">
          {!isTouch && <span className="key">E</span>}
          {prompt}
        </div>
      )}
      {hint && <div className="hint passthrough">💡 {hint}</div>}
      <div className="toasts passthrough">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <div className="badge">{t.icon}</div>
            <div>
              <b>{t.title}</b>
              <span>{t.text}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
