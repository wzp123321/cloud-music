# Cloud Music

本地可运行的网易云音乐 Web 客户端：Vue 3 前端 + NeteaseCloudMusicApi 本地 API 服务。

## 仓库结构

| 目录 | 作用 |
| --- | --- |
| `cloud-music-web/` | 前端 SPA（Vue 3 + TypeScript + Vite） |
| `cloud-music-server/` | API 服务（上游 NeteaseCloudMusicApi v4.33.0） |
| `openspec/` | 需求变更（changes）与已落地能力规范（specs） |

`cloud-music-server/README.MD` 为上游原始文档，本仓库未改写；集成与启动方式以本文为准（旧版 `docs/README.md` 已随 4.33.0 升级移除）。

## 环境要求

- Node.js 18+（上游 4.33.0 声明 `>=18`）
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

改动 `server.js` / `module/` 后需重启 19830 服务（`Ctrl+C` 再 `npm start`），Vite 代理只转发、不会替你重启后端。

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
  config/ constant/ core/ utils/   配置、枚举、上游会话凭证、工具
  hooks/                通用 hooks
  router/modules/*.ts   路由模块，index.ts 用 import.meta.glob 自动注册
  store/                Pinia：player / playlist / lyric / user / singletons
  views/{module}/       页面与就近 hooks/
```

- 新增路由：在 `src/router/modules/` 新建默认导出 `RouteRecordRaw[]` 的文件即可，无需改 `router/index.ts`。
- 新增全局组件：同时更新 `src/components/register.ts`。
- API 与页面逻辑分离：接口放 `src/apis/{module}/`，页面私有逻辑放 `views/{module}/hooks/`。
- 统一请求实例在 `src/apis/request.ts`：注入上游会话 cookie、错误归一、响应文案中性化（`stripBrandText`）；工具类 `unwrapData` 兼容 `{code,data}` 与裸数据两种响应。
- `src/core/ncm-cookie.ts` 管理上游凭证（`localStorage['cloud-ncm-cookie']`），详见「登录与会话」。
- 工作区常有并行改动，提交前逐文件核对，勿用 `git add -A`；`npm run build` / dev server 会自动往 `components.d.ts` 补组件声明，属副产物，提交前还原。

### 播放器实现要点

- 全站唯一 `<audio>` 在 `views/home/components/play-controller/play-controller.vue`，由 `components/cm-audio/cm-audio.vue` 包装；挂载后通过 `player.bindAudio(el)` 注入 store。详情页 `views/music-detail/` 与底栏共用同一播放状态。
- `store/playlist.ts`：队列唯一真相源，持久化到 `localStorage['cloud-music-list']`。音源 URL 为限时地址，序列化与还原时都会置空，播放时按需补拉：旧 `/song/url?br=` 优先、`/song/url/v1` 兜底，都带唯一 `t`，取其中时长更长（非试听片段）的源。`addMusic()` 单曲入队；`setQueue(songs, startId, startUrl?)` 用整张歌单替换队列（上下文队列），只为起始曲补拉 url。
- `store/player.ts`：播放状态与动作。`startPlayback()` 负责补拉音源、驱动 `play()`/进度、拉取歌词；`play(song, context?)` 带上下文时整张入队；`switchMusic()` 手动切歌按队列顺序，`onEnded()` 只在自然结束时按循环、单曲、随机三种模式调度。新增 `realDuration`（`audio.duration`）与 `displayDuration`，试听片段按真实时长显示总时长与计算进度，`seek()` 也改用真实时长。
- `store/lyric.ts`：LRC 解析、逐行同步、点击歌词跳转。
- `localStorage['cloud-play-index']`：当前索引（纯数字字符串，兼容旧格式）。

### 播放器问题记录

| 现象 | 状态 | 说明 |
| --- | --- | --- |
| 点进度条后跳回原处甚至从头播 | 已修复 | `seek()` 以 `@change` 的滑块值为准跳转并恢复播放；`endDragging()` 不再抢先 `play()`；`onTimeUpdate` 在暂停态不回写 `progress`（Element Plus 的 change 在 `nextTick` 后才 emit） |
| 点歌名/详情或重点当前歌曲会从头播 | 已修复 | `play()` 命中当前歌曲直接返回（暂停态则恢复播放），不再 `reset currentTime`、不再重复入队 |
| 刷新后首次点播放无声，需再点 | 已修复 | `startPlayback()` 在 `el.play()` 前 `await nextTick()`，等响应式 `:src` patch 到 DOM |
| 歌单里播一首后点「下一首」仍是同一首 | 已修复 | 上下文队列：`cm-table` 播放/点歌名时把整张 `dataSource` 传给 `play(song, context)`，`playlist.setQueue()` 整张入队并定位当前曲；底栏/详情页上、下一首改绑 `switchMusic()`，播放模式只约束 `@ended`；歌单/专辑/歌手页「播放全部」入口均已接线；跨歌单点同一首歌只刷新上下文，不打断播放 |
| 歌曲播到 30 秒左右就停 | 已修复 | 上游会话凭证没落盘导致只返回试听片段；凭证链路见「登录与会话」；同时 `onEnded()` 的试听检测不再 `pause()` 停死队列，仍按播放模式推进（每首只提示一次） |
| 显示 5:00 实际半分钟就结束、进度条对不上 | 已修复 | 新增 `realDuration` / `displayDuration`，试听片段按真实时长显示与计算 progress，底栏和详情页总时长改绑 `displayDuration` |
| 点进度条 70% 立刻切歌 | 已修复 | `seek()` / `seekTo()` 改用真实时长而非接口 `dt`，避免 seek 到试听音频之外直接触发 `ended` |
| 部分歌曲完全没声音 | 已修复 | `/song/url/v1` 对多数曲目返回 `-460 网络环境存在风险`，改为旧接口优先、v1 兜底，并给请求带唯一 `t`，避免 `-460` 这个 HTTP 200 被 apicache 缓存 2 分钟后反复失败 |

### 登录与会话

**两个看似无关的问题同源**：凭证没落盘 → 所有接口按游客处理 → `/login/status` 恒为未登录、`/song/url` 只给 30 秒试听片段。

| 环节 | 实现 |
| --- | --- |
| 凭证来源 | 二维码 803、手机号、邮箱登录的响应 `body.cookie`（`useLogin.ts` 三处落盘），`login_refresh` 用 `mergeNcmCookie` 合并 |
| 凭证存储 | `localStorage['cloud-ncm-cookie']`，`src/core/ncm-cookie.ts` 清洗掉 `Max-Age/Path/HTTPOnly` 等属性；退出登录清除 |
| 凭证回传 | `request.ts` 给所有非二维码请求注入 `cookie` 参数；二维码 key/create/check 不带 cookie |
| 状态读取 | `login_status.js` 把 `code/profile` 包在 `data` 里，`user.service.ts` 归一化出顶层 `code`，否则判登录恒 false |
| 二维码状态 | 800 过期（自动刷新）/ 801 等待扫码 / 802 待确认 / 803 成功（关闭弹窗、落盘凭证） |

两个易踩的坑：

1. **cookie 串必须用无空格分号连接**（`k=v;k2=v2`）。空格会被 axios 序列化成 `+`，服务端 `decodeURIComponent` 不还原，下一组键名会变成 `+__csrf`。
2. **实时性接口必须带唯一参数 `t`**（二维码 key/create/check、`login/status`、`login/refresh`、`song/url`）。`server.js:265` 对所有 HTTP 200 做 `cache('2 minutes')`，缓存 key 含完整 URL，不带 `t` 会读到 2 分钟前的「未扫码 / 游客态 / -460」。

`cloud-token`（用户资料 JSON，仅用于前端展示和 Authorization 头）与 `cloud-ncm-cookie` 不是一回事：上游判断登录态只看后者。

### 品牌与文案

- 页面不出现「网易云」字样：静态文案（title、扫码提示、榜单占位、能力页、MV 页）已改；上游 API 返回的动态文案由 `src/apis/request.ts` 响应出口的 `stripBrandText()` 递归清洗，只改字符串值、不改字段名，跳过 `cookie` 键与 Blob 等对象。
- 19830 服务首页与 `/docs/` 的可见文案也做了中性化。
- **保留、勿删**：`src/assets/images/portal/portal-logo.png`（酷你音乐）与 `public/favicon.ico` 是本项目自定义品牌；上游包名、接口文档链接、`cloud-music-server/README.MD` 与 `openspec/` 中的技术栈描述属技术说明，一并保留。
- 输入框聚焦阴影：`src/assets/style/input.css` 两条 focus 规则排除 `.el-input__inner` / `.el-textarea__inner`，避免 Element Plus 内部元素叠加出「框中框」，同时保留 `cm-input` 原生 focus ring 与 `.el-input__wrapper` 外光晕。

## API 服务（cloud-music-server）

- 上游版本 4.33.0（来自 npm registry 的 `NeteaseCloudMusicApi@4.33.0` tarball，包管理统一为 npm）；`module/` 下 439 个接口由 `server.js` 自动注册，无需手工挂载。
- `npm start` 即 `node app.js`；`PORT=4000 npm start` 可换端口（同时需同步前端 `VITE_PROXY_URL`）。
- `server.js:265` 对所有 HTTP 200 响应做 2 分钟 apicache，缓存 key 含完整 URL；二维码、登录状态、音源这类需要实时性的请求一律带唯一 `t`。
- **自定义修复（每次拉上游代码都要重套）**：`module/login_qr_check.js` 的 catch 返回 `{status:200, body:{code:800, message:'二维码不存在或已过期'}, cookie:[]}`。上游原版在 catch 里引用未定义的 `result.cookie`，会二次抛错冒泡到 `server.js` 顶层 catch，因 body 为空返回 404，前端轮询静默忽略 → 扫码登录卡死无提示。
- 接口文档：<https://neteasecloudmusicapi.js.org/#/?id=neteasecloudmusicapi>
- 登录态相关接口需要 cookie；未登录时 `/song/url` 可能只返回 30 秒试听片段。

### 已知限制

| 现象 | 说明 |
| --- | --- |
| VIP / 付费 / 版权受限曲目仍只有试听片段 | 上游版权与会员限制，前端无法绕过，需有效会员凭证 |
| 刷新二维码后图片不变 | 检查二维码三个接口是否都带 `t`；不带会被 apicache 命中旧响应 |
| 改了后端代码但行为没变 | 19830 是常驻进程，需手动重启；Vite HMR 不会重载后端 |
| 构建后 `components.d.ts` 多出组件声明 | Vite 自动生成，属副产物，提交前还原 |

## OpenSpec

- `openspec/changes/`：进行中与已归档的变更（proposal / design / tasks）。
- `openspec/specs/`：已落地能力规范（首页推荐、歌单管理、搜索增强、评论互动、用户中心）。
- `openspec/config.yaml`：所有 artifact 使用中文，保留 OpenSpec 结构标题与 SHALL/MUST 关键字。
