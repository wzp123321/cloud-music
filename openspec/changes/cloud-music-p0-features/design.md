# Design: 补齐网易云前端 P0 核心功能

## Context

当前 `cloud-music-web`（Vue3 + Vite + TS）已有一套可运行骨架：axios 封装在 `src/services/request.ts`，按功能页划分 `src/pages/*`，复用组件 `src/components/cm-*`，播放器在 `src/views/home`。后端 `cloud-music-server` 已自动注册 309 个接口（`main.js` 遍历 `module/` 目录），无需改动。缺口是前端的 services 层与页面未接入 284 个未用接口中的 P0 部分（详见 proposal.md）。

## Goals / Non-Goals

- **Goals**：补齐 P0 五块功能（首页推荐/歌单生态/用户中心/搜索增强/评论互动），保持与现有 services+pages+components 架构一致。
- **Non-Goals**：电台(dj)、视频(video)、云贝(yunbei)、会员(vip)、音乐人(musician)、一起听、数字专辑等长尾（P2）不在本轮；不引入新的状态管理库或构建工具；不改动 server。

## Decisions

- 接口封装延续现有 `*.api.ts`/`*.service.ts` 分层：每个新功能在对应 page 下新增 service，统一通过 `getRequest`/`postRequest` 调 server 路由（路由名=接口文件名下划线转斜杠，如 `/song/url`）。
- 页面沿用 `src/pages/*` 结构，新增 `src/pages/playlist/`（分类/我的/创建）、`src/pages/user/`（中心/关注/粉丝）等；路由在 `src/router` 注册。
- 组件复用现有 `cm-playlist-card`、`cm-album-card`、`cm-mv-card`、`cm-comment`；评论点赞/楼层/热评在 `cm-comment` 内扩展。
- 状态管理沿用现有模式（ref / rxjs BehaviorSubject，如 `music-detail.service`），不引入 Pinia。
- 联调策略：每个接口接入前先用 `curl`/浏览器验证 server 返回正常，规避 eapi 失效风险。

## Risks / Trade-offs

- **[eapi 失效]** 原仓库已停更，部分加密接口可能返回异常 → 每个接口先联调验证再写前端，集中失效的模块及时上报。
- **[改动面大]** P0 跨多页多接口 → 按模块分批实现与验证，不一次性铺开。
- **[拼写 bug 全局性]** `ablum` 拼写错误散布在 `search.service.ts`/`search.vue` → 全局替换并核对引用，避免漏改。

## Migration Plan

纯新增/扩展，无破坏性变更；上线即生效，无需数据迁移。回滚只需回退前端提交。

## Open Questions

- 是否引入路由懒加载以减小首包（可延后，不影响功能）。
- 个人中心是否复用现有 `src/pages/user` 还是重构（取决于现有 user 页现状，实现前确认）。
