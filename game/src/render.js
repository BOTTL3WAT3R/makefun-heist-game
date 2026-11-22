// Aurum After Hours — all drawing. Flat saturated vector shapes on canvas,
// drawn only from game state (a pure function of the fixed-step clock), so
// screenshots are exact renders of play. Palette language: teal-navy =
// safe cover, amber = guard vision, magenta-red = cameras + alarm,
// gold = loot and the open way out.

import { TILE, COLS, ROWS, WIDTH, HEIGHT, COLORS as C, TUNING } from "./config.js";
import { FLOOR, tileAt, zoneAt, blocksSight, T } from "./floor.js";

const tileOf = (px) => Math.floor(px / TILE);

function conePolygon(x, y, angle, length, half) {
  const pts = [[x, y]];
  const steps = 22;
  for (let i = 0; i <= steps; i++) {
    const a = angle - half + (2 * half * i) / steps;
    const maxD = length * TILE;
    let d = 0;
    const step = 6;
    while (d < maxD) {
      d += step;
      const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
      if (blocksSight(tileOf(px), tileOf(py))) { d -= step * 0.5; break; }
    }
    pts.push([x + Math.cos(a) * Math.min(d, maxD), y + Math.sin(a) * Math.min(d, maxD)]);
  }
  return pts;
}

function drawCone(ctx, x, y, angle, length, half, fill, edge) {
  const pts = conePolygon(x, y, angle, length, half);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, s) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const px = x * TILE, py = y * TILE;
      const t = tileAt(x, y);
      const z = zoneAt(x, y);
      if (t === T.WALL) {
        ctx.fillStyle = C.wall;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = C.wallEdge;
        ctx.fillRect(px, py + TILE - 3, TILE, 3);
        continue;
      }
      let base = C.serviceFloor;
      if (z === "marble") base = (x + y) % 2 === 0 ? C.marble : C.marbleAlt;
      if (z === "service") base = C.serviceFloor;
      if (z === "vault") base = C.vaultFloor;
      if (z === "dock") base = C.dockFloor;
      ctx.fillStyle = base;
      ctx.fillRect(px, py, TILE, TILE);
      if (z === "marble") {
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.035)";
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
      }
    }
  }
  // entry door (west wall)
  ctx.fillStyle = C.teal;
  ctx.fillRect(0, 9 * TILE + 4, 5, 2 * TILE - 8);
  ctx.fillStyle = "#06281f";
  ctx.font = "bold 10px system-ui, sans-serif";
  ctx.fillText("IN", 7, 10 * TILE + 3);
  // dock gate (south wall) — glows gold/green once the Ledger is out
  const d = FLOOR.dock;
  ctx.fillStyle = s.ledgerTaken ? C.escape : "#39505c";
  ctx.fillRect(14 * TILE, 19 * TILE + 2, 4 * TILE, 6);
  ctx.fillStyle = s.ledgerTaken ? C.goldSoft : C.textDim;
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(s.ledgerTaken ? "GETAWAY — DRIVE!" : "GETAWAY DOCK", 16 * TILE, 19 * TILE - 6);
  ctx.textAlign = "left";
  // dock zone stripes
  ctx.fillStyle = s.ledgerTaken ? "rgba(57,224,122,0.20)" : "rgba(255,255,255,0.05)";
  ctx.fillRect(d.x * TILE, d.y * TILE, d.w * TILE, d.h * TILE);
}

function drawCoverAndProps(ctx, s) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (tileAt(x, y) !== T.COVER) continue;
      const px = x * TILE, py = y * TILE;
      ctx.fillStyle = C.desk;
      ctx.fillRect(px + 1, py + 3, TILE - 2, TILE - 6);
      ctx.strokeStyle = C.deskEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 4, TILE - 4, TILE - 8);
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fillRect(px + 5, py + 7, TILE - 10, 3);
    }
  }
  // vent grilles
  for (const g of s.grilles) {
    const px = g.x * TILE, py = g.y * TILE;
    ctx.fillStyle = g.open ? "#05090f" : "#31435a";
    ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
    if (!g.open) {
      ctx.strokeStyle = C.textDim;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(px + 6, py + 9 + i * 7);
        ctx.lineTo(px + TILE - 6, py + 9 + i * 7);
        ctx.stroke();
      }
      ctx.fillStyle = C.routeC;
      ctx.font = "bold 9px system-ui, sans-serif";
      ctx.fillText("VENT", px + 4, py + TILE - 3);
    }
  }
  // deposit bags
  for (const b of s.bags) {
    if (b.taken) continue;
    const px = b.x * TILE + TILE / 2, py = b.y * TILE + TILE / 2;
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7a5b00";
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("$", px, py + 4);
    ctx.textAlign = "left";
  }
  // the Sun Ledger on its pedestal
  if (!s.ledgerTaken) {
    const px = FLOOR.ledger.x * TILE, py = FLOOR.ledger.y * TILE;
    const pulse = 0.75 + 0.25 * Math.sin(s.time * 3);
    ctx.fillStyle = `rgba(255, 201, 60, ${0.22 * pulse})`;
    ctx.fillRect(px - 6, py - 6, TILE + 12, TILE + 12);
    ctx.fillStyle = "#3a2f10";
    ctx.fillRect(px + 4, py + 6, TILE - 8, TILE - 10);
    ctx.fillStyle = C.gold;
    ctx.fillRect(px + 8, py + 2, TILE - 16, TILE - 12);
    ctx.fillStyle = "#fff3c4";
    ctx.fillRect(px + 11, py + 5, TILE - 22, 4);
    ctx.fillStyle = "#7a5b00";
    ctx.font = "bold 9px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SUN LEDGER", px + TILE / 2, py + TILE + 12);
    ctx.textAlign = "left";
  }
  // thrown decoy
  if (s.decoy) {
    const r = 6 + 3 * Math.sin(s.time * 10);
    ctx.strokeStyle = C.routeC;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(s.decoy.x, s.decoy.y, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = C.routeC;
    ctx.beginPath();
    ctx.arc(s.decoy.x, s.decoy.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawActors(ctx, s) {
  // cameras first (their cones hang over the floor)
  for (const c of s.cameras) {
    drawCone(ctx, (c.x + 0.5) * TILE, (c.y + 0.5) * TILE, c.angle, TUNING.camConeLength, TUNING.camHalfAngle, C.coneCam, C.coneCamEdge);
  }
  for (const g of s.guards) {
    drawCone(ctx, g.x, g.y, g.angle, TUNING.coneLength, TUNING.coneHalfAngle, C.coneGuard, C.coneGuardEdge);
  }
  for (const c of s.cameras) {
    const px = (c.x + 0.5) * TILE, py = (c.y + 0.5) * TILE;
    ctx.fillStyle = "#101c2a";
    ctx.fillRect(px - 9, py - 9, 18, 18);
    ctx.strokeStyle = C.alarm;
    ctx.lineWidth = 2;
    ctx.strokeRect(px - 9, py - 9, 18, 18);
    ctx.fillStyle = C.alarm;
    ctx.beginPath();
    ctx.arc(px + Math.cos(c.angle) * 4, py + Math.sin(c.angle) * 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const g of s.guards) {
    ctx.fillStyle = g.distractT > 0 ? "#ffe9a8" : C.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.guardDark;
    ctx.beginPath();
    ctx.arc(g.x, g.y - 3, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#20242c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 15, g.y + Math.sin(g.angle) * 15);
    ctx.stroke();
    if (g.distractT > 0) {
      ctx.fillStyle = C.routeC;
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.fillText("?", g.x - 3, g.y - 16);
    }
  }
  // the thief
  const p = s.player;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.arc(p.x, p.y + 4, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.thief;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.thiefDark;
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.angle) * 3, p.y + Math.sin(p.angle) * 3 - 2, 6.5, 0, Math.PI * 2);
  ctx.fill();
  if (s.ledgerTaken) {
    ctx.fillStyle = C.gold;
    ctx.fillRect(p.x + 6, p.y - 12, 10, 8);
    ctx.strokeStyle = "#7a5b00";
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x + 6, p.y - 12, 10, 8);
  }
  if (s.exposure > 0.05) {
    ctx.fillStyle = C.alarm;
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", p.x, p.y - 20);
    ctx.textAlign = "left";
  }
}

function drawRoutes(ctx, s) {
  const dashed = (pts, color, width = 3) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const px = (x + 0.5) * TILE, py = (y + 0.5) * TILE;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  };
  for (const r of FLOOR.routes) dashed(r.pts, C[r.color]);
  dashed(FLOOR.escapeRoute, C.escape, 3);
  // patrol paths, faint
  ctx.strokeStyle = "rgba(255, 176, 32, 0.35)";
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 5]);
  for (const pts of FLOOR.patrols) {
    ctx.beginPath();
    pts.forEach((pt, i) => {
      const px = (pt.x + 0.5) * TILE, py = (pt.y + 0.5) * TILE;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // route labels (kept clear of their own dashed lines, on dark chips)
  const label = (text, x, y, color) => {
    ctx.font = "bold 13px system-ui, sans-serif";
    const w = ctx.measureText(text).width + 14;
    ctx.fillStyle = "rgba(6,12,20,0.82)";
    ctx.fillRect(x - 7, y - 14, w, 20);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  };
  label("A · MARBLE DASH — fast, two cameras", 250, 282, C.routeA);
  label("B · BEHIND THE DESKS — covered, patrolled", 235, 432, C.routeB);
  label("C · SERVICE + VENT — needs the cutter", 430, 152, C.routeC);
  label("ESCAPE — SOUTH DOCK", 625, 500, C.escape);
}

function drawHUD(ctx, s) {
  ctx.fillStyle = C.hudBg;
  ctx.fillRect(0, 0, WIDTH, 46);
  ctx.fillStyle = C.gold;
  ctx.font = "bold 17px system-ui, sans-serif";
  ctx.fillText("AURUM AFTER HOURS", 12, 29);
  // alarm meter — big and segmented
  const ax = 250, aw = 300;
  ctx.fillStyle = C.textDim;
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText("ALARM", ax, 18);
  ctx.fillStyle = "#1b2a3a";
  ctx.fillRect(ax, 22, aw, 16);
  const segs = 20, lit = Math.round((s.alarm / 100) * segs);
  for (let i = 0; i < segs; i++) {
    if (i >= lit) break;
    ctx.fillStyle = i < 10 ? "#ffb020" : i < 15 ? "#ff7a29" : C.alarm;
    ctx.fillRect(ax + 2 + i * ((aw - 4) / segs), 24, (aw - 4) / segs - 2, 12);
  }
  ctx.fillStyle = C.text;
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.fillText(String(Math.floor(s.alarm)).padStart(3, "0"), ax + aw + 8, 36);
  // loot + tools + time
  const bagsTaken = s.bags.filter((b) => b.taken).length;
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.fillStyle = C.gold;
  ctx.fillText(`LOOT ${s.ledgerTaken ? "LEDGER ✓" : "LEDGER —"}  BAGS ${bagsTaken}/3`, 620, 20);
  ctx.fillStyle = C.text;
  ctx.fillText(`CUTTER ×${s.cutter}   DECOY ×${s.decoys}   ${s.player.creep ? "CREEP" : ""}`, 620, 40);
  const mm = String(Math.floor(s.elapsed / 60)).padStart(2, "0");
  const ss = String(Math.floor(s.elapsed % 60)).padStart(2, "0");
  ctx.fillStyle = C.textDim;
  ctx.textAlign = "right";
  ctx.fillText(`${mm}:${ss}`, WIDTH - 12, 29);
  ctx.textAlign = "left";
  // objective + message lines
  ctx.fillStyle = "rgba(6,12,20,0.75)";
  ctx.fillRect(0, HEIGHT - 30, WIDTH, 30);
  ctx.fillStyle = C.text;
  ctx.font = "14px system-ui, sans-serif";
  const objective = s.ledgerTaken
    ? "Objective: reach the GETAWAY DOCK (south) — Shift creeps, click throws a chime decoy, R restarts."
    : "Objective: lift the SUN LEDGER from the east vault — E cuts a vent grille (2 charges), Shift creeps, click throws a decoy.";
  ctx.fillText(objective, 12, HEIGHT - 10);
  if (s.msgT > 0 && s.msg) {
    ctx.fillStyle = "rgba(6,12,20,0.85)";
    const w = ctx.measureText(s.msg).width + 24;
    ctx.fillRect(12, 56, Math.min(w, WIDTH - 24), 28);
    ctx.fillStyle = C.goldSoft;
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillText(s.msg, 24, 75);
  }
  // danger vignette while seen
  if (s.exposure > 0.05 && s.phase === "play") {
    ctx.strokeStyle = `rgba(255, 64, 96, ${0.25 + 0.45 * s.exposure})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, WIDTH - 10, HEIGHT - 10);
  }
}

function panel(ctx, title, lines, accent) {
  ctx.fillStyle = "rgba(4, 8, 14, 0.82)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = accent;
  ctx.font = "bold 44px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, WIDTH / 2, 210);
  ctx.fillStyle = C.text;
  ctx.font = "18px system-ui, sans-serif";
  lines.forEach((ln, i) => ctx.fillText(ln, WIDTH / 2, 262 + i * 30));
  ctx.textAlign = "left";
}

export function render(ctx, s) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawFloor(ctx, s);
  if (s.phase === "plan") drawRoutes(ctx, s);
  drawCoverAndProps(ctx, s);
  drawActors(ctx, s);
  drawHUD(ctx, s);
  if (s.phase === "title") {
    panel(ctx, "AURUM AFTER HOURS", [
      "The Sun Ledger job — Meridian Reserve Bank, after closing.",
      "Steal the golden Sun Ledger from the east vault and reach the south dock.",
      "Guards sweep amber cones. Cameras sweep magenta. Full alarm = lockdown.",
      "WASD / arrows move · Shift creep · E cut vent · Click throw chime decoy · R restart",
      "Press ENTER to study the plan",
    ], C.gold);
  } else if (s.phase === "plan") {
    ctx.fillStyle = "rgba(6,12,20,0.88)";
    ctx.fillRect(312, 52, 400, 34);
    ctx.fillStyle = C.goldSoft;
    ctx.font = "bold 17px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`THE PLAN — move to begin (${Math.ceil(s.planT)}s)`, WIDTH / 2, 75);
    ctx.textAlign = "left";
  } else if (s.phase === "win") {
    const bagsTaken = s.bags.filter((b) => b.taken).length;
    const mm = String(Math.floor(s.elapsed / 60)).padStart(2, "0");
    const ss = String(Math.floor(s.elapsed % 60)).padStart(2, "0");
    panel(ctx, "CLEAN GETAWAY", [
      `The Sun Ledger is out of the Meridian Reserve.`,
      `Time ${mm}:${ss} · Deposit bags ${bagsTaken}/3 · Peak alarm ${Math.floor(s.peak)}`,
      `Crew rating: ${s.rank}`,
      "Press R to run the job again",
    ], C.escape);
  } else if (s.phase === "caught") {
    panel(ctx, "LOCKDOWN — CAUGHT", [
      "The alarm hit 100 and the vault floor sealed itself.",
      `You lasted ${Math.floor(s.elapsed)}s · Peak alarm ${Math.floor(s.peak)}`,
      "Press R to try the job again",
    ], C.alarm);
  }
}
