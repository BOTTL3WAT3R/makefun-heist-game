/**
 * AURUM AFTER HOURS — the Sun Ledger job
 * make.fun bounty: best-heist-game-20261122-0559
 *
 * The game itself is the static, fully offline page in ./game (open
 * game/index.html in a desktop browser — no server, no network, no
 * external assets). This program is the harness entrypoint
 * (program/v1, Node 22, standard library only): it copies game/ and
 * screenshots/ into the output directory and writes dossier.json
 * there with the vendored make.fun library, byte-for-byte the summary
 * the scorer computes from the same tree.
 *
 *   node main.ts                                  (writes /output)
 *   MAKEFUN_OUTPUT_DIR=out node main.ts           (writes ./out)
 */
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const here: string = fileURLToPath(new URL(".", import.meta.url));
const out: string = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

if (!existsSync(join(here, "game", "index.html"))) {
  console.error("game/index.html is missing — nothing to hand in.");
  process.exit(1);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, "game"), join(out, "game"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

// The scorer's caps (its gate.json): only text_max_bytes shapes the
// dossier bytes; the rest refuse what the scorer would refuse — more
// than 4 screenshots or one over 256 KiB, more than 993 files or
// 48 MiB under game/, or a game/ path over 1000 bytes.
writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log("Aurum After Hours handed in -> " + out + " (game/, screenshots/, dossier.json)");
