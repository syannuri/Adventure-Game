# Anet: The Magical Adventure

A 3D adventure game for children aged 5–10, built with **React + TypeScript + Three.js (React Three Fiber)**.

Anet is a seven-year-old girl who finds a magical map in her grandmother's treasure box. The map leads to five
secret lands. Each land has a mission, friendly creatures, puzzles and a Magic Star. Collect all five stars to open
the legendary Crystal Castle.

> **Languages:** Bahasa Indonesia (default) and English. Switch with the **ID / EN** button on the main menu or in Settings.
>
> **Current status: playable vertical slice of World 1, the Enchanted Forest.** Worlds 2–5 are shown on the map as
> "Coming soon" and are not built yet. See [Status](#status) for what's done, what's a placeholder and what's next.

---

## Play online

**https://syannuri.github.io/Adventure-Game/**

Every push to `main` builds the game and publishes it to the `gh-pages` branch (`.github/workflows/deploy.yml`).
If the site does not appear, enable it once: repository **Settings → Pages → Source: Deploy from a branch →
`gh-pages` / `(root)`**.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build on http://localhost:4173
```

Requirements: Node 18+ (developed on Node 22). Runs in any modern browser with WebGL 2.

## Controls

| Action | Keyboard / mouse | Touch (phone / tablet) |
| --- | --- | --- |
| Move | WASD or arrow keys | Virtual joystick (bottom left) |
| Run | Hold Shift, or press R to switch running on/off | Push the joystick further: a little = walk, far = run (the ring turns orange) |
| Jump | Space | Jump button |
| Talk / interact | E (or Enter) | Action button (pulses when something is nearby) |
| Look around | Drag with the mouse, wheel to zoom | Drag anywhere on the screen, pinch to zoom |
| Wave / dance | F / G | 👋 / ♪ buttons |
| Next dialogue line | Space, E, Enter or click | Tap the speech bubble |
| Pause | Esc or P, or the pause button | Pause button |

## World 1 – Enchanted Forest (the vertical slice)

**Mission:** help Lumi the fairy find her lost magic wand.

1. Follow the glowing path stones to Lumi in the middle of the forest and talk to her.
2. Find the **5 Wishing Stars**. They're hidden on top of giant mushrooms (jump from one to the next), on tall
   tree stumps, by the duck pond, in the flower meadow and on the stepping rocks. Pip the rabbit gives hints.
3. When all five are found, a cinematic shows a beam of light near the waterfall. The wand is there.
4. Pick up the wand (Anet carries it in her hand) and bring it back to Lumi.
5. Finale: the forest sparkles, Anet celebrates and the **Level Complete** screen awards the Magic Star.

Optional extras: 22 golden acorns, 3 hidden treasure chests (Olli the owl gives hints), 6 achievements.
Progress (completed worlds, Magic Stars, achievements, best scores, settings) is saved in browser storage.

## Features in this build

- **Anet:** a procedural, rigged, stylized 3D character built to match the main-menu cover illustration
  [`docs/anet-cover-source.png`](docs/anet-cover-source.png): long straight dark hair with a centre part, fair skin,
  big dark-brown eyes, a yellow-and-white striped T-shirt, a mustard corduroy pinafore (overall) dress with
  metal clips and pockets, pink socks, tan hiking boots with pink laces and her khaki adventure backpack. One shared model and palette, so she
  looks the same in every scene.
- **Animation system:** an animation state machine with a blend tree (idle ↔ walk ↔ run, by speed), jump/fall
  blending by vertical velocity, landing squash, and damped joint blending between all states. It also has an
  upper-body overlay layer for collecting. All 13 required animations are in: idle breathing, eye blinking,
  looking around, walk, run, jump, land, wave, dance, celebrate, surprise, collect and talk (NPC interaction).
- **Movement and physics:** camera-relative movement, acceleration, coyote time, jump buffering, gravity, ground
  and platform detection, landing detection, and circle collisions against trees, rocks, the pond and buildings.
- **Third-person camera:** smooth follow, mouse/touch orbit, zoom, gentle auto-follow, and collision with trees
  and terrain. Cinematics: world intro fly-in, wand reveal shot, and finale orbit.
- **Enchanted Forest:** height-mapped terrain with painted paths, instanced giant trees with wind sway, glowing
  hero trees with lanterns, a waterfall cascading into a pond, lily pads, ducks, butterflies, a bird flock,
  fireflies, a mushroom house, a glowing mushroom ring, magical path stones that brighten as stars are found,
  grass, flowers and a flower meadow.
- **NPCs:** Lumi the fairy (iridescent wings, sad → happy expression), Pip the rabbit and Olli the owl, plus
  ambient bunnies. All have idle and talking animations and face Anet when she's near.
- **Dialogue:** speech bubbles with SVG character portraits, typewriter text and voice "chirps".
- **UI:** animated main menu with 3D scene, storybook opening cinematic ("Anet discovers the map"), world
  select map, character introduction, settings (music volume, sound volume, graphics quality), pause menu, HUD
  (star, acorn and treasure counters, mission objective, rotating minimap with objective marker), achievement
  toasts, idle hints, loading screen and the level complete screen.
- **Audio:** an original soundtrack and sound effects, synthesized at runtime with the Web Audio API: menu,
  forest and victory music, sparkle and collect sounds, footsteps, jump and land sounds, dialogue chirps,
  waterfall ambience that gets louder near the falls, wind, and random birdsong.
- **Graphics:** PBR materials, image-based lighting from procedural light-formers, soft directional shadows that
  follow the player, atmospheric fog, bloom, vignette, neutral tone mapping, a gradient sky with sun glow and
  clouds, water shaders and particle systems. A **"Fast" graphics mode** is the default on touch devices: no
  post-processing, lower resolution, fewer grass and flower instances, and no tree shadows.
- **Child-friendly:** no violence, no enemies, no failure states, no monetization. The language is positive and
  hints appear when a child seems stuck.

## Project structure

```
src/
  App.tsx                     screen routing, canvas, overlays
  main.tsx, styles.css
  systems/                    game-wide state & engine-agnostic systems
    store.ts                  Zustand game state (screens, level progress, dialogue, cinematics, achievements)
    save.ts                   localStorage persistence (fails safely)
    input.ts                  unified keyboard + touch input
    physics.ts                height-field ground, platforms, circle colliders, camera ray checks
    playerState.ts            per-frame player & camera data shared across systems
  data/                       worlds, achievements, dialogue text
  i18n/                       languages: id.ts (Bahasa Indonesia), en.ts (English), useT() hook
  utils/math.ts
  components/
    characters/
      Anet/
        AnetModel.tsx        procedural rigged character (joint hierarchy)
        AnetAnimations.ts    pose library (13 animations)
        AnetAnimator.ts      state machine + blend tree + damping + blinking
        AnetController.tsx   movement, jumping, collisions, emotes
      npc/                    Fairy (Lumi), Rabbit (Pip), Owl (Olli)
    worlds/
      EnchantedForest/        layout.ts (map data), Terrain, Sky, Trees, Vegetation, Water, Props, Critters
      MenuScene/              3D backdrop for the menus
    gameplay/
      interaction/            interactable registry + proximity/approach system
      collectibles/           Wishing Stars, acorns, treasure chests, wand
      missions/               ForestQuest (the mission state machine), objectives & hints
    camera/FollowCamera.tsx
    ui/                       menus, HUD + minimap, dialogue, story intro, touch controls, level complete
    audio/audioEngine.ts      procedural music + SFX + ambience
    effects/                  bloom/post FX, particle bursts, wind shader, generated textures
```

## Architecture notes

- **Rendering vs. game state.** React state (Zustand) holds things that change rarely: screen, quest stage,
  collected items, dialogue. Values that change every frame (player position, camera) live in plain mutable
  objects (`systems/playerState.ts`), so the game doesn't re-render React at 60 fps.
- **Worlds are data plus components.** Each world has a `layout.ts` (height function, positions, collectibles)
  and a `build…Physics()` that registers its colliders. To add a world, add a folder under `worlds/`, a mission
  under `gameplay/missions/`, set `built: true` in `data/worlds.ts` and route to it in `App.tsx`.
- **Swapping in real art.** `AnetModel` exposes the same joint names a Mixamo/Blender rig would use (hips, spine,
  neck, shoulders, elbows, legs, knees). A GLB model can replace it. Map its bones in `applyPose`, or use GLTF
  clips with an `AnimationMixer` and keep the controller and state machine as they are.
- **Debug helpers.** `window.__anett` exposes the store, player and input for automated tests. Add `?capture` to
  the URL to keep the WebGL drawing buffer for screenshots, and `#closeup` for a close-up "photo mode" of Anet on
  the menu. **Character review mode:** `?view=face`, `?view=front`, `?view=side` or `?view=back` hides the menus
  and shows Anet standing still from that angle, for comparing with the reference image. Add `&pose=surprise` (or `celebrate`, `wave`, `dance`, `talk`) to review facial expressions.

## Testing

This build was verified by driving the production build in headless Chromium with Playwright:

- A **full scripted playthrough**: Play → story → intro cinematic → walk, run and jump → talk to Lumi → open a
  chest → talk to Pip and Olli → collect all 5 Wishing Stars (including the mushroom jumps) → wand reveal
  cinematic → pick up the wand → return it → finale → Level Complete → save written → world map. No console or
  page errors.
- Screenshots at desktop (1280×720), small landscape (720×405) and phone (iPhone 13, with touch controls).
- `npm run build` (TypeScript strict mode + Vite) passes.

Not yet verified: real mobile devices and frame rate on real GPUs. The test container only has software WebGL,
which is far too slow to measure performance.

## Status

| Area | Status |
| --- | --- |
| World 1 – Enchanted Forest | ✅ Playable from start to finish |
| Anet character + 13 animations | ✅ Procedural model (placeholder for a sculpted GLB, see `ASSETS.md`) |
| NPCs (fairy, rabbit, owl) | ✅ Procedural models |
| Dialogue, quest, collectibles, achievements, saving | ✅ |
| Menus, HUD, minimap, settings, pause, level complete | ✅ |
| Keyboard + touch controls | ✅ (touch verified only in device emulation) |
| Music and SFX | ✅ Original, synthesized at runtime (placeholder for recorded audio) |
| Puzzles (color matching, sorting, memory, crystal linking) | ⏳ Not built yet. World 1's mission is exploration + platforming + hidden objects |
| Baby dragon and cloud creature NPCs | ⏳ Planned for later worlds |
| Worlds 2–5 (Candy Village, Crystal Cave, Ocean Kingdom, Sky Castle) | ⏳ Not built – shown as "Coming soon" |
| Crystal Castle finale | ⏳ Not built |
| Cosmetics / unlockable characters | ⏳ Not built (progress tracking is in place) |
| Native Android / iOS builds | ⏳ Not set up – the web build works in mobile browsers; wrap with Capacitor later |

## Roadmap

1. Add a simple color-matching puzzle to the Enchanted Forest (glowing flowers that open the hollow log).
2. Replace the procedural Anet with a sculpted, rigged GLB (Blender, Tripo AI or Meshy, plus Mixamo
   animations), keeping the same palette and proportions.
3. World 2 – Candy Village (ingredient-collecting mission, sorting puzzle).
4. World 3 – Crystal Cave (crystal collecting, light-beam puzzle).
5. World 4 – Ocean Kingdom (swimming movement, rescue the baby sea turtle).
6. World 5 – Sky Castle (floating islands, rainbow bridges, Crystal Castle finale).
7. Recorded music and voice lines; Capacitor packaging for Android and iOS.
