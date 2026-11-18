# Asset manifest

Every asset in the game, where it comes from, and whether it is final or a placeholder.

**Summary:** apart from the Anet cover illustration on the main menu (provided by the project owner), the game
loads **no external 3D models, textures, images or audio files**. Everything else visual or audible is generated in
code at runtime. The only external resources it loads are the Google Fonts below. The
repository also contains the design reference images in `docs/`.

## External assets

| Asset | Source | License | Used for |
| --- | --- | --- | --- |
| Anet character reference image (`docs/anett-reference.jpg`) | Provided by the project owner | Project owner's | Design reference only. Not loaded by the game. |
| Anet cover illustration (`docs/anet-cover-source.png`) | Provided by the project owner | Project owner's | Cut out (background removed with the open-source BiRefNet model via `rembg`) into `public/cover/anet-720.webp` and `anet-1300.webp`: the main-menu cover figure. |
| "Baloo 2" font | Google Fonts (loaded in `index.html`) | SIL Open Font License 1.1 | All UI text. Falls back to system fonts offline. |
| "Luckiest Guy" font | Google Fonts | Apache License 2.0 | Title logo and big game headings |
| "Fredoka" font | Google Fonts | SIL Open Font License 1.1 | Logo ribbon subtitle |

## Generated assets (code)

| Asset | File | Status |
| --- | --- | --- |
| Anet HD 3D model (sculpted, textured, skinned) | `public/models/anet.glb` (~1 MB), rig data `src/components/characters/Anett/anetRig.json`, loader `AnettHD.tsx` | **Final for now.** Generated from the cover illustration with Krea: an A-pose turnaround image (Nano Banana Pro, `docs/anet-apose.jpg`), then image-to-3D (Tripo H3.1). Simplified to ~67k triangles and auto-skinned to the game rig with `tools/anet-rig/` (see its README). Generated for this project; check Krea's terms before commercial release. |
| App / bookmark icons (`apple-touch-icon.png`, `icon-192/512.png`, `icon-maskable-512.png`, `favicon-32/64.png`) | `public/`, source `docs/anet-icon-3d.jpg` | 3D render of Anet made with Krea (Nano Banana Pro, using the cover and A-pose art as reference). Sizes are generated with `node tools/make-icons.mjs docs/anet-icon-3d.jpg public`. |
| Anet procedural model + joint rig | `src/components/characters/Anett/AnettModel.tsx` | Fallback. Shown while the HD model downloads, if it can't load, or with `?procedural`. Its joint groups drive the HD skeleton. |
| Anet animations (13) | `src/components/characters/Anett/AnettAnimations.ts` | Procedural poses, which drive both the HD model and the fallback model. Could later be swapped for or augmented with mocap/Mixamo clips. |
| Lumi (fairy), Pip (rabbit), Olli (owl), ambient bunnies, ducks, butterflies, birds | `src/components/characters/npc/*`, `worlds/EnchantedForest/Critters.tsx` | **Placeholder** procedural models |
| Terrain, trees, hero trees, grass, flowers, mushrooms, rocks, mushroom house, platforms, hollow log, chests, wand, stars, acorns | `src/components/worlds/EnchantedForest/*`, `gameplay/collectibles/*` | Procedural (stylized). Can stay, or be swapped for modeled props. |
| Sky dome, clouds, water and waterfall shaders, wind shader | `Sky.tsx`, `Water.tsx`, `effects/wind.ts` | Procedural |
| Hair strand normal map, ground noise shader, world-card and story illustrations (`ui/WorldArt.tsx`) | `AnettModel.tsx`, `Terrain.tsx`, `ui/WorldArt.tsx` | Procedural / hand-written SVG |
| Particle sprites (glow, twinkle) and the menu's magic-map texture | `effects/textures.ts`, `MenuScene.tsx` (canvas-drawn) | Procedural |
| Dialogue portraits (Anett, Lumi, Pip, Olli) | `src/components/ui/Portraits.tsx` (inline SVG) | **Placeholder** illustrations |
| Story intro illustrations | `src/components/ui/StoryIntro.tsx` (inline SVG + emoji) | **Placeholder** illustrations |
| Music: menu, forest, victory | `src/components/audio/audioEngine.ts` (Web Audio synthesis) | Original. **Placeholder** for recorded music. |
| Sound effects: star, coin, jump, land, footstep, talk, pop, click, achievement, magic, chest, whoosh | `audioEngine.ts` | Original synthesized. **Placeholder** for recorded SFX. |
| Ambience: waterfall, wind, birdsong | `audioEngine.ts` | Original synthesized |

## Emoji

The world-select cards, a few buttons and the story intro use system emoji characters (🌳 🍭 💎 🐢 🏰 👋 📖 ⚙ 🗺). They
render with the player's operating-system font and are not bundled with the game.

## Adding real assets later

- Put GLB/GLTF models in `public/models/`, textures in `public/textures/` and audio in `public/audio/`, then add
  each one to this file with its source and license.
- Use `docs/anett-reference.jpg` plus Anet's palette (`ANETT_PALETTE` in `AnettModel.tsx`) as the reference for any sculpted model.
