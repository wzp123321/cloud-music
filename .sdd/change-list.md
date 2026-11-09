# cloud-music-p0-features 变更清单（卡点④）

统计：已跟踪文件 **35 个修改**（+3140 / -193），新增文件/目录 **15 组**。仅 `cloud-music-web` 前端，`cloud-music-server` 零改动。

| 任务 | 模块 | 改动文件 |
|---|---|---|
| 1.1 | 缺陷修复 | `portal/services/portal.service.ts`（`/ablum_detail`→`/album_detail`）、`services/common-api/common-api.ts`（`Common_IAlbumVO`）、`pages/search/search.service.ts` + `search.vue`（`ablum`→`album`） |
| 1.2 | 死代码清理 | `views/home/components/play-controller/pc.service.ts`（删 `getSongUrlByIds`） |
| 2.1–2.3 | 首页推荐流+排行榜 | `portal/services/portal-api.ts`（+367 类型）、`portal-request.service.ts`（18 URL）、`portal.service.ts`（+285 状态层）、`portal.ts`/`portal.html`（注册挂载）；**新建** `portal-dragon-ball/`、`portal-block-page/`、`pages/daily-recommend/`、`pages/rank/`；`router/routes.ts` 加 `/daily_recommend`、`/rank`、`/rank_detail` |
| 3.1–3.4 | 歌单生态 | **新建** `services/playlist-manage.api.ts`（19 接口）、`pages/playlist/my-playlist.vue`、`pages/playlist/components/playlist-form-dialog.vue`；改 `pages/playlist/playlist.vue`、`playlist-detail.service.ts`/`.vue`、`components/cm-playlist-card/`、`components/cm-table/`、`services/request.ts`（`postFormRequest` + `publicReq` Content-Type 修复）；`router/routes.ts` 加 `/playlist`、`/playlist/my` |
| 4.1–4.5 | 用户中心+登录增强 | **新建** `services/user.api.ts`/`user.service.ts`（19 接口）、`pages/user/user.vue` + `components/`（8 组件）+ `user.service.ts`；改 `views/header/header-loginform/*`（二维码登录）、`views/header/header.ts`/`header.html`（会话恢复）；`router/routes.ts` 加 `/user` |
| 5.1 | 搜索增强 | **新建** `services/search-enhance.api.ts`（4 接口）；改 `views/header/header.service.ts`/`.html`/`.ts`/`.less`（热搜+联想面板）、`pages/search/search.service.ts`/`.vue`（多重匹配） |
| 5.2–5.4 | 评论互动+相似推荐 | 改 `components/cm-comment/cm-comment.api.ts`/`.vue`（双模式，18 接口）；**新建** `components/cm-simi/`；详情页挂载：`album-detail`、`artist-detail`、`music-detail`、`mvplay`、`playlist-detail` |
| 6.1 | 集成验证 | `.sdd/`（state、integration-audit、cross-review、build-gate、本清单） |

## 需单独决策的两类文件

1. **`cloud-music-web/auto-imports.d.ts`**：自动生成的类型声明，由 `npm install` / 构建过程刷新，非人工业务改动。
2. **`openspec/`**：上一轮会话建立的 3 个 change 规划工件（`cloud-music-p0-features` / `p1-enhancement` / `p2-longtail`），当时未提交，本轮也未改动。

## 验证状态

| 门 | 结论 |
|---|---|
| 集成审计 | 68/68 端点覆盖，🔴 2 项经返工补齐 → **0 阻断** |
| 卡点③交叉评审 | 五模块存在性/非占位/契约吻合全过 → **通过** |
| `vue-tsc --noEmit` | 退出码 **0**（`playlist-detail.service.ts:69` 已修） |
| `npm run build` | 退出码 **1 · 阻断**：`vite.config.ts:53` admin 入口 `pConfigurationPage.html` 不存在（既有配置问题，非本次改动） |
| 运行时联调 | **未做**：server 未启动，eapi 接口可用性未验证（任务 6.1 待办） |

## 🟡 待补 UI（非阻断，本轮未做）

歌单 5 项 `deletePlaylist` / `getPlaylistSubscribers` / `updatePlaylistCover` / `updatePlaylistPrivacy` / `updatePlaylistOrder`；用户 3 项 `getUserBinding` / `bindingCellphone` / `uploadAvatar`。端点与封装齐全，缺页面入口。
