# 🎤 Typer — 歌词打字游戏

> 随着歌曲的节奏，歌词从屏幕上方飘落。在歌词到达判定线时准确打出它 —— 太慢、太快、打错，都会扣分。

## 项目简介

Typer 是一款基于 **React + TypeScript + Vite** 的纯前端歌词打字游戏。玩家选择歌曲后，歌词按照时间轴逐句从屏幕上方飘落，当歌词到达底部判定线时进入可输入状态，玩家需要在判定窗口内打完这句歌词。游戏不播放音乐，目前使用人工标注的时间戳驱动。

## 核心玩法

```
歌词飘落（2.5s） → 到达判定线 → 进入可输入状态 → 玩家打字
                        │                        │
                        │                    ├ 打对 → 加分（时机越好分越高）
                        │                    ├ 打错 → -30 分
                        │                    ├ 提前输入 → -30 分
                        │                    └ 超时 → -50 分，记漏一句
```

**评分公式**：`单句得分 = 100 × 时机加成`

- 在判定窗口正中 30% 区间内完成 → **1.5x（PERFECT）**
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

当前内置一首极简测试曲（8 句短单词），用于验证核心机制。后续计划接入完整歌曲歌词与 LRC 导入。

## 后续规划

- [ ] 完整歌曲歌词库（3-5 首）
- [ ] 支持 LRC 文件导入
- [ ] 音效反馈（打字成功/失败）
- [ ] 难度分级（飘落速度、判定窗口宽度）
- [ ] 排行榜（localStorage / 云端）
- [ ] 移动端适配

## License

MIT