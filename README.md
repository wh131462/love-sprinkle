# Love Sprinkle

在任意网页上飘洒彩色爱心动画的 Chrome 扩展，通过弹窗面板实时控制。

## 功能

- **爱心飘洒** — 用 Canvas 绘制的参数方程心形，弹性缩放入场，渐变淡出
- **面板控制** — 点击工具栏图标弹出控制面板，一键启停
- **频率调节** — 10 档滑块（极慢 → 狂飙），控制爱心生成间隔（50ms ~ 239ms）
- **密度调节** — 6 档滑块（1x → 6x），控制每轮同时生成几颗
- **即时生效** — 所有设置通过 `chrome.storage` 同步，已打开的标签页无需刷新

## 安装

1. 下载或克隆本项目
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角 **「开发者模式」**
4. 点击 **「加载已解压的扩展程序」**
5. 选择 `love-sprinkle/` 目录
6. 完成！打开任意网页即可看到爱心飘洒

## 项目结构

```
love-sprinkle/
├── manifest.json          # 扩展配置（Manifest V3）
├── heart.js               # 内容脚本 — 爱心生成逻辑
├── popup.html             # 面板 UI
├── popup.js               # 面板交互逻辑
├── icons/                 # 扩展图标（16/48/128px）
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── scripts/
│   └── gen_icons.py       # 图标生成脚本
└── .gitignore
```

## 技术细节

- **Manifest V3** — 使用 `chrome.storage` 实现 popup ↔ content script 通信
- **Canvas 绘图** — 用心形参数方程 `(16sin³t, 13cost − 5cos2t − 2cos3t − cos4t)` 绘制爱心
- **CSS 动画** — `cubic-bezier(0.34, 1.56, 0.64, 1)` 弹性缓入 + `opacity` 淡出
- **面板爱心** — 多层 SVG 叠加：光晕 → 渐变主填色 → 轮廓描边 + 四周闪烁粒子
- **图标生成** — Python 脚本自动计算隐式心形方程的精确边界，抗锯齿渲染，三尺寸居中输出

## 许可

MIT
