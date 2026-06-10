/**
 * Heart Overflow — Content Script
 * 在每个网页上独立控制爱心动画，默认关闭。
 */

/* ================================================================
   Per-site state
   ================================================================ */

const HOST = location.hostname;
const ENABLED_KEY = 'enabled_' + HOST;

let intervalId = null;
let currentDelay = 150;
let currentBatch = 1;

/* ================================================================
   Heart rendering
   ================================================================ */

function createHeart() {
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  const size = 10 + Math.random() * 30;
  const color = `hsl(${Math.random() * 360}, 80%, 60%)`;
  const rotation = (Math.random() - 0.5) * 40;

  const canvas = document.createElement('canvas');
  canvas.width = size * 2;
  canvas.height = size * 2;
  canvas.style.cssText = [
    'position:fixed',
    `left:${x - size}px`,
    `top:${y - size}px`,
    'pointer-events:none',
    'z-index:999999',
    `transform: scale(0) rotate(${rotation}deg)`,
    'transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s ease-out',
    'opacity: 0',
  ].join(';');

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.beginPath();

  const step = 0.03;
  const scale = size / 20;
  for (let t = 0; t < Math.PI * 2; t += step) {
    const px = 16 * Math.sin(t) ** 3;
    const py = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    ctx.lineTo(size + px * scale, size - py * scale);
  }
  ctx.fill();

  document.body.appendChild(canvas);

  requestAnimationFrame(() => {
    canvas.style.transform = `scale(1.25) rotate(${rotation}deg)`;
    canvas.style.opacity = '0.9';
  });

  setTimeout(() => {
    canvas.style.opacity = '0';
    canvas.style.transform = `scale(0.5) rotate(${rotation}deg)`;
  }, 1200);

  setTimeout(() => canvas.remove(), 2000);
}

/* ================================================================
   Batch spawning
   ================================================================ */

function spawnBatch() {
  for (let i = 0; i < currentBatch; i++) {
    createHeart();
  }
}

/* ================================================================
   Timer control
   ================================================================ */

function restartInterval() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  intervalId = setInterval(spawnBatch, currentDelay);
}

function startHearts() {
  if (intervalId) return;
  intervalId = setInterval(spawnBatch, currentDelay);
}

function stopHearts() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/* ================================================================
   Settings
   ================================================================ */

function applyFrequency(value) {
  currentDelay = 260 - value * 21;
}

function applyDensity(value) {
  currentBatch = value;
}

/* ================================================================
   chrome.storage sync — per-site enabled, global frequency/density
   ================================================================ */

chrome.storage.local.get([ENABLED_KEY, 'frequency', 'density'], (data) => {
  if (data.frequency) applyFrequency(data.frequency);
  if (data.density)   applyDensity(data.density);

  // 默认关闭：只有当前域名被手动开启才启动
  if (data[ENABLED_KEY] === true) {
    startHearts();
  }
});

chrome.storage.onChanged.addListener((changes) => {
  // 本域名启停
  if (changes[ENABLED_KEY]) {
    if (changes[ENABLED_KEY].newValue) {
      startHearts();
    } else {
      stopHearts();
      return;
    }
  }

  // 全局频率 & 密度
  let needRestart = false;

  if (changes.frequency) {
    applyFrequency(changes.frequency.newValue);
    needRestart = true;
  }

  if (changes.density) {
    applyDensity(changes.density.newValue);
    needRestart = true;
  }

  if (needRestart && intervalId) {
    restartInterval();
  }
});
