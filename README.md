# Gura Agent — 数字人 3D 交互前端

> 基于 Vue 3 + Vite + Three.js 的 Gawr Gura 数字人前端。模型与动作由 Blender 制作并打包进 GLB，前端通过 WebSocket 与后端对话服务连接。

## 项目概述

Gura Agent 是一个带 3D 数字人的实时对话前端：

- 加载 Gawr Gura 模型，支持骨骼动画
- 7 个动作按钮，可单独预览：待机、走路、跑步、摇晃、跳跃、害羞、转圈
- 响应式布局，桌面端左右分栏，移动端上下分栏
- 文字输入、WebSocket 状态、语音监听等交互入口

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 (Composition API) + Vite + Pinia |
| 3D 渲染 | Three.js + GLTFLoader + AnimationMixer |
| 模型/动作 | GLB，动作由 Blender NLA 导出后合并回原模型 |
| 后端通信 | WebSocket + FastAPI |
| 语音交互 | DashScope ASR / TTS + Qwen 对话 |

## 快速开始

```bash
npm install
npm run dev
```

默认地址：<http://localhost:5173>

其他命令：

```bash
npm run build      # 生产构建
npm run preview    # 预览生产构建
npm run lint       # ESLint 检查并自动修复
```

前端不依赖后端也能启动。没有后端时页面会显示离线状态，3D 模型和 7 个动作按钮仍然可以正常预览。

## 模型与动作说明

生产环境使用 `public/古拉_actions.glb`，`src/model.js` 会加载该文件并把 7 个动作注册到 `AnimationMixer`。

| 前端按钮 | GLB 动画名 | 时长（约） | 说明 |
|----------|------------|-----------|------|
| 待机 | `idle` | 1.2s 循环 | 自然待机循环动作 |
| 走路 | `ParadeWalk` | 0.7s | 慢速走路摆臂 |
| 跑步 | `GuraRun` | 1.2s | 跑步摆臂 |
| 摇晃 | `GuraShake` | 2.1s | 身体左右摇晃 |
| 跳跃 | `GuraJump` | 1.2s | 原地跳跃 |
| 害羞 | `Shy` | 2.6s | 低头害羞 |
| 转圈 | `Gura Around` | 1.8s | 原地转圈 |

动作切换采用 0.35s 淡入淡出。非待机动作播放完成后会自动回到待机动作。

### 模型文件

| 文件 | 用途 |
|------|------|
| `public/古拉_actions.glb` | 生产模型，包含 7 个已合并的 NLA 动作 |
| `public/古拉.glb` | Blender 重新导出的古拉模型 |
| `public/smoller_gura_-_gawr_gura_holomyth.glb` | 原始 Gura 模型 |
| `public/模型.glb` | 旧版测试模型 |

### 动作来源

动作在 Blender 中按 NLA 轨道拆分，再通过脚本合并回原模型，避免 Blender 重导出破坏模型坐标。

```bash
node scripts/merge_gura_nla_actions.mjs
```

辅助脚本：

- `scripts/build_gura_actions.py`
- `scripts/merge_gura_actions.mjs`

## 项目结构

```
Gura-Agent/
├── public/
│   ├── 古拉_actions.glb
│   ├── 古拉.glb
│   └── smoller_gura_-_gawr_gura_holomyth.glb
├── scripts/
│   ├── build_gura_actions.py
│   ├── merge_gura_actions.mjs
│   └── merge_gura_nla_actions.mjs
└── src/
    ├── App.vue
    ├── index.js
    ├── main.js
    ├── model.js
    ├── style.css
    ├── components/
    │   ├── ChatBox.vue
    │   └── Model.vue
    └── stores/
        └── chatStore.js
```

## 动作控制

- `src/model.js`：加载 GLB、注册动画、处理动作淡入淡出和自动回待机
- `src/components/ChatBox.vue`：动作按钮列表，点击调用 `triggerAction(name)`
- `src/components/Model.vue`：3D 模型容器、加载状态、头部跟随气泡

前端内置动作按钮：

```js
[
  { name: 'idle', label: '待机' },
  { name: 'ParadeWalk', label: '走路' },
  { name: 'GuraRun', label: '跑步' },
  { name: 'GuraShake', label: '摇晃' },
  { name: 'GuraJump', label: '跳跃' },
  { name: 'Shy', label: '害羞' },
  { name: 'Gura Around', label: '转圈' }
]
```

## 后端接口

### WebSocket

默认地址：`ws://localhost:8000/ws/conversation`

| 消息类型 | 方向 | 说明 |
|----------|------|------|
| `connected` | 服务端 → 客户端 | 连接成功，包含唤醒词列表 |
| `state_change` | 服务端 → 客户端 | 状态变化通知 |
| `listening_started/stopped` | 服务端 → 客户端 | 麦克风监听状态 |
| `messages_cleared` | 服务端 → 客户端 | 消息已清空 |
| `ping` | 客户端 → 服务端 | 心跳请求 |
| `pong` | 服务端 → 客户端 | 心跳响应 |
| `get_state` | 客户端 → 服务端 | 查询当前状态 |
| `current_state` | 服务端 → 客户端 | 当前状态回复 |

### HTTP 控制端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `POST /control/start` | HTTP | 启动麦克风监听 |
| `POST /control/stop` | HTTP | 停止麦克风监听 |
| `POST /messages/clear` | HTTP | 清空对话历史 |
| `GET /status` | HTTP | 获取系统运行状态 |
| `GET /messages` | HTTP | 获取消息列表 |

## 常见问题

### 模型没有显示

确认 `public/古拉_actions.glb` 存在。浏览器控制台如果有 GLB 加载失败，可以尝试重新执行：

```bash
node scripts/merge_gura_nla_actions.mjs
```

### 动作按钮没有效果

确认 `src/model.js` 中的 `ACTION_NAMES` 与 GLB 内的动画名一致。动画名可通过 Blender 的 Action Editor / NLA 或 GLTF 解析工具查看。

### 端口被占用

如果 `5173` 已被占用，Vite 会自动选择下一个可用端口，例如 `http://localhost:5174`。
