# Cloud Music

本地可运行的网易云音乐 Web 客户端：Vue 3 前端 + NeteaseCloudMusicApi 本地 API 服务。

## 仓库结构

| 目录 | 作用 |
| --- | --- |
| `cloud-music-web/` | 前端 SPA（Vue 3 + TypeScript + Vite） |
| `cloud-music-server/` | API 服务（上游 NeteaseCloudMusicApi v4.13.3） |
| `openspec/` | 需求变更（changes）与已落地能力规范（specs） |

`cloud-music-server/README.MD`、`cloud-music-server/docs/README.md` 为上游原始文档，本仓库未改写；集成与启动方式以本文为准。

## 环境要求

- Node.js 18+（服务端上游声明 `>=12`）
- npm
- 现代浏览器（Chrome / Edge）

## 快速开始

```bash
# 1) 启动 API 服务（终端 A）
cd cloud-music-server
npm install
npm start                 # http://localhost:19830

# 2) 启动前端（终端 B）
cd cloud-music-web
npm install
npm run dev               # http://localhost:19572
```

打开 <http://localhost:19572/>。前端请求统一走 `/api`，由 Vite 代理到 `VITE_PROXY_URL` 并去掉前缀：

```
GET /api/song/url?id=1  →  GET http://localhost:19830/song/url?id=1
```

| 服务 | 默认端口 | 配置来源 |
| --- | --- | --- |
| API | `19830` | `cloud-music-server/server.js`，可用 `PORT` 覆盖 |
| Web dev | `19572` | `cloud-music-web/.env` 的 `VITE_DEV_SERVER_PORT` |

## 前端（cloud-music-web）

技术栈：Vue 3 `<script setup>` + TypeScript + Vite 5 + Pinia（含 `pinia-plugin-persistedstate`）+ Element Plus + vue-router 4 + axios + Less。别名 `@` → `src`。

### 常用脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | `vue-tsc --noEmit` + 生产构建，产物 `dist/cloud-web/` |
| `npm run preview` | 预览构建产物 |
| `npm run lint` / `lint:fix` | ESLint 9 检查 / 自动修复 |
| `npm run verify` | 静态回归：卡片点击、登录菜单、失效接口回流、路由死链 |

### 环境变量

定义在 `cloud-music-web/.env*`：

| 变量 | development | production | 说明 |
| --- | --- | --- | --- |
| `VITE_DEV_SERVER_PORT` | `19572` | — | dev server 端口（`.env` 公共） |
| `VITE_PROXY_URL` | `http://localhost:19830/` | — | dev 代理目标（`.env` 公共） |
| `VITE_NODE_ENV` | `development` | `production` | 控制 sourcemap / console 清理 |
| `VITE_BASE_URL` | `/api/` | `/api` | axios baseURL |
| `VITE_PUBLIC_PATH` | `/` | `/web/cloud-web/` | 构建 base 与产物目录（`dist/cloud-web`） |

`.npmrc` 使用 npmmirror 源并开启 `legacy-peer-deps`。

### 目录约定

```
src/
  apis/{module}/        接口层：index.api.ts（纯请求）/ *.service.ts（服务对象）
  assets/               样式、字体、图片
  components/cm-*/      通用原子组件，register.ts 中显式登记为异步全局组件
  composables/          跨页组合式逻辑
  config/ constant/ core/ utils/   配置、枚举、工具
  hooks/                通用 hooks
  router/modules/*.ts   路由模块，index.ts 用 import.meta.glob 自动注册
  store/                Pinia：player / playlist / lyric / user / singletons
  views/{module}/       页面与就近 hooks/
```

- 新增路由：在 `src/router/modules/` 新建默认导出 `RouteRecordRaw[]` 的文件即可，无需改 `router/index.ts`。
- 新增全局组件：同时更新 `src/components/register.ts`。
- API 与页面逻辑分离：接口放 `src/apis/{module}/`，页面私有逻辑放 `views/{module}/hooks/`。
- 统一请求实例在 `src/apis/request.ts`（token 注入 + 错误归一），工具类 `unwrapData` 兼容 `{code,data}` 与裸数据两种响应。

### 播放器实现要点

- 全站唯一 `<audio>` 在 `views/home/components/play-controller/play-controller.vue`，由 `components/cm-audio/cm-audio.vue` 包装；挂载后通过 `player.bindAudio(el)` 注入 store。详情页 `views/music-detail/` 与底栏共用同一播放状态。
- `store/playlist.ts`：队列唯一真相源，持久化到 `localStorage['cloud-music-list']`。音源 URL 为限时地址，序列化与还原时都会置空，播放时按需补拉 `/song/url`。`addMusic()` 单曲入队；`setQueue(songs, startId)` 用整张歌单替换队列（上下文队列），只为起始曲补拉 url。
- `store/player.ts`：播放状态与动作。`startPlayback()` 负责补拉音源、驱动 `play()`/进度、拉取歌词；`play(song, context?)` 带上下文时整张入队；`switchMusic()` 手动切歌按队列顺序，`onEnded()` 只在自然结束时按循环、单曲、随机三种模式调度。
- `store/lyric.ts`：LRC 解析、逐行同步、点击歌词跳转。
- `localStorage['cloud-play-index']`：当前索引（纯数字字符串，兼容旧格式）。

### 播放器问题记录

| 现象 | 状态 | 说明 |
| --- | --- | --- |
| 点进度条后跳回原处甚至从头播 | 已修复 | `seek()` 以 `@change` 的滑块值为准跳转并恢复播放；`endDragging()` 不再抢先 `play()`；`onTimeUpdate` 在暂停态不回写 `progress`（Element Plus 的 change 在 `nextTick` 后才 emit） |
| 点歌名/详情或重点当前歌曲会从头播 | 已修复 | `play()` 命中当前歌曲直接返回（暂停态则恢复播放），不再 `reset currentTime`、不再重复入队 |
| 刷新后首次点播放无声，需再点 | 已修复 | `startPlayback()` 在 `el.play()` 前 `await nextTick()`，等响应式 `:src` patch 到 DOM |
| 歌单里播一首后点「下一首」仍是同一首 | 已修复 | 上下文队列：`cm-table` 播放/点歌名时把整张 `dataSource` 传给 `play(song, context)`，`playlist.setQueue()` 整张入队并定位当前曲；底栏/详情页上、下一首改绑 `switchMusic()`，播放模式只约束 `@ended`；歌单/专辑/歌手页「播放全部」入口均已接线；跨歌单点同一首歌只刷新上下文，不打断播放 |

## API 服务（cloud-music-server）

- `module/` 下 309 个接口由 `server.js` 自动注册，无需手工挂载。
- `npm start` 即 `node app.js`；`PORT=4000 npm start` 可换端口（同时需同步前端 `VITE_PROXY_URL`）。
- 接口文档：<https://neteasecloudmusicapi.js.org/#/?id=neteasecloudmusicapi>
- 登录态相关接口需要 cookie；未登录时 `/song/url`、下载等接口可能返回空数据，前端会做降级提示，属预期行为。

## OpenSpec

- `openspec/changes/`：进行中与已归档的变更（proposal / design / tasks）。
- `openspec/specs/`：已落地能力规范（首页推荐、歌单管理、搜索增强、评论互动、用户中心）。
- `openspec/config.yaml`：所有 artifact 使用中文，保留 OpenSpec 结构标题与 SHALL/MUST 关键字。
