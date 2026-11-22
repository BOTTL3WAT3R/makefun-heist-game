# makefun-heist-game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/BOTTL3WAT3R/makefun-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/BOTTL3WAT3R/makefun-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**Aurum After Hours — the Sun Ledger job.** An original top-down heist game that shows one whole bank floor in a single frame: the Meridian Reserve Bank after closing. You are the thief in teal. Cross from the west service door to the east vault, lift the golden **Sun Ledger**, and get out through the south getaway dock before the alarm hits 100 and the floor locks down. Three guards sweep big amber vision cones along set patrols and two wall cameras sweep magenta cones; desks, pillars and safes carve real shadow zones out of every cone. Three routes cross the same floor — the marble dash under both cameras, the covered crawl behind the teller desks, and the north service corridor that needs the **glass-foam cutter** (2 charges, each cut raises the alarm floor) at a vent grille. A **chime decoy** (2 throws, click to toss) turns the nearest guard for four seconds at a small alarm cost. Three optional deposit bags reward leaving cover. The alarm rises in any cone, falls in full cover, and once the Ledger is lifted it can never fall below 20 and the guards quicken. Win screen scores your time, loot and peak alarm (GHOST / CLEAN / LOUD); get caught and the floor seals. Controls: **WASD / arrows** move · **Shift** creep (quieter in cone edges) · **E** cut a vent grille · **click** throw a decoy · **R** restart. Everything is drawn from code as flat canvas vector art with WebAudio-synthesised sound — no image assets, no fonts, no network — so the game plays anywhere a desktop browser opens the file.

## Run it

```sh
# Play it — fully offline, just open the game in a desktop browser:
#   game/index.html

# Hand it in (Node.js 22.18 or later): copies game/ and screenshots/
# into the output folder and writes its dossier.json
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## What's in here

- `game/index.html` — the game shell: one canvas, no external requests
- `game/src/config.js` — board geometry, the palette language, tuning
- `game/src/floor.js` — the Meridian Reserve floor plan: rooms, three routes, patrols, cameras, cover, vents, loot
- `game/src/game.js` — the simulation: phases, vision cones, the tiered alarm, both paid tools, win/lose/restart, and the deterministic screenshot scenes
- `game/src/render.js` — every drawing: floor, raycast vision cones with shadow zones, HUD, plan overlay, end screens
- `game/src/input.js` — keyboard and mouse state
- `game/src/audio.js` — WebAudio synth effects (no audio files)
- `game/src/main.js` — fixed-step boot loop and the `?shot=` screenshot hook
- `screenshots/` — four real renders of the game running: the plan, the hero mid-heist moment, the high-alarm escape, and the getaway screen
- `main.ts` — the harness program (Node 22, standard library only) that packages the entry and writes `dossier.json`
- `vendor/makefun-game.ts` — make.fun's game library, copied from the bounty kit unchanged

---

<sub>Entered on [make.fun](https://make.fun/?ref=beyt0vmy&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
