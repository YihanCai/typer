# 🎤 Typer — 歌词打字游戏

> 随着歌曲的节奏，歌词从屏幕上方飘落，飘落全程都可以输入。在歌词消失前准确打出它 —— 太慢、太快、打错，都会扣分。

## 项目简介

Typer 是一款基于 **React + TypeScript + Vite** 的纯前端歌词打字游戏。玩家选择歌曲后，歌词按照时间轴逐句从屏幕上方飘落，**在歌词进入屏幕到滑出屏幕的整个过程中都可以输入**，歌词消失前打完即得分，滑出屏幕未完成即判漏。游戏不播放音乐，目前使用人工标注的时间戳驱动。

## 核心玩法

```
歌词进入屏幕 → 开始飘落（全程可输入）
            │
      ├─ 消失前打完 → 加分（时机越好分越高）
      ├─ 打错 → -30 分
      ├─ 提前输入（还没进屏幕）→ -30 分
      └─ 滑出屏幕仍未完成 → -50 分，记漏一句
所有歌词打完或漏完 → 结算
```

**评分公式**：`单句得分 = 100 × 时机加成`

- 在歌词到达判定线的正点区间内完成 → **1.5x（PERFECT）**
- 其余区间完成 → **1.0x（GOOD）**

另有连击（Combo）系统，连续打对会累计连击数。

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 5 |
| 路由 | React Router v6 |
| 动画 | CSS + `setInterval` 时间轴驱动 |
| 状态 | React Hooks（`useRef` + `useState`） |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

打开 `http://localhost:5173` 即可开始游戏。

## 项目结构

```
typer/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── plan.md                  # 设计方案文档
└── src/
    ├── main.tsx             # 入口
    ├── App.tsx              # 路由配置
    ├── types/
    │   └── index.ts         # 类型定义（Song / LyricLine / GameState）
    ├── game/
    │   └── useGameEngine.ts # 核心游戏引擎 Hook（时间轴/判定/计分）
    ├── data/
    │   └── songs/index.ts   # 歌词数据（当前为测试数据）
    ├── components/
    │   ├── SongSelect.tsx   # 选歌页
    │   ├── GameScreen.tsx   # 游戏主界面
    │   └── ResultScreen.tsx # 结算页
    └── styles/
        └── global.css       # 全局样式（暗色霓虹风）
```

## 歌词数据格式

每首歌由一组带时间戳的歌词行组成（类似 LRC）：

```ts
interface LyricLine {
  id: number
  text: string    // 歌词原文
  time: number    // 该句开始判定的时间点（秒）
  duration: number // 判定窗口长度（秒）
}
```

当前内置 1 首测试曲（极简短词，固定时间轴）+ 1 首音频同步测试曲（真实音频时钟）+ 5 首真实歌曲：

| 歌曲 | 歌手 |
|------|------|
| 音频同步测试 | Typer 测试（哔哔声 WAV，验证音频时钟） |
| Yesterday · 第 1~3 段 | The Beatles |
| Hey Jude | The Beatles |
| Counting Stars | OneRepublic |
| Viva La Vida | Coldplay |
| Gloria | The Lumineers |

真实歌曲的时间轴由生成器按句长自动排布（`getFallDuration` 随句长伸缩，保证窗口首尾相接不重叠）。后续计划支持 LRC 文件导入。

## 音频同步播放

歌曲可配 `audioSrc` 字段挂音频文件。有音频时**游戏时钟跟随音频播放进度**（`audio.currentTime`），歌词按真实时间戳（LRC 格式）卡着歌声飘落；无音频时退回按句长生成的自动时间轴。

```ts
// 歌曲数据里加一行 + 歌词用 LRC 时间戳
{
  id: 'demo',
  audioSrc: '/music/beeps-demo.wav',   // 音频放 public/music/
  lyrics: parseLRC(`[00:01.00]go\n[00:03.60]win`)...
}
```

- LRC 解析：`src/data/lrc.ts` 的 `parseLRC()`
- 抓取真实歌词：`node scripts/fetch-lrc.mjs "歌手" "歌名" [--save]`（lrclib 免费 API）
- 生成本地演示音源：`node scripts/make-demo-wav.mjs`
- 浏览器拦截自动播放时，游戏显示"点击开始播放"按钮

## 后续规划

- [ ] 完整歌曲歌词库（3-5 首）
- [ ] 支持 LRC 文件导入
- [ ] 音效反馈（打字成功/失败）
- [ ] 难度分级（飘落速度、判定窗口宽度）
- [ ] 排行榜（localStorage / 云端）
- [ ] 移动端适配

## License

MIT