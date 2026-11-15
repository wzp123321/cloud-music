# cloud-music-web

Cloud Music 前端 SPA。仓库总览、双服务启动与架构说明见 [根 README](../README.md)。

## 技术栈

Vue 3（`<script setup lang="ts">`）+ TypeScript（strict）+ Vite 5 + Pinia 2（`pinia-plugin-persistedstate`）+ vue-router 4 + Element Plus + axios + Less。

## 环境要求

- Node.js 18+
- 已启动 `cloud-music-server`（NeteaseCloudMusicApi 4.33.0，默认 `http://localhost:19830`）

## 安装与运行

```bash
npm install
npm run dev        # http://localhost:19572
```

开发态所有请求以 `/api` 开头，由 `vite.config.ts` 代理到 `VITE_PROXY_URL` 并去掉 `/api` 前缀，因此需要先启动后端服务。改动后端 `server.js` / `module/` 后需重启 19830 进程。

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
  core/                上游会话凭证 ncm-cookie.ts 等核心工具
  router/modules/*.ts  路由模块，index.ts 自动 glob 注册
  store/               Pinia：player / playlist / lyric / user / singletons
  views/{module}/      页面 + 就近 hooks/
```

- 别名 `@` → `src`。
- 接口统一走 `src/apis/request.ts`：注入上游会话 cookie、错误归一、响应文案中性化；`unwrapData` 兼容 `{code,data}` 与裸数据。
- 新增路由只需在 `router/modules/` 加文件；新增全局 `cm-*` 组件需同步 `components/register.ts`。
- `npm run verify` 覆盖四类易复发问题：卡片漏点击、登录菜单死链、失效接口回流、路由死链。
- `npm run build` / dev server 会自动往 `components.d.ts` 补组件声明，属副产物，提交前还原；工作区常有并行改动，逐文件 `git add`，勿用 `git add -A`。

## 播放器

底栏 `views/home/components/play-controller/play-controller.vue` 持有唯一 `<audio>`（`cm-audio` 包装），挂载后注入 `store/player.ts`；队列在 `store/playlist.ts`，持久化到 `localStorage['cloud-music-list']`（音源 URL 不落盘），当前索引在 `localStorage['cloud-play-index']`。歌词状态在 `store/lyric.ts`，`views/music-detail/` 与底栏共用。

播放队列采用上下文队列：从歌单 / 专辑 / 歌手 / 搜索结果点任一曲，整张列表成为后续队列（`playlist.setQueue`）；手动上/下一首始终按队列顺序切歌，播放模式（循环 / 单曲 / 随机）只影响自然播放结束。从另一张歌单点同一首歌时只刷新队列上下文，保留当前音源与播放进度。

音源按需补拉，旧 `/song/url?br=` 优先、`/song/url/v1` 兜底（v1 常返回 `-460`），取时长更长的非试听源；试听片段按 `audio.duration`（`realDuration` / `displayDuration`）显示总时长、计算进度与 seek，不再拿接口 `dt` 越界跳转。

## 登录凭证与二维码

二维码 803、手机号、邮箱登录的 `body.cookie` 由 `src/core/ncm-cookie.ts` 清洗后落盘到 `localStorage['cloud-ncm-cookie']`，`request.ts` 随每个非二维码请求以 `cookie` 参数回传；退出登录清除。这份凭证决定 `/login/status` 是否返回 profile、`/song/url` 给完整音源还是 30 秒试听片段，与仅用于前端展示的 `cloud-token` 不是一回事。

注意两点：cookie 串必须以**无空格分号**连接（`k=v;k2=v2`），空格会被 axios 编码成 `+` 而服务端不还原；二维码 key/create/check、`login/status`、`login/refresh`、`song/url` 等实时性接口必须带唯一 `t`，否则会被后端 2 分钟 apicache（缓存 key 含完整 URL）命中旧响应，表现为刷新二维码不变、扫码后仍是游客态。

完整链路、二维码状态码与踩坑说明见 [根 README「登录与会话」](../README.md#登录与会话)。

## 品牌与样式约定

页面不出现「网易云」字样：静态文案已中性化，上游接口返回的动态文案由 `request.ts` 的 `stripBrandText()` 递归清洗（只改值不改 key，跳过 `cookie` 与 Blob）。`assets/images/portal/portal-logo.png`（酷你音乐）与 `public/favicon.ico` 是本项目自定义品牌，**不要删除或替换**；上游包名与接口文档链接属技术栈描述，保留。

`assets/style/input.css` 的两条 focus 规则排除 `.el-input__inner` / `.el-textarea__inner`，避免 Element Plus 内部元素叠加多余阴影，同时保留 `cm-input` 的原生 focus ring 与 `.el-input__wrapper` 外光晕。

## 问题与修复记录

播放器、音源、登录、二维码的完整问题与修复记录见 [根 README「播放器问题记录」](../README.md#播放器问题记录) 与 [「已知限制」](../README.md#已知限制)。

## IDE 支持

VS Code + Volar（Vue Language Features）。禁用内置的 TypeScript and JavaScript Language Features（工作区范围）可启用 Take Over 模式，获得 `.vue` 导入的真实类型推导。

## 接口文档

[NeteaseCloudMusicApi 使用文档](https://neteasecloudmusicapi.js.org/#/?id=neteasecloudmusicapi)
