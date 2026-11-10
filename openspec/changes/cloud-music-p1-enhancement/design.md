# Design: 补齐网易云前端 P1 体验增强

## Context

`cloud-music-p0-features` 已规划首页/歌单/用户中心/搜索/评论五块。本 change 在其之上补全体验层：专辑/歌手/MV 详情增强、个性化发现与风格分类、红心与播放记录、消息私信、动态话题，以及 P0 未覆盖的用户/歌单补充接口。后端 `cloud-music-server` 的 309 个接口已自动注册，本 change 涉及的接口均已在 server 端就绪。

## Goals / Non-Goals

- **Goals**：把上述 P1 体验增强接口接入前端，使专辑/歌手/MV 详情页、个性化发现、播放记录、消息、动态等页面形态完整可用。
- **Non-Goals**：电台(dj)、视频(video)、云贝(yunbei)、会员(vip)、音乐人(musician)、一起听、数字专辑、云盘、账号注册等增值长尾（P2）不在本轮；不引入新状态管理库或构建工具；不改动 server。

## Decisions

- 接口封装延续现有 `*.api.ts`/`*.service.ts` 分层，统一通过 `getRequest`/`postRequest` 调 server 路由（路由名=文件名下划线转斜杠；3 条例外见「运行时基线」）。
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

## 运行时基线（2026-11-09 实测，编码前置）

来源：`.sdd/runtime-probe.md` 及两轮全量匿名探测（server 4.13.3，端口 `19830`）。本 change 的接口不以「文档列了」为可接依据，一律按下表分级。

### 路由规则修正

`server.js:193` 的 `special` 表覆盖 `parseRoute`（下划线转斜杠），**3 条例外必须写下划线路径**：

| module            | 正确 URL        | 错误写法              |
| ----------------- | --------------- | --------------------- |
| `personal_fm.js`  | `/personal_fm`  | `/personal/fm` → 404  |
| `fm_trash.js`     | `/fm_trash`     | `/fm/trash` → 404     |
| `daily_signin.js` | `/daily_signin` | `/daily/signin` → 404 |

`personal_fm` 实测匿名返回真实数据；另两个是写操作，需登录态。

### 接口分级

| 级别                           | 数量                     | 处置                                                   |
| ------------------------------ | ------------------------ | ------------------------------------------------------ |
| 匿名可用（含带真实参数后可用） | P1-A 33 / 45；P1-B+P2 46 | 可直接接入，详情型必须挂在列表点击链上                 |
| 需登录（`code:301`）           | P1-A 3；P1-B+P2 51       | 接口有效、缺 cookie；本环境只静态验证，UI 做未登录降级 |
| 写操作 / 账号动作              | P1-A 7；P1-B+P2 68       | 订阅、发私信、签到、上传等；禁止匿名探测，需登录态验收 |
| 失效 / 待核                    | 见下                     | 不写进 UI 主路径                                       |

### 失效与替代登记

- `/top/list`：上游 `playlist/v4/detail` 已变，6 个真实榜单 id 全 `code:400`；同 id 打 `/playlist/detail` 全 200。**P0 遗留，本 change 不修**，但排行榜相关能力不得依赖 `/top/list`。
- `/yunbei/info`：上游 `api/v1/user/info` 404（同域 `/yunbei`、`/yunbei/tasks` 有效）→ 单点下线，登记不接。
- `topic_detail` / `topic_detail_event_hot` 需有效 `actid`，`video_detail` 需有效视频 id，本环境拿不到 → 待核。
- 匿名 GET 返回 400/502 **不等于失效**：两轮带真实参数复测救回 29 个接口；带正确参数仍非 200 才登记失效。

### 编码硬约束

1. **参数来源**：凡需 `id`/`rid`/`tagId`/`cateId`/`mvid`/`vid`/`keywords` 的接口，任务里必须写明参数取自哪个上游列表（如 `album_detail_dynamic.id` ← `/album/new` 的 `albums[].id`）。
2. **UI 可触达**：每个封装函数必须有页面/组件真实调用点；「只封装不挂载」视为未完成。P0 已有 8 个此类死代码，不得复制。
3. **链路顺序**：先列表/入口型，再详情型；验收以「列表 → 点击带参 → 详情渲染」整条链为准，不以 URL 字面量出现为准。
