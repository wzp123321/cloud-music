# cloud-music-web

Cloud Music 前端 SPA。仓库总览与双服务启动见 [根 README](../README.md)。

## 技术栈

Vue 3（`<script setup lang="ts">`）+ TypeScript（strict）+ Vite 5 + Pinia 2（`pinia-plugin-persistedstate`）+ vue-router 4 + Element Plus + axios + Less。

## 功能

- 播放器：全站单一播放状态，底栏与歌曲详情页同步；进度拖动、歌词同步与点击跳转、循环 / 单曲 / 随机模式。
- 上下文队列：从列表点任一曲，整张列表成为后续队列；手动上 / 下一首按队列顺序切歌，播放模式只影响自然播放结束。
- 音乐发现：首页推荐、榜单、歌单、专辑、歌手、搜索、MV、评论互动。
- 登录：二维码扫码、手机号、邮箱登录，会话凭证本地持久化。
- 用户中心：个人资料、收藏与听歌记录。

## 环境要求

- Node.js 18+
- 已启动 `cloud-music-server`（NeteaseCloudMusicApi 4.33.0，默认 `http://localhost:19830`）

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
  core/                会话凭证等核心工具
  router/modules/*.ts  路由模块，index.ts 自动 glob 注册
  store/               Pinia：player / playlist / lyric / user / singletons
  views/{module}/      页面 + 就近 hooks/
```

- 别名 `@` → `src`。
- 接口统一走 `src/apis/request.ts`，`unwrapData` 兼容 `{code,data}` 与裸数据。
- 新增路由只需在 `router/modules/` 加文件；新增全局 `cm-*` 组件需同步 `components/register.ts`。

## IDE 支持

VS Code + Volar（Vue Language Features）。禁用内置的 TypeScript and JavaScript Language Features（工作区范围）可启用 Take Over 模式，获得 `.vue` 导入的真实类型推导。

## 接口文档

[NeteaseCloudMusicApi 使用文档](https://neteasecloudmusicapi.js.org/#/?id=neteasecloudmusicapi)
