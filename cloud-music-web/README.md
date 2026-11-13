# cloud-music-web

Cloud Music 前端 SPA。仓库总览、双服务启动与架构说明见 [根 README](../README.md)。

## 技术栈

Vue 3（`<script setup lang="ts">`）+ TypeScript（strict）+ Vite 5 + Pinia 2（`pinia-plugin-persistedstate`）+ vue-router 4 + Element Plus + axios + Less。

## 环境要求

- Node.js 18+
- 已启动 `cloud-music-server`（默认 `http://localhost:19830`）

## 安装与运行

```bash
npm install
npm run dev        # http://localhost:19572
```

开发态所有请求以 `/api` 开头，由 `vite.config.ts` 代理到 `VITE_PROXY_URL` 并去掉 `/api` 前缀，因此需要先启动后端服务。

## 常用脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 开发服务器（端口取自 `.env`） |
| `npm run build` | `vue-tsc --noEmit` + 生产构建，产物 `dist/cloud-web/` |
| `npm run preview` | 预览构建产物 |
| `npm run lint` / `npm run lint:fix` | ESLint 9 flat config 检查 / 修复 |
| `npm run verify` | 静态回归校验（`scripts/verify-navigation.mjs`，零依赖） |

## 环境变量

| 文件 | 变量 | 值 |
| --- | --- | --- |
| `.env` | `VITE_DEV_SERVER_PORT` / `VITE_PROXY_URL` | `19572` / `http://localhost:19830/` |
| `.env.development` | `VITE_NODE_ENV` / `VITE_BASE_URL` / `VITE_PUBLIC_PATH` | `development` / `/api/` / `/` |
| `.env.production` | `VITE_NODE_ENV` / `VITE_BASE_URL` / `VITE_PUBLIC_PATH` | `production` / `/api` / `/web/cloud-web/` |

构建时 `vite.config.ts` 由 `VITE_PUBLIC_PATH` 推导 `base` 与 `outDir`（`/web/cloud-web/` → `dist/cloud-web`），并对 Element Plus 按需分包、生产构建清理 `console.log/info/debug`。

## 目录约定

```
src/
  apis/{module}/       接口层（index.api.ts / *.service.ts）
  components/cm-*/     通用组件，register.ts 显式异步注册
  composables/ hooks/  跨页组合式逻辑
  router/modules/*.ts  路由模块，index.ts 自动 glob 注册
  store/               Pinia：player / playlist / lyric / user / singletons
  views/{module}/      页面 + 就近 hooks/
```

- 别名 `@` → `src`。
- 接口统一走 `src/apis/request.ts`（token 注入、错误归一、`unwrapData`）。
- 新增路由只需在 `router/modules/` 加文件；新增全局 `cm-*` 组件需同步 `components/register.ts`。
- `npm run verify` 覆盖四类易复发问题：卡片漏点击、登录菜单死链、失效接口回流、路由死链。

## 播放器

底栏 `views/home/components/play-controller/play-controller.vue` 持有唯一 `<audio>`（`cm-audio` 包装），挂载后注入 `store/player.ts`；队列在 `store/playlist.ts`，持久化到 `localStorage['cloud-music-list']`（音源 URL 不落盘），当前索引在 `localStorage['cloud-play-index']`。歌词状态在 `store/lyric.ts`，`views/music-detail/` 与底栏共用。

播放队列采用上下文队列：从歌单 / 专辑 / 歌手 / 搜索结果点任一曲，整张列表成为后续队列（`playlist.setQueue`）；手动上/下一首始终按队列顺序切歌，播放模式（循环 / 单曲 / 随机）只影响自然播放结束。从另一张歌单点同一首歌时只刷新队列上下文，保留当前音源与播放进度。

播放器问题与修复记录见 [根 README「播放器问题记录」](../README.md#播放器问题记录)。

## IDE 支持

VS Code + Volar（Vue Language Features）。禁用内置的 TypeScript and JavaScript Language Features（工作区范围）可启用 Take Over 模式，获得 `.vue` 导入的真实类型推导。

## 接口文档

[NeteaseCloudMusicApi 使用文档](https://neteasecloudmusicapi.js.org/#/?id=neteasecloudmusicapi)
