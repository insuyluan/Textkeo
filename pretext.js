const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('textInput');

let width = 0, height = 0;
let gravity = 0.35;
const damping = 0.985;
const springK = 0.07;
const restLen = 34;
const radius = 13;
let nodes = [];
let links = [];
let dragging = null;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

function makeString(text) {
  const chars = (text || 'textstring').split('');
  nodes = chars.map((ch, i) => ({
    ch,
    x: width * 0.12 + i * restLen,
    y: height * 0.35 + Math.sin(i * 0.6) * 12,
    vx: 0,
    vy: 0,
    pinned: i === 0
  }));
  links = [];
  for (let i = 0; i < nodes.length - 1; i++) links.push([i, i + 1]);
}

function applyPhysics() {
  for (const [a, b] of links) {
    const n1 = nodes[a], n2 = nodes[b];
    const dx = n2.x - n1.x, dy = n2.y - n1.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    const stretch = dist - restLen;
    const fx = (dx / dist) * stretch * springK;
    const fy = (dy / dist) * stretch * springK;
    if (!n1.pinned && dragging !== n1) { n1.vx += fx; n1.vy += fy; }
    if (!n2.pinned && dragging !== n2) { n2.vx -= fx; n2.vy -= fy; }
  }

  for (const n of nodes) {
    if (n.pinned) continue;
    if (dragging === n) {
      n.vx = n.vy = 0;
      continue;
    }
    n.vy += gravity;
    n.vx *= damping;
    n.vy *= damping;
    n.x += n.vx;
    n.y += n.vy;

    if (n.x < radius) { n.x = radius; n.vx *= -0.5; }
    if (n.x > width - radius) { n.x = width - radius; n.vx *= -0.5; }
    if (n.y < radius) { n.y = radius; n.vy *= -0.5; }
    if (n.y > height - radius) { n.y = height - radius; n.vy *= -0.55; }
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#111';
  ctx.beginPath();
  for (const [a, b] of links) {
    ctx.moveTo(nodes[a].x, nodes[a].y);
    ctx.lineTo(nodes[b].x, nodes[b].y);
  }
  ctx.stroke();

  for (const n of nodes) {
    ctx.beginPath();
    ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#111';
    ctx.stroke();

    ctx.fillStyle = '#111';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.ch, n.x, n.y + 1);
  }

  requestAnimationFrame(loop);
}

function loop() {
  applyPhysics();
  draw();
}

function pointerPos(e) {
  return {x: e.clientX, y: e.clientY};
}

canvas.addEventListener('pointerdown', e => {
  const p = pointerPos(e);
  dragging = null;
  for (const n of nodes) {
    if (Math.hypot(n.x - p.x, n.y - p.y) < radius + 8) {
      dragging = n;
      break;
    }
  }
});
canvas.addEventListener('pointermove', e => {
  if (!dragging) return;
  const p = pointerPos(e);
  dragging.x = p.x;
  dragging.y = p.y;
});
window.addEventListener('pointerup', () => dragging = null);
window.addEventListener('resize', resize);
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') makeString(input.value.trim());
});
window.addEventListener('keydown', e => {
  if (e.key === ' ') {
    e.preventDefault();
    gravity = gravity === 0 ? 0.35 : 0;
  }
});

resize();
makeString(input.value);
loop();
