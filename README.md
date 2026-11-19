# Anet: The Magical Adventure

A 3D adventure game for children aged 5–10, built with **React + TypeScript + Three.js (React Three Fiber)**.

Anet is a seven-year-old girl who finds a magical map in her grandmother's treasure box. The map leads to five
secret lands. Each land has a mission, friendly creatures, puzzles and a Magic Star. Collect all five stars to open
the legendary Crystal Castle.

> **Languages:** Bahasa Indonesia (default) and English. Switch with the **ID / EN** button on the main menu or in Settings.
>
> **Current status: World 1 (Enchanted Forest), World 2 (Candy Village) and World 3 (Crystal Cave) are playable.**
> Worlds 4–5 are shown on the map as "Coming soon". See [Status](#status) for what's done, what's a placeholder and what's next.

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
3. When all five are found, a cinematic shows a beam of light near the waterfall. The wand is there, locked
   in magic vines.
4. **Colour flower puzzle:** touch the three magic flowers to change their colour (red → yellow → blue) until
   each matches the gem above it on the old stone. Matching flowers glow; when all three match, the vines melt away.
5. Pick up the wand (Anet carries it in her hand) and bring it back to Lumi.
6. Finale: the forest sparkles, Anet celebrates and the **Level Complete** screen awards the Magic Star.

Optional extras: 22 golden acorns, 3 hidden treasure chests (Olli the owl gives hints), and achievements.

**Side quest – hide-and-seek with Pip's little brothers:**
- Talk to Pip and he asks for help: three little bunnies (pink, green and yellow scarves) are hiding behind a bush, in
  the fallen log and behind the giant lantern tree.
- The closer Anet gets, the louder and faster they giggle, and their ears peek out. Pip gives a hint for the next one.
- Each found bunny hops out and follows Anet in a line. Bring all three back to Pip for the *Bunny Buddy* badge.
- The HUD shows "Pip's little brothers n / 3" under the mission.

**Lumi's singing flowers (memory game):**
- North of Lumi's glade, five giant flowers stand in a ring around a magic bud. Each sings its own note (C D E G A).
- Touch the bud and the flowers sing a song. Then step on the flowers in the same order, like a giant piano.
- Songs grow from 3 to 4 to 5 notes. A wrong flower just means "let's listen again", with no penalty.
- After all three songs: the *Flower Singer* badge, and the flowers stay playable for free play.

**Kiki's shop (spend golden acorns):**
- Golden acorns now go into Anet's pouch and are kept between games (shown as 👜 next to the acorn counter).
- Kiki the squirrel has a little stall beside the path into the glade. The first visit comes with a welcome gift of
  5 acorns. Finding Pip's brothers and singing the flower songs each give 5 more.
- Things to buy:
  - hair: star clip, big pink bow, flower crown, acorn cap
  - face: heart glasses
  - backpack: star charm, or a pink, sky-blue or mint backpack
- Bought items are worn right away on the 3D model. Each one can be worn or taken off again, and they are saved.
  New badge: *Stylish Explorer*.

**Lily-pad hop:** on the west side of the pond, jump from lily pad to lily pad to a little island with a golden lotus
(+5 acorns, *Lily Hopper* badge). Missing a pad is just a splash: Anet pops back onto the nearest shore.

**Bring the ducklings home:** Mama Duck waits on the south shore of the pond. Her four ducklings are lost in the
forest and peep louder as Anet gets close. Found ducklings waddle along behind Anet. Bring all four back and the
family goes swimming with Papa Duck (+5 acorns, *Duck Helper* badge).

**Animal sticker book:** the first time Anet walks up close to an animal, a camera flash takes its picture for the
sticker book. Animals: fairy, rabbit, owl, squirrel, duck, duckling, butterfly and bunny in the forest, plus the
gingerbread chef in Candy Village. Open the book from the main menu (top right) or the pause menu. Each animal shows
its name in both Bahasa Indonesia and English. Filling the book unlocks *Sticker Collector*.

**Spring mushroom:** under the giant lantern tree in the east stands a wobbly blue mushroom. Landing on it bounces
Anet high up onto a leafy branch, where a glowing lantern treasure waits (+5 acorns, *Spring Jumper* badge).

**Anet's magic garden:** in a clearing east of the glade there are three raised beds: a sunflower, a berry bush and a
rainbow flower. Plant a seed, take the watering can from the tree stump and water it. When done, put the can back on the
stump (it also goes back by itself if Anet wanders far away with it). The can is filled at the pond
and holds water for three plants. A watered plant grows one step (seed, sprout, bud, bloom) after a short wait, shown
by a ring of green dots, and then it is thirsty again (a blue drop floats above it). The garden is saved and keeps
growing while Anet is away. A blooming plant can be picked for +3 acorns and planted again. A bee visits the
flowers and goes in the sticker book. Badges: *Little Gardener* (first bloom) and *Rainbow Garden* (all three).

**Leaf race on the stream:** a little stream runs from a spring in the north-west hills down into the pond (Anet can
wade through it). At the top a duck waits beside a big leaf. Hop on and race the duck to the pond. A 3-2-1 countdown
starts the race. Then steer left and right to pop 12 bubbles and push forward to go faster. Bumping one of the mossy
rocks only slows the leaf down. The race bar shows the time, the bubbles, and where the duck and the leaf are. At the
finish Anet hops onto the bank and says her time; a new best time is saved. The first race gives +5 acorns. Badges:
*Leaf Racer* (beat the duck) and *Bubble Catcher* (all 12 bubbles in one race).

**Anet's tree house:** at the south end of the main path (behind the start) stands a big oak with a plan board. The
tree house is built in four steps with twig bundles and golden acorns from the pouch:

1. floor and ladder (2 twigs, 5 acorns)
2. a little house with a red roof (3 twigs, 8 acorns)
3. railing, a flag and fairy lights (2 twigs, 5 acorns)
4. a swing (6 acorns)

The 7 twig bundles, tied with a pink ribbon, lie around the forest. The next part is always shown as a see-through
blueprint. Anet climbs the ladder up and down, and swings on the swing. Progress is saved, and the HUD shows what the
next part still needs. Badges: *Tree House Builder* and *Swing High*.

**Picnic for the forest friends:** a checked blanket and an empty basket wait in a clearing in the east. Anet finds
the picnic food lying around the forest: a carrot, bread, a walnut, an apple, and honey once Grumble is a friend.
A soft beam of light marks each one. Back at the blanket the friends arrive: Pip, a duck, Kiki and Olli, and
Grumble after his chapter. Each has a thought bubble showing the food they like. Pick a food up from the blanket
and give it to the right friend. A wrong food is never a failure: the friend kindly describes what they would like,
and the food goes back. When everyone has eaten there is a dance party (+5 acorns the first time, *Picnic Host*
badge).

**Rain and the rainbow (daytime):** about a minute after arriving, a gentle rain shower passes over the forest. The
sky turns grey, the light dims, rain falls with a soft rain sound and puddles form on the paths. When it stops,
the camera looks up at a big rainbow in the sky, but its colours are pale: seven colour drops fell into the
forest. Find red, orange, yellow, green, blue, indigo and violet; each one is named when it is found and lights up
its band of the rainbow (+5 acorns the first time, *Rainbow Hunter* badge). Jumping into puddles makes a big
splash: five different puddles give the *Puddle Jumper* badge.

**Olli's animal riddles:** Olli asks three riddles, for example "I am white and round, I swim on the pond and say
quack quack!". Walking up to the right animal answers each one: the duck, the butterfly, the squirrel. Solving all
three gives +5 acorns and the *Clever Explorer* badge. The HUD shows the riddle number while one is open.

**Night forest (after finishing World 1):** the Enchanted Forest card on the world map gets a *🌙 Night forest*
button.
- The forest at night: moonlight, a starry sky, glowing lantern trees and green fireflies everywhere.
- Lumi's Light Party: catch 10 fireflies in a jar and light the 5 lantern posts beside the paths. Then go back to
  Lumi and set the fireflies free in a glowing finale (*Light Bringer* badge).
- All the side quests can be played at night too.

**Grumble, the messy monster (after finishing World 1):** the Enchanted Forest card also gets a *👾 Grumble*
button. Grumble (*Si Kusut*) is a round, fuzzy purple monster: cheeky, never scary.
1. **Trouble:** Grumble put thorny bushes on three paths and took Lumi's bells. Anet has Lumi's wand: its light
   shrinks each thorny bush away.
2. **Chase:** Grumble hides around the forest (the map marker shows where). Catch him four times; each time he
   gives back a bell and vanishes in a puff of purple smoke.
3. **The Great Forest Match** in the flower meadow, three games:
   - a leaf race down the stream against Grumble
   - catching fireflies (whoever catches more in 30 seconds)
   - tug of war (press Space / E or tap *PULL!* quickly)

   Win two games to be champion. A score board shows the games won. Losing the match means a friendly rematch, and
   Grumble gets a little slower every time Anet loses a game, so every child wins in the end.
4. **Friends:** Grumble only made a mess because he was lonely. He becomes everyone's friend and there is a party.
   Badges: *Forest Champion* and *Monster Friend*; Grumble goes in the sticker book.

## World 2 – Candy Village

**Mission:** help Koko the gingerbread chef find the missing candy ingredients so he can bake the Rainbow Cake.

1. Walk up the cream path to the giant cupcake bakery and talk to Koko.
2. Find the **5 ingredients** (Pip the rabbit came along and gives hints):
   - the strawberry, in the strawberry field
   - the chocolate, on the cookie bridge over the chocolate river
   - the honey, on top of the donut tower (jump from donut to donut)
   - the sugar crystals, on the big cake across the river (climb the marshmallows)
   - the mint leaf, in the candy-cane garden

   The chocolate river is shallow, so Anet can also wade through it.
3. Bring them back to Koko.
4. **Candy sorting puzzle:** pick up a candy from the stands (it floats above Anet's head) and put it in the jar with
   the same colour and shape: pink hearts, yellow stars, blue gumballs.
   - A wrong jar is never a failure: the candy hops back and Anet says which jar it needs.
   - The jar that matches the carried candy glows.
5. The candy machine bakes the **Rainbow Cake**, and the party finale awards the Magic Star.

Optional extras: 20 peppermints, 3 gift boxes, and new achievements (Candy Hero, Sorting Star, Donut Hopper,
Peppermint Collector). **Play** on the main menu continues with the first world that isn't finished yet.
Progress (completed worlds, Magic Stars, achievements, best scores, settings) is saved in browser storage.

## World 3 – Crystal Cave

**Mission:** help Drako the baby dragon light up his cave again.

1. Walk down the glowing path to the dark Heart Crystal and talk to Drako. He is sad and can't fly.
2. Find the **5 little crystals** (Pip the rabbit gives hints):
   - on the tall stone pillars in the east (jump from pillar to pillar)
   - on the shore of the glowing lake in the west
   - in the glowing mushroom grove in the south-east
   - on the high ledge in the north-east
   - at the end of the path in the north
3. Bring them back. Drako sets them around the Heart Crystal.
4. **Light-beam puzzle:** a sunbeam falls through a hole in the roof onto a prism. Touch each of the three mirror
   crystals to turn it a quarter turn. The beam shows how far it gets, and a mirror lights up when it sends the
   light on to the next one. When all three face the right way, the beam reaches the Heart Crystal.
5. The whole cave lights up, Drako flies again, and the Magic Star is awarded.

Optional extras: 20 gems, 3 treasure chests, bats and Drako for the sticker book, and new achievements (Crystal
Keeper, Light Master, Gem Collector, Pillar Climber).

## Features in this build

- **Anet (HD):** a sculpted, fully textured 3D model made from the main-menu cover illustration
  [`docs/anet-cover-source.png`](docs/anet-cover-source.png): long straight dark hair with a centre part, fair skin,
  big dark-brown eyes, a yellow-and-white striped T-shirt, a mustard corduroy pinafore dress with
  metal clips and pockets, pink socks, tan hiking boots with pink laces, plus her khaki adventure backpack.
  - Pipeline: an A-pose turnaround image (Krea, Nano Banana Pro) → image-to-3D (Krea, Tripo H3.1) →
    simplify and auto-skin to the game's joint rig ([`tools/anet-rig`](tools/anet-rig/README.md)).
  - The file `public/models/anet.glb` is about 1 MB (meshopt + WebP).
  - The procedural model is the fallback: it shows while the HD model loads, if loading fails, or
    with `?procedural` in the URL. One shared rig, so she moves the same way in every scene.
  - Face: eyelids that blink and squint when she smiles, and a mouth that opens when she talks,
    laughs or is surprised. Both are driven by the same expression values as the procedural face.
    Use `?view=face&face=closed` (or `face=open`) to review them.
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
- **Living main menu:** a painted golden-hour sky appears instantly. A moment later a **3D layer** fades in over it:
  - the five worlds float as little animated 3D islands: the forest with swaying trees and a waterfall, the
    candy village with spinning lollipops and a cupcake house, the crystal cave with glowing crystals, the ocean
    with a swimming turtle, and the sky castle with waving flags
  - they fly in one after another; locked worlds wear a golden padlock, finished ones a spinning star
  - tapping an island makes it bounce with sparkles and shows its name
  - a trail of fairy dust links the worlds in order, and Lumi flies loops along it with a sparkly tail
  - 3D clouds drift past, a flock of birds crosses the sky, and butterflies and petals drift over the meadow
  - everything moves with a gentle 3D parallax that follows the mouse or finger
  - phones get their own island layout around Anet
  - without WebGL (or with `?flat`) the painted menu with its 2D islands stays

  Also on the menu: Anet hops and talks when tapped, a "next adventure" card, a pulsing Play button that continues
  with the first unfinished world, and the Magic Stars collected so far.
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
- **Child-friendly:** no violence, no scary enemies, no punishment and no "game over": a game that is lost can
  always be tried again (and gets a little easier). No monetization. The language is positive and hints appear
  when a child seems stuck.

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
        AnetModel.tsx        procedural rigged character (joint hierarchy; fallback model)
        AnettHD.tsx           sculpted GLB model skinned to the same joints (public/models/anet.glb)
        AnetAnimations.ts    pose library (13 animations)
        AnetAnimator.ts      state machine + blend tree + damping + blinking
        AnetController.tsx   movement, jumping, collisions, emotes
      npc/                    Fairy (Lumi), Rabbit (Pip), Owl (Olli), Squirrel (Kiki), Dragon (Drako)
    worlds/
      EnchantedForest/        layout.ts (map data), Terrain, Sky, Trees, Vegetation, Water, Props, Critters
      CandyVillage/           layout.ts, CandyTerrain (ground + chocolate river), CandyProps, candyTextures
      CrystalCave/            layout.ts, CaveScene (floor, dome, crystals, glowing lake, pillars, bats)
      shared/Lights.tsx       sun + rim light used by every world
      MenuScene/              3D layer of the home screen (Menu3D) and the character review scene
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
  and a `build…Physics()` that registers its colliders. To add a world:
  1. Add a folder under `worlds/` and a mission under `gameplay/missions/`.
  2. Add its HUD entry (counters, minimap, objective, hints) in `data/worldHud.ts`.
  3. Set `built: true` in `data/worlds.ts` and route to it in `GameView.tsx`.
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
| World 2 – Candy Village | ✅ Playable from start to finish (Koko the chef, 5 ingredients, candy sorting puzzle) |
| World 3 – Crystal Cave | ✅ Playable from start to finish (Drako the baby dragon, 5 crystals, light-beam puzzle) |
| Anet character + 13 animations | ✅ Sculpted HD model (GLB, auto-skinned), procedural model as fallback |
| NPCs (fairy, rabbit, owl) | ✅ Procedural models |
| Dialogue, quest, collectibles, achievements, saving | ✅ |
| Menus, HUD, minimap, settings, pause, level complete | ✅ |
| Keyboard + touch controls | ✅ (touch verified only in device emulation) |
| Music and SFX | ✅ Original, synthesized at runtime (placeholder for recorded audio) |
| Puzzles | ✅ Colour flower puzzle (World 1), candy sorting puzzle (World 2), light-beam mirror puzzle (World 3) |
| Baby dragon NPC | ✅ Drako (procedural model) |
| Cloud creature NPC | ⏳ Planned for World 5 |
| Worlds 4–5 (Ocean Kingdom, Sky Castle) | ⏳ Not built – shown as "Coming soon" |
| Crystal Castle finale | ⏳ Not built |
| Cosmetics / unlockable characters | ⏳ Not built (progress tracking is in place) |
| Native Android / iOS builds | ⏳ Not set up – the web build works in mobile browsers; wrap with Capacitor later |

## Roadmap

2. Real blend-shape facial animation for the HD model (it now has blinking/squinting eyelids and an opening mouth).
5. World 4 – Ocean Kingdom (swimming movement, rescue the baby sea turtle).
6. World 5 – Sky Castle (floating islands, rainbow bridges, Crystal Castle finale).
7. Recorded music and voice lines; Capacitor packaging for Android and iOS.
