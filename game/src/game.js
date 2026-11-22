// Aurum After Hours — game state and simulation: phases, the thief, guard
// patrols with vision cones, rotating cameras, the tiered alarm, the two
// paid tools (glass-foam cutter, chime decoy) and win/lose/restart.
// Everything is a function of fixed-step time, so a run — and every
// screenshot scene below — is deterministic.

import { TILE, TUNING } from "./config.js";
import { FLOOR, tileAt, blocksMove, blocksSight, T } from "./floor.js";
import { sfx } from "./audio.js";

const cx = (tx) => (tx + 0.5) * TILE;
const tileOf = (px) => Math.floor(px / TILE);

export function createGame() {
  const s = {
    phase: "title", // title | plan | play | win | caught
    time: 0,
    planT: TUNING.planSeconds,
    elapsed: 0,
    alarm: 0,
    alarmFloor: 0,
    peak: 0,
    ledgerTaken: false,
    cutter: TUNING.cutterUses,
    decoys: TUNING.decoyUses,
    player: { x: cx(FLOOR.entry.x), y: cx(FLOOR.entry.y), angle: 0, moving: false, creep: false },
    guards: FLOOR.patrols.map((pts, i) => ({
      x: cx(pts[0].x), y: cx(pts[0].y), angle: i === 1 ? 0 : Math.PI / 2,
      wp: 1, distractT: 0, distractX: 0, distractY: 0,
    })),
    cameras: FLOOR.cameras.map((c) => ({ ...c, angle: c.base })),
    grilles: FLOOR.grilles.map((g) => ({ ...g })),
    bags: FLOOR.bags.map((b) => ({ ...b, taken: false })),
    decoy: null, // {x, y, t}
    exposure: 0, // 0..1 how seen the thief is right now
    seenBy: "",
    msg: "",
    msgT: 0,
    stepT: 0,
    alarmPulseT: 0,
    rank: "",
  };
  return s;
}

export function restart(s) {
  const fresh = createGame();
  fresh.phase = "plan";
  fresh.planT = TUNING.planSeconds;
  Object.assign(s, fresh);
}

function angleLerp(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * Math.min(1, t);
}

export function losClear(x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.floor(dist / 8));
  for (let i = 1; i < steps; i++) {
    const px = x0 + (dx * i) / steps, py = y0 + (dy * i) / steps;
    if (blocksSight(tileOf(px), tileOf(py))) return false;
  }
  return true;
}

// How strongly one cone (guard or camera) sees the thief: 0..1.
function coneExposure(sx, sy, angle, length, halfAngle, px, py) {
  const dx = px - sx, dy = py - sy;
  const dist = Math.hypot(dx, dy) / TILE;
  if (dist > length || dist < 0.01) return 0;
  let d = Math.atan2(dy, dx) - angle;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  const ad = Math.abs(d);
  if (ad > halfAngle) return 0;
  if (!losClear(sx, sy, px, py)) return 0;
  const edge = 1 - 0.45 * (ad / halfAngle) - 0.3 * (dist / length);
  return Math.max(0.15, edge);
}

function moveActor(s, a, dx, dy) {
  // axis-separated collision against blocking tiles (circle radius 10)
  const r = 10;
  const tryAxis = (nx, ny) => {
    const tiles = [
      [tileOf(nx - r), tileOf(ny - r)], [tileOf(nx + r), tileOf(ny - r)],
      [tileOf(nx - r), tileOf(ny + r)], [tileOf(nx + r), tileOf(ny + r)],
    ];
    return !tiles.some(([tx, ty]) => blocksMove(tx, ty, s.grilles));
  };
  if (dx !== 0 && tryAxis(a.x + dx, a.y)) a.x += dx;
  if (dy !== 0 && tryAxis(a.x, a.y + dy)) a.y += dy;
}

function updateGuards(s, dt) {
  const speed = (s.ledgerTaken ? TUNING.guardSpeedAlert : TUNING.guardSpeed) * TILE;
  s.guards.forEach((g, gi) => {
    let tx, ty, arrive = 5;
    if (g.distractT > 0) {
      g.distractT -= dt;
      tx = g.distractX; ty = g.distractY; arrive = 10;
    } else {
      const pts = FLOOR.patrols[gi];
      const target = pts[g.wp % pts.length];
      tx = cx(target.x); ty = cx(target.y);
      if (Math.hypot(tx - g.x, ty - g.y) < 5) g.wp = (g.wp + 1) % pts.length;
    }
    const dx = tx - g.x, dy = ty - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist > arrive) {
      const want = Math.atan2(dy, dx);
      g.angle = angleLerp(g.angle, want, TUNING.guardTurnRate * dt);
      const step = Math.min(dist, speed * dt);
      const nx = g.x + (dx / dist) * step, ny = g.y + (dy / dist) * step;
      if (!blocksMove(tileOf(nx), tileOf(ny), s.grilles)) { g.x = nx; g.y = ny; }
    }
  });
}

function updateDetection(s, dt) {
  let best = 0, who = "";
  for (const g of s.guards) {
    const e = coneExposure(g.x, g.y, g.angle, TUNING.coneLength, TUNING.coneHalfAngle, s.player.x, s.player.y);
    if (e > 0) {
      const rate = TUNING.alarmFromGuard * e * (s.player.creep ? 0.55 : 1);
      if (rate > best) { best = rate; who = "guard"; }
    }
  }
  for (const c of s.cameras) {
    const e = coneExposure(cx(c.x), cx(c.y), c.angle, TUNING.camConeLength, TUNING.camHalfAngle, s.player.x, s.player.y);
    if (e > 0) {
      const rate = TUNING.alarmFromCamera * e * (s.player.creep ? 0.55 : 1);
      if (rate > best) { best = rate; who = "camera"; }
    }
  }
  s.exposure = Math.min(1, best / TUNING.alarmFromCamera);
  s.seenBy = who;
  if (best > 0) {
    s.alarm += best * dt;
    if (s.alarm > 55) {
      s.alarmPulseT -= dt;
      if (s.alarmPulseT <= 0) { sfx.alarmPulse(); s.alarmPulseT = 0.55; }
    }
  } else {
    s.alarm -= TUNING.alarmDecay * dt;
  }
  if (s.alarm < s.alarmFloor) s.alarm = s.alarmFloor;
  if (s.alarm > 100) s.alarm = 100;
  s.peak = Math.max(s.peak, s.alarm);
}

function say(s, text, sec = 2.6) { s.msg = text; s.msgT = sec; }

export function update(s, input, dt) {
  s.time += dt;
  if (s.msgT > 0) s.msgT -= dt;
  for (const c of s.cameras) c.angle = c.base + Math.sin(s.time * c.speed + c.phase) * c.sweep;

  if (s.phase === "title") {
    if (input.down("Enter", " ") || input.takeClick()) { sfx.unlock(); s.phase = "plan"; }
    return;
  }
  if (s.phase === "plan") {
    s.planT -= dt;
    if (s.planT <= 0 || input.down("w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight")) s.phase = "play";
    return;
  }
  if (s.phase === "win" || s.phase === "caught") {
    if (input.down("r")) restart(s);
    return;
  }

  // ---- play ----
  s.elapsed += dt;
  const p = s.player;
  p.creep = input.down("Shift");
  let mx = 0, my = 0;
  if (input.down("a", "ArrowLeft")) mx -= 1;
  if (input.down("d", "ArrowRight")) mx += 1;
  if (input.down("w", "ArrowUp")) my -= 1;
  if (input.down("s", "ArrowDown")) my += 1;
  p.moving = mx !== 0 || my !== 0;
  if (p.moving) {
    const len = Math.hypot(mx, my);
    const sp = (p.creep ? TUNING.playerCreepSpeed : TUNING.playerSpeed) * TILE * dt;
    p.angle = Math.atan2(my, mx);
    moveActor(s, p, (mx / len) * sp, (my / len) * sp);
    s.stepT -= dt;
    if (s.stepT <= 0 && !p.creep) { sfx.step(); s.stepT = 0.24; }
  }

  // decoy throw (click)
  const click = input.takeClick();
  if (click) {
    const tx = tileOf(click.x), ty = tileOf(click.y);
    const distT = Math.hypot(tx - tileOf(p.x), ty - tileOf(p.y));
    if (s.decoys > 0 && distT <= TUNING.decoyRange && !blocksMove(tx, ty, s.grilles)) {
      s.decoys--;
      s.decoy = { x: cx(tx), y: cx(ty), t: TUNING.decoyDistractSec };
      s.alarmFloor = Math.min(60, s.alarmFloor + TUNING.decoyAlarmCost);
      for (const g of s.guards) {
        if (Math.hypot(g.x - s.decoy.x, g.y - s.decoy.y) / TILE <= TUNING.decoyHearRadius) {
          g.distractT = TUNING.decoyDistractSec; g.distractX = s.decoy.x; g.distractY = s.decoy.y;
        }
      }
      sfx.chime();
      say(s, "Chime decoy away — the nearest guard turns. Alarm +4.");
    } else if (s.decoys <= 0) {
      say(s, "No decoys left.");
    }
  }
  if (s.decoy) { s.decoy.t -= dt; if (s.decoy.t <= 0) s.decoy = null; }

  // cutter on a neighbouring grille (E)
  if (input.down("e")) {
    const ptx = tileOf(p.x), pty = tileOf(p.y);
    for (const g of s.grilles) {
      if (!g.open && Math.abs(g.x - ptx) + Math.abs(g.y - pty) === 1) {
        if (s.cutter > 0) {
          s.cutter--; g.open = true;
          s.alarmFloor = Math.min(70, s.alarmFloor + TUNING.grilleAlarmCost);
          sfx.cut();
          say(s, "Vent cut open. The foam hisses — alarm floor +12.");
        } else say(s, "The glass-foam cutter is spent.");
      }
    }
  }

  // pickups (walk over)
  const ptx = tileOf(p.x), pty = tileOf(p.y);
  for (const b of s.bags) {
    if (!b.taken && b.x === ptx && b.y === pty) {
      b.taken = true; sfx.loot();
      say(s, "Deposit bag lifted. Heavier — and richer.");
    }
  }
  if (!s.ledgerTaken && ptx === FLOOR.ledger.x && pty === FLOOR.ledger.y) {
    s.ledgerTaken = true;
    s.alarmFloor = Math.max(s.alarmFloor, TUNING.alarmFloorAfterLedger);
    s.alarm = Math.max(s.alarm, s.alarmFloor);
    sfx.ledger();
    say(s, "THE SUN LEDGER IS YOURS. Guards quicken — GET TO THE SOUTH DOCK.", 4);
  }

  updateGuards(s, dt);
  updateDetection(s, dt);

  if (s.alarm >= 100) {
    s.phase = "caught"; sfx.caught();
    return;
  }
  const d = FLOOR.dock;
  if (s.ledgerTaken && ptx >= d.x && ptx < d.x + d.w && pty >= d.y && pty < d.y + d.h) {
    s.phase = "win";
    s.rank = s.peak < 35 ? "GHOST" : s.peak < 70 ? "CLEAN" : "LOUD";
    sfx.win();
  }
  if (input.down("r")) restart(s);
}

// ---- deterministic scenes for screenshots (?shot=...) ----
export function setupShot(s, name) {
  const P = (tx, ty) => { s.player.x = cx(tx); s.player.y = cx(ty); };
  if (name === "start") { s.phase = "title"; return; }
  if (name === "plan") { s.phase = "plan"; s.planT = 4.2; return; }
  if (name === "hero") {
    s.phase = "play";
    P(25, 9); s.player.angle = Math.PI; // stepping out of the vault approach, ledger in hand
    s.ledgerTaken = true;
    s.alarmFloor = TUNING.alarmFloorAfterLedger; s.alarm = 70; s.peak = 70;
    s.elapsed = 74; s.cutter = 1; s.decoys = 2;
    s.bags[2].taken = true; // security bag already lifted; two hall bags still glow
    const g = s.guards;
    g[0].x = cx(21); g[0].y = cx(9); g[0].angle = Math.PI; // hall guard sweeping toward the thief
    g[1].x = cx(14); g[1].y = cx(2); g[1].angle = 0;
    g[2].x = cx(12); g[2].y = cx(14); g[2].angle = 0.4;
    s.cameras[1].angle = Math.PI / 2 + 0.3; // camera cone cutting the approach corridor
    s.exposure = 0.55; s.seenBy = "guard";
    say(s, "THE SUN LEDGER IS YOURS — GET TO THE SOUTH DOCK.", 99);
    return;
  }
  if (name === "escape") {
    s.phase = "play";
    P(16, 15); s.player.angle = Math.PI / 2;
    s.ledgerTaken = true;
    s.alarmFloor = TUNING.alarmFloorAfterLedger; s.alarm = 86; s.peak = 86;
    s.elapsed = 91; s.cutter = 1; s.decoys = 1;
    s.bags[0].taken = true; s.bags[2].taken = true;
    const g = s.guards;
    g[2].x = cx(16); g[2].y = cx(14); g[2].angle = Math.PI / 2; // right behind him, cone on his back
    g[0].x = cx(20); g[0].y = cx(7); g[0].angle = Math.PI * 0.75;
    g[1].x = cx(18); g[1].y = cx(2); g[1].angle = Math.PI;
    s.exposure = 0.8; s.seenBy = "guard";
    say(s, "ALARM 86 — the dock is RIGHT THERE.", 99);
    return;
  }
  if (name === "win") {
    setupShot(s, "escape");
    s.phase = "win"; s.rank = "CLEAN"; s.elapsed = 96; s.peak = 86;
    s.msg = ""; s.msgT = 0;
    P(16, 17);
    return;
  }
  s.phase = "title";
}
