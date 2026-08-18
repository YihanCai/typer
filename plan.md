# Typer — 歌词打字游戏方案

## 一、概述

纯前端 Web 应用，玩家选歌后，歌词从屏幕上方飘落，在判定区域内输入对应歌词，按准确度与 timing 计分。

---

## 二、数据模型

### 歌词条目

```ts
interface LyricLine {
  id: number;
  text: string;        // 歌词原文
  time: number;        // 该句出现的时间点（秒）
  duration: number;    // 该句持续窗口（秒），默认 2s
}
```

### 歌曲

```ts
interface Song {
  id: string;
  title: string;
  artist: string;
  lyrics: LyricLine[];
}
```

初期数据硬编码在项目内，每首歌一个 JSON/TS 文件。

---

## 三、核心游戏机制

### 3.1 时间轴驱动

游戏启动后，维护一个 `currentTime`（秒），通过 `requestAnimationFrame` 或 `setInterval` 推进。

每一帧：
- 检查所有 `LyricLine`，如果 `time <= currentTime <= time + duration`，则该句进入 **活跃区**。
- 活跃区 = 歌词从顶部飘落到底部判定线的过程。

### 3.2 判定流程

```
歌词进入活跃区 → 显示在屏幕上（飘落动画）
                  ↓
到达判定线 → 进入可输入状态（高亮）
                  ↓
玩家开始打字 → 实时匹配
                  ↓
         ┌──────┴──────┐
      匹配成功          匹配失败 / 超时 / 提前
         │                    │
    加分 (+100)           扣分 (-30)
```

### 3.3 三种扣分场景

| 场景 | 触发条件 | 扣分 |
|------|----------|------|
| **提前打** | 歌词还未进入可输入状态，玩家就打了该句的首字 | -30 |
| **打错** | 输入字符与当前活跃歌词不匹配 | -30（每次错误按键） |
| **超时** | 歌词滑出底部判定区仍未完成 | -50（漏掉整句） |

### 3.4 评分公式

```
单句得分 = baseScore × accuracy × timingBonus

baseScore = 100
accuracy = 正确字符数 / 总字符数
timingBonus = 根据完成时间在窗口内的位置：
  - 正中 30% 区间 → 1.2x
  - 其余区间 → 1.0x
```

---

## 四、UI 布局

```
┌────────────────────────────────┐
│  [歌曲标题]  [分数: 2400]  [连击: 12]  │  ← 顶部状态栏
├────────────────────────────────┤
│                                  │
│    ◉ 终于...（飘落中）          │  ← 歌词飘落区
│      ◉ 我明白...（飘落中）      │
│         ◉ 该放手...（飘落中）    │
│                                  │
│  ──────── 判定线 ─────────      │  ← 视觉分隔线
│                                  │
│  [  当前输入: 该放＿   ]        │  ← 输入框
│                                  │
├────────────────────────────────┤
│  ████████░░░░░░░░░░ 进度条      │  ← 歌曲进度
└────────────────────────────────┘
```

**视觉风格**：暗色背景 + 霓虹/渐变文字，歌词使用不同颜色区分状态（灰=未到，白=飘落中，绿=可输入，红=判定失败）。

---

## 五、技术选型

| 层 | 选择 | 理由 |
|----|------|------|
| 框架 | React 18 + TypeScript | 组件化，状态管理清晰 |
| 构建 | Vite | 零配置，热更新快 |
| 动画 | CSS animation + `requestAnimationFrame` | 轻量，无需额外库 |
| 路由 | React Router | 选歌页 ↔ 游戏页 ↔ 结果页 |
| 状态 | React Context + useReducer | 游戏状态机，复杂度适中 |

### 项目结构

```
typer/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── data/
    │   └── songs/         # 歌词数据文件
    ├── types/
    │   └── index.ts       # 类型定义
    ├── game/
    │   ├── GameEngine.ts  # 时间轴 + 判定逻辑
    │   └── useGameEngine.ts  # React Hook
    ├── components/
    │   ├── SongSelect.tsx    # 选歌页
    │   ├── GameScreen.tsx    # 游戏主界面
    │   ├── LyricRain.tsx     # 歌词飘落
    │   ├── InputArea.tsx     # 输入区域
    │   ├── ScoreBoard.tsx    # 计分板
    │   └── ResultScreen.tsx  # 结果页
    └── styles/
        └── global.css
```

---

## 六、实现步骤

### Phase 1 — 骨架搭建
1. 初始化 Vite + React + TS 项目
2. 定义类型（Song, LyricLine, GameState）
3. 搭建路由：选歌 → 游戏 → 结果

### Phase 2 — 游戏引擎
4. 实现 `GameEngine` 类：时间推进、歌词生命周期管理、输入判定
5. 封装 `useGameEngine` hook
6. 接入 React 组件

### Phase 3 — UI 与动画
7. 歌词飘落动画（CSS keyframes + 动态定位）
8. 判定线 + 输入框交互
9. 计分板、进度条、连击显示

### Phase 4 — 数据与体验
10. 准备 3-5 首歌词数据（LRC 格式转换）
11. 选歌页 UI
12. 结果页（分数统计、重玩）

### Phase 5 — 打磨
13. 音效反馈（打字成功/失败提示音）
14. 键盘快捷键优化
15. 响应式适配

---

## 七、可行性与风险

| 风险 | 缓解措施 |
|------|----------|
| 歌词时间戳不准确 | 初期手动标注，后续支持 LRC 导入 |
| 中文输入法干扰 | 锁定为英文输入模式，或逐字匹配 |
| 飘落动画与时间轴同步 | 每帧根据 `currentTime` 计算位置，不依赖 CSS 动画时长 |
| 长句输入困难 | 支持逐词/逐字匹配，长句可分段飘落 |

---

## 八、后续扩展方向

- 接入真实音乐 API（网易云/Spotify）
- 多人竞技模式
- 自定义导入 LRC 歌词
- 难度等级（速度倍率、窗口宽度）
- 排行榜（localStorage 或云端）