// Aurum After Hours — keyboard + mouse state. Plain listeners, no library.

export function createInput(canvas) {
  const keys = new Set();
  const mouse = { x: 0, y: 0, clickedAt: -1, clickX: 0, clickY: 0 };
  let clickStamp = 0;

  addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  });
  addEventListener("keyup", (e) => {
    keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  });
  canvas.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
    mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
  });
  canvas.addEventListener("mousedown", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.clickX = ((e.clientX - r.left) / r.width) * canvas.width;
    mouse.clickY = ((e.clientY - r.top) / r.height) * canvas.height;
    mouse.clickedAt = ++clickStamp;
  });

  return {
    keys,
    mouse,
    down: (...names) => names.some((n) => keys.has(n)),
    // consume a fresh click exactly once
    takeClick() {
      if (mouse.clickedAt > 0) {
        const c = { x: mouse.clickX, y: mouse.clickY, stamp: mouse.clickedAt };
        mouse.clickedAt = -1;
        return c;
      }
      return null;
    },
  };
}
