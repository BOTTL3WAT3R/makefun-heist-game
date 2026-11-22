// Aurum After Hours — boot: fixed-step loop (60 Hz simulation, deterministic
// regardless of display refresh), plus the screenshot scene hook used to
// render this entry's screenshots from real play states (?shot=plan etc.).

import { createGame, update, setupShot } from "./game.js";
import { createInput } from "./input.js";
import { render } from "./render.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");
const input = createInput(canvas);
const state = createGame();

const params = new URLSearchParams(location.search);
const shot = params.get("shot");
if (shot) setupShot(state, shot);

const STEP = 1 / 60;
let acc = 0;
let last = performance.now();
let lastStatus = "";

function frame(now) {
  acc += Math.min(0.25, (now - last) / 1000);
  last = now;
  while (acc >= STEP) {
    if (!shot) update(state, input, STEP);
    else { state.time += STEP; }
    acc -= STEP;
  }
  render(ctx, state);
  const text = `${state.phase} · alarm ${Math.floor(state.alarm)} · ledger ${state.ledgerTaken ? "taken" : "in vault"}`;
  if (text !== lastStatus) { status.textContent = text; lastStatus = text; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
