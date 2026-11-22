// Aurum After Hours — shared constants: board geometry, palette, tuning.
// One language, everywhere: teal-navy is safe cover, amber is a guard's
// vision, magenta-red is cameras and alarm, gold is loot and the way out.

export const TILE = 32;
export const COLS = 32;
export const ROWS = 20;
export const WIDTH = COLS * TILE;   // 1024
export const HEIGHT = ROWS * TILE;  // 640

export const COLORS = {
  wall: "#0d1622",
  wallEdge: "#1d3247",
  marble: "#22384f",
  marbleAlt: "#1d3045",
  tellerFloor: "#274058",
  serviceFloor: "#1a2c3f",
  vaultFloor: "#2c3a2a",
  dockFloor: "#24382f",
  cover: "#0f2233",
  coverEdge: "#2e5d7a",
  desk: "#123043",
  deskEdge: "#2e5d7a",
  safe: "#16283a",
  gold: "#ffc93c",
  goldSoft: "#ffdf7e",
  teal: "#2ee6a8",
  thief: "#19c2b8",
  thiefDark: "#0e7c78",
  guard: "#e8e4da",
  guardDark: "#8a8578",
  coneGuard: "rgba(255, 176, 32, 0.30)",
  coneGuardEdge: "rgba(255, 176, 32, 0.55)",
  coneCam: "rgba(255, 64, 96, 0.28)",
  coneCamEdge: "rgba(255, 64, 96, 0.55)",
  alarm: "#ff4060",
  hudBg: "rgba(6, 12, 20, 0.88)",
  text: "#eaf4ff",
  textDim: "#9db8cc",
  routeA: "#ffdf7e",
  routeB: "#2ee6a8",
  routeC: "#ff9ecb",
  escape: "#39e07a",
};

export const TUNING = {
  playerSpeed: 3.1,          // tiles per second
  playerCreepSpeed: 1.55,    // holding Shift
  guardSpeed: 1.45,
  guardSpeedAlert: 1.95,     // after the Sun Ledger is taken
  guardTurnRate: 3.2,        // radians per second toward travel direction
  coneLength: 4.6,           // tiles
  coneHalfAngle: 0.56,       // radians (~32 deg)
  camConeLength: 5.2,
  camHalfAngle: 0.46,
  alarmFromGuard: 26,        // per second at cone centre
  alarmFromCamera: 38,       // per second at cone centre
  alarmDecay: 13,            // per second while unseen
  alarmFloorAfterLedger: 20, // permanent floor once the Ledger is lifted
  grilleAlarmCost: 12,       // permanent floor added per grille cut
  decoyAlarmCost: 4,
  decoyDistractSec: 4,
  decoyRange: 6,             // tiles, click throw range
  decoyHearRadius: 8,        // tiles
  cutterUses: 2,
  decoyUses: 2,
  planSeconds: 6,
};
