/**
 * Heart Overflow — Popup Controller
 * 负责 popup 面板的 UI 渲染与 chrome.storage 双向同步。
 */

/* ================================================================
   DOM references
   ================================================================ */

const toggle     = document.getElementById('toggle');
const heartStage = document.getElementById('heartStage');
const particles  = document.getElementById('particles');
const statusDots = document.getElementById('statusDots');
const statusText = document.getElementById('statusText');
const labelOn    = document.getElementById('labelOn');
const labelOff   = document.getElementById('labelOff');
const freqSlider = document.getElementById('freqSlider');
const densSlider = document.getElementById('densSlider');
const freqVal    = document.getElementById('freqVal');
const densVal    = document.getElementById('densVal');

/* ================================================================
   Constants
   ================================================================ */

const FREQ_LABELS = ['极慢', '慢', '较慢', '偏慢', '中', '偏快', '较快', '快', '极快', '狂飙'];
const DENS_LABELS = ['1x', '2x', '3x', '4x', '5x', '6x'];

const DEFAULTS = {
  enabled: true,
  frequency: 5,
  density: 1,
};

/* ================================================================
   Helpers
   ================================================================ */

function updateFreqLabel(v) {
  freqVal.textContent = FREQ_LABELS[v - 1];
  freqVal.className = v >= 7 ? 'hot' : '';
}

function updateDensLabel(v) {
  densVal.textContent = DENS_LABELS[v - 1];
  densVal.className = v >= 4 ? 'hot' : '';
}

/* ================================================================
   UI refresh
   ================================================================ */

function refreshUI(enabled, freq, dens) {
  toggle.checked = enabled;

  // 爱心动画状态
  heartStage.className = `heart-stage ${enabled ? 'active' : 'paused'}`;

  // 背景粒子
  particles.style.opacity = enabled ? '1' : '0';

  // 开关标签
  labelOn.classList.toggle('active', enabled);
  labelOff.classList.toggle('active', !enabled);

  // 滑块
  freqSlider.disabled = !enabled;
  densSlider.disabled = !enabled;
  freqSlider.className = enabled ? 'enabled-range' : '';
  densSlider.className = enabled ? 'enabled-range' : '';

  freqSlider.value = freq;
  densSlider.value = dens;
  updateFreqLabel(freq);
  updateDensLabel(dens);

  // 呼吸灯点
  const dots = statusDots.querySelectorAll('.status-dot');
  dots.forEach((dot) => {
    dot.className = `status-dot${enabled ? ' lit' : ''}`;
  });

  // 底部状态文字
  statusText.textContent = enabled ? '爱心正在扩散中...' : '扩散已暂停';
  statusText.classList.toggle('active', enabled);
}

/* ================================================================
   chrome.storage sync
   ================================================================ */

function loadAndRefresh() {
  chrome.storage.local.get(['enabled', 'frequency', 'density'], (data) => {
    refreshUI(
      data.enabled   !== false,
      data.frequency || DEFAULTS.frequency,
      data.density   || DEFAULTS.density,
    );
  });
}

/* ================================================================
   Event listeners
   ================================================================ */

// 总开关
toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.local.set({ enabled }, () => {
    // set 回调中重新读取以拿到频率/密度用于 UI
    chrome.storage.local.get(['frequency', 'density'], (data) => {
      refreshUI(enabled, data.frequency || DEFAULTS.frequency, data.density || DEFAULTS.density);
    });
  });
});

// 频率滑块
freqSlider.addEventListener('input', () => {
  updateFreqLabel(Number(freqSlider.value));
});

freqSlider.addEventListener('change', () => {
  chrome.storage.local.set({ frequency: Number(freqSlider.value) });
});

// 密度滑块
densSlider.addEventListener('input', () => {
  updateDensLabel(Number(densSlider.value));
});

densSlider.addEventListener('change', () => {
  chrome.storage.local.set({ density: Number(densSlider.value) });
});

/* ================================================================
   Init
   ================================================================ */

loadAndRefresh();
