# Asset manifest

Every asset in the game, where it comes from, and whether it is final or a placeholder.

**Summary:** the game loads **no external 3D models, textures, images or audio files**. Everything visual or
audible is generated in code at runtime. The only external resources it loads are the Google Fonts below. The
repository also contains one design reference image, which the game does not load.

## External assets

| Asset | Source | License | Used for |
| --- | --- | --- | --- |
| Anett character reference image (`docs/anett-reference.jpg`) | Provided by the project owner | Project owner's | Design reference only. Not loaded by the game. |
| "Baloo 2" font | Google Fonts (loaded in `index.html`) | SIL Open Font License 1.1 | All UI text. Falls back to system fonts offline. |
| "Luckiest Guy" font | Google Fonts | Apache License 2.0 | Title logo and big game headings |
| "Fredoka" font | Google Fonts | SIL Open Font License 1.1 | Logo ribbon subtitle |

## Generated assets (code)

| Asset | File | Status |
| --- | --- | --- |
| Anett 3D model + joint rig | `src/components/characters/Anett/AnettModel.tsx` | **Placeholder.** Procedural geometry matching `docs/anett-reference.jpg` (generated wavy hair mass, curved hair locks, painted amber iris texture). To be replaced by a sculpted, rigged GLB. |
| Anett animations (13) | `src/components/characters/Anett/AnettAnimations.ts` | **Placeholder.** Procedural poses. To be replaced or augmented by GLTF/Mixamo clips. |
| Lumi (fairy), Pip (rabbit), Olli (owl), ambient bunnies, ducks, butterflies, birds | `src/components/characters/npc/*`, `worlds/EnchantedForest/Critters.tsx` | **Placeholder** procedural models |
| Terrain, trees, hero trees, grass, flowers, mushrooms, rocks, mushroom house, platforms, hollow log, chests, wand, stars, acorns | `src/components/worlds/EnchantedForest/*`, `gameplay/collectibles/*` | Procedural (stylized). Can stay, or be swapped for modeled props. |
| Sky dome, clouds, water and waterfall shaders, wind shader | `Sky.tsx`, `Water.tsx`, `effects/wind.ts` | Procedural |
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
- Use `docs/anett-reference.jpg` plus Anett's palette (`ANETT_PALETTE` in `AnettModel.tsx`) as the reference for any sculpted model.
