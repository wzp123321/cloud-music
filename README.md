# Cloud Music

本地可运行的音乐 Web 客户端：Vue 3 前端 + NeteaseCloudMusicApi 本地 API 服务。

## 功能

| 模块 | 能力 |
| --- | --- |
| 播放器 | 全站单一播放状态，底栏与歌曲详情页同步；进度拖动、歌词逐行同步与点击跳转；循环 / 单曲 / 随机三种播放模式 |
| 播放队列 | 从歌单、专辑、歌手、搜索结果点任一曲，整张列表成为后续队列；手动上 / 下一首按队列顺序切歌；「播放全部」一键播放整张列表 |
| 音乐发现 | 首页推荐、榜单、歌单、专辑、歌手、搜索、MV、评论互动 |
| 登录 | 二维码扫码、手机号、邮箱登录；会话凭证本地持久化，登录后获取完整音源 |
| 用户中心 | 个人资料、收藏与听歌记录 |
| API 服务 | 本地 NeteaseCloudMusicApi 4.33.0，400+ 接口自动注册，前端统一代理访问 |
| 接口总览 | 与服务端路由一一对应的全量清单，按功能域检索、填写参数并真实调用；写操作二次确认 |

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3 `<script setup>` + TypeScript + Vite 5 + Pinia（`pinia-plugin-persistedstate`）+ vue-router 4 + Element Plus + axios + Less |
| 后端 | Node.js + Express（NeteaseCloudMusicApi 4.33.0） |
| 工程 | ESLint 9、`vue-tsc`、npm |

## 仓库结构

| 目录 | 作用 |
| --- | --- |
| `cloud-music-web/` | 前端 SPA |
| `cloud-music-server/` | API 服务 |
| `openspec/` | 需求变更（changes）与已落地能力规范（specs） |

## 环境要求

- Node.js 18+
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

别名 `@` → `src`。

### 常用脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | `vue-tsc --noEmit` + 生产构建，产物 `dist/cloud-web/` |
| `npm run preview` | 预览构建产物 |
| `npm run lint` / `lint:fix` | ESLint 9 检查 / 自动修复 |
| `npm run verify` | 静态回归：卡片点击、登录菜单、失效接口回流、路由死链 |
| `npm run sync:routes` | 从服务端 `module/` 重新生成全量接口清单（server 更新后执行） |

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
  config/ constant/ core/ utils/   配置、枚举、会话凭证、工具
  hooks/                通用 hooks
  router/modules/*.ts   路由模块，index.ts 用 import.meta.glob 自动注册
  store/                Pinia：player / playlist / lyric / user / singletons
  views/{module}/       页面与就近 hooks/
```

- 新增路由：在 `src/router/modules/` 新建默认导出 `RouteRecordRaw[]` 的文件即可。
- 新增全局组件：同时更新 `src/components/register.ts`。
- 统一请求实例在 `src/apis/request.ts`，`unwrapData` 兼容 `{code,data}` 与裸数据两种响应。

## API 服务（cloud-music-server）

上游 NeteaseCloudMusicApi 4.33.0 的本地服务。`module/` 下 439 个接口由 `server.js` 自动注册为路由，前端统一通过 `/api` 代理访问。

### 常用脚本

| 命令 | 作用 |
| --- | --- |
| `npm start` | `node app.js`，启动服务（`http://localhost:19830`） |
| `npm test` | mocha 测试 |
| `npm run lint` / `lint-fix` | ESLint 检查 / 自动修复 |

### 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `19830` | 服务端口；改端口需同步前端 `VITE_PROXY_URL` |

### 目录约定

```
module/       接口实现，server.js 自动注册为路由
util/         工具（签名、加解密、日志等）
plugins/      请求前置 / 后置插件
public/       静态页面与接口文档
data/         运行时数据
```

- 入口：`app.js`（启动）、`server.js`（Express 注册）、`main.js`（作为 npm 包引入时使用）。
- 依赖为 vendored（随仓库提交），`npm install` 即可运行；改端口用 `PORT=4000 npm start`。
- 接口文档：<https://neteasecloudmusicapi.js.org/#/?id=neteasecloudmusicapi>
