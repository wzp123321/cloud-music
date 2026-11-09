# Design: 补齐网易云前端 P1 体验增强

## Context

`cloud-music-p0-features` 已规划首页/歌单/用户中心/搜索/评论五块。本 change 在其之上补全体验层：专辑/歌手/MV 详情增强、个性化发现与风格分类、红心与播放记录、消息私信、动态话题，以及 P0 未覆盖的用户/歌单补充接口。后端 `cloud-music-server` 的 309 个接口已自动注册，本 change 涉及的接口均已在 server 端就绪。

## Goals / Non-Goals

- **Goals**：把上述 P1 体验增强接口接入前端，使专辑/歌手/MV 详情页、个性化发现、播放记录、消息、动态等页面形态完整可用。
- **Non-Goals**：电台(dj)、视频(video)、云贝(yunbei)、会员(vip)、音乐人(musician)、一起听、数字专辑、云盘、账号注册等增值长尾（P2）不在本轮；不引入新状态管理库或构建工具；不改动 server。

## Decisions

- 接口封装延续现有 `*.api.ts`/`*.service.ts` 分层，统一通过 `getRequest`/`postRequest` 调 server 路由（路由名=文件名下划线转斜杠）。
- 页面沿用 `src/pages/*`：专辑/歌手/MV 增强在现有详情页扩展；个性化发现新增 `src/pages/discovery`；消息/动态新增 `src/pages/message`、`src/pages/feed`；播放记录/红心复用播放器与用户中心。
- 组件复用现有 `cm-album-card`、`cm-mv-card`、`cm-comment` 等；红心/播放记录接入现有状态管理（ref / rxjs BehaviorSubject）。
- 联调策略：每个接口接入前先用 `curl`/浏览器验证 server 返回正常，规避 eapi 失效风险。

## Risks / Trade-offs

- **[eapi 失效]** 原仓库已停更，部分加密接口可能返回异常 → 每个接口先联调验证再写前端，集中失效的模块及时上报。
- **[改动面大]** P1 跨多页多接口 → 按 capability 分批实现与验证，不一次性铺开。
- **[与 P0 互补]** `user-playlist-supplement` 与 P0 `user-center`/`playlist-management` 接口有重叠命名空间，实现时核对避免重复封装。

## Migration Plan

纯新增/扩展，无破坏性变更；上线即生效，无需数据迁移。回滚只需回退前端提交。

## Open Questions

- 个性化发现页是否独立成页还是并入首页（`home-recommendation` 已做区块瀑布流）→ 实现前确认。
- 播放记录是否持久化到本地（server 返回的是登录态记录）→ 依赖登录态，未登录时降级。
