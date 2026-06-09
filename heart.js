/**
 * Heart Overflow — Content Script
 * 在网页上随机生成彩色心形 Canvas 动画，受 popup 面板控制。
 */

/* ================================================================
   Configuration — synced with chrome.storage
   ================================================================ */

let intervalId = null;
let currentDelay = 150;   // 默认间隔 150ms
let currentBatch = 1;     // 默认每次生成 1 颗

/* ================================================================
   Heart rendering
   ================================================================ */

/** 在页面上创建一颗随机大小、随机颜色、带缩放动画的爱心 */
function createHeart() {
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  const size = 10 + Math.random() * 30;
  const color = `hsl(${Math.random() * 360}, 80%, 60%)`;
  const rotation = (Math.random() - 0.5) * 40;

  // 创建离屏 Canvas
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

  // 绘制心形路径（参数方程）
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

  // 弹入动画
  requestAnimationFrame(() => {
    canvas.style.transform = `scale(1.25) rotate(${rotation}deg)`;
    canvas.style.opacity = '0.9';
  });

  // 淡出缩小
  setTimeout(() => {
    canvas.style.opacity = '0';
    canvas.style.transform = `scale(0.5) rotate(${rotation}deg)`;
  }, 1200);

  // 清理 DOM
  setTimeout(() => canvas.remove(), 2000);
}

/* ================================================================
   Batch spawning
   ================================================================ */

/** 每轮按 currentBatch 生成指定数量的爱心 */
function spawnBatch() {
  for (let i = 0; i < currentBatch; i++) {
    createHeart();
  }
}

/* ================================================================
   Timer control
   ================================================================ */

/** 以当前 currentDelay 重启 setInterval */
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

/** 频率：滑块 1-10 → 间隔 239ms ~ 50ms */
function applyFrequency(value) {
  currentDelay = 260 - value * 21;
}

/** 密度：滑块 1-6 → 每轮生成数 */
function applyDensity(value) {
  currentBatch = value;
}

/* ================================================================
   chrome.storage sync
   ================================================================ */

chrome.storage.local.get(['enabled', 'frequency', 'density'], (data) => {
  if (data.frequency) applyFrequency(data.frequency);
  if (data.density)   applyDensity(data.density);

  if (data.enabled !== false) {
    startHearts();
    chrome.storage.local.set({ enabled: true });
  }
});

chrome.storage.onChanged.addListener((changes) => {
  let needRestart = false;

  // 启停
  if (changes.enabled) {
    if (changes.enabled.newValue) {
      startHearts();
    } else {
      stopHearts();
      return;
    }
  }

  // 频率
  if (changes.frequency) {
    applyFrequency(changes.frequency.newValue);
    needRestart = true;
  }

  // 密度
  if (changes.density) {
    applyDensity(changes.density.newValue);
    needRestart = true;
  }

  if (needRestart && intervalId) {
    restartInterval();
  }
});
