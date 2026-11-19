/**
 * Kiki's shop (World 1): golden acorns are kept in Anet's pouch between games and can be traded
 * for things Anet wears (see data/cosmetics.ts). Talking to Kiki opens the shop panel.
 */
import { useEffect } from 'react';
import { useGame } from '../../../systems/store';
import { registerInteractable } from '../interaction/interactions';
import { SHOP, terrainHeight } from '../../worlds/EnchantedForest/layout';
import { forestDialogue as D } from '../../../data/forestDialogue';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { tr } from '../../../i18n';
import { KikiShop } from '../../characters/npc/Squirrel';

/** Add acorns to the pouch with a happy toast (side-quest rewards, Kiki's welcome gift). */
export function rewardAcorns(n: number) {
  const g = useGame.getState();
  g.addAcorns(n);
  audio.sfx('coin', { pitch: 1.2 });
  useGame.setState((s) => ({ toasts: [...s.toasts, { id: Date.now() + Math.random(), title: tr().toasts.acornGift, text: tr().toasts.acornGiftText(n), icon: '●' }] }));
  const id = useGame.getState().toasts.at(-1)!.id;
  window.setTimeout(() => useGame.getState().dismissToast(id), 2800);
}

export function openShop() {
  const g = useGame.getState();
  g.setPaused(true);
  g.setOverlay('shop');
}

const front = { x: SHOP.x + Math.sin(SHOP.rot) * 1.1, z: SHOP.z + Math.cos(SHOP.rot) * 1.1 };

export function KikiShopQuest() {
  useEffect(
    () =>
      registerInteractable({
        id: 'kiki',
        x: front.x,
        z: front.z,
        radius: 2.4,
        approach: 1.0,
        label: () => tr().prompts.shop,
        verb: 'talk',
        enabled: () => true,
        onInteract: () => {
          const g = useGame.getState();
          if (!g.save.metKiki) {
            g.openDialogue(D().kikiHello, () => {
              const s = useGame.getState();
              s.setMetKiki();
              rewardAcorns(5);
              spawnBurst(SHOP.x, terrainHeight(SHOP.x, SHOP.z) + 1.4, SHOP.z, '#ffd36b', 30, { speed: 2.5 });
              window.setTimeout(openShop, 900);
            });
          } else {
            g.openDialogue(D().kikiAgain, openShop);
          }
        },
      }),
    [],
  );
  return <KikiShop x={SHOP.x} y={terrainHeight(SHOP.x, SHOP.z)} z={SHOP.z} rot={SHOP.rot} />;
}
