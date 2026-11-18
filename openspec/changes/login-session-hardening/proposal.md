# Proposal

## Why

前端把「用户资料 JSON」当作登录凭证：只写进 `cloud-token` cookie，且无有效期。真实会话凭证是后端下发的 `MUSIC_U` 等 cookie，前端既不持久化也不感知其失效——后端在缺少 `MUSIC_U` 时会静默注入全局匿名 token 降级为游客态，前端毫无察觉，表现为「刷新/重开浏览器后登录态消失」或「显示已登录但歌单、云盘全空」。

2026-11-17 已落地临时方案（凭证存入 localStorage、逐请求回传），但凭证所有权仍散落在 login hook、store、请求拦截器三处，靠类型嗅探注入，且无失效仲裁。本次收敛为单一所有者并统一命名规范。

## What Changes

- 登录凭证生命周期收口到 `SessionManager`：建立、续期、吊销、快照、存活判定由同一模块负责，store 只订阅状态。
- 请求层取消对 payload 形态的运行时嗅探，改为在请求组装阶段显式组合会话参数。
- 凭证读取改为内存缓存 + 变更落盘，不再逐请求同步读 localStorage。
- 删除 `hasLogin()` 中针对旧快照 cookie 的兼容分支，并给 `cloud-token` 设定退役条件。
- hook 状态改造（47 个 `_` 前缀状态直出 ref）移交独立变更 `hook-state-normalization`，本变更不涉及。
- **BREAKING**：全仓模块常量由 `SCREAMING_SNAKE_CASE` 统一为 `camelCase`，涉及 31 处声明、约 60 处引用，所有导入这些常量的模块需同步修改。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `user-center`: 「登录状态保持」要求从「依赖 `login_refresh` / `login_status` 恢复会话」细化为「凭证必须跨刷新与浏览器重启持久化、可续期、失效可判定」，并明确失效后不得以已登录态呈现；同时新增「登录凭证本地持久化」「会话失效自动降级」「首屏登录态快照」三项要求。

## Impact

**代码**：`src/core/session.ts`、`src/core/token.ts`、`src/apis/request.ts`、`src/store/user.ts`、`src/views/header/header-loginform/hooks/useLogin.ts`、`src/views/header/hooks/useHeaderView.ts`、`src/apis/content-enhance/content-enhance.service.ts`；命名迁移额外波及 `src/utils/`、`src/config/`、`src/constant/`、`src/components/`、`src/views/` 下 20 余个文件。

**接口**：不改后端。请求参数新增 `cookie` 字段（后端 `server.js` 已支持解析，且优先级高于浏览器 cookie）。

**存储**：新增 localStorage 键 `cloud-session`；`cloud-token` 降级为首屏渲染快照并加 30 天有效期。

**风险面**：命名迁移与三个在途变更（`cloud-music-p1-enhancement`、`cloud-music-p2-longtail`、`cloud-music-modernize`）存在文件级重叠，需排在它们归档之后或接受一次 rebase。
