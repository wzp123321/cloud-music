# Design: 补齐网易云前端 P2 增值长尾

## Context

`cloud-music-p0-features` 与 `cloud-music-p1-enhancement` 已规划核心与体验层。本 change 覆盖 server 端 309 接口中剩余的增值长尾：电台、视频、播客、云贝、会员、音乐人、UGC、一起听、粉丝中心、数字专辑、云盘、账号资料与杂项。后端接口均已就绪，仅前端未接入。

## Goals / Non-Goals

- **Goals**：把上述长尾接口接入前端，使电台/视频/播客/云盘/数字专辑等独立内容形态，以及云贝/会员/音乐人/账号等增值体系在前端有规划归属与实现路径。
- **Non-Goals**：P0/P1 已覆盖的首页/歌单/用户中心/搜索/评论/专辑/歌手/MV/消息/动态不在本轮；不引入新状态管理库或构建工具；不改动 server。

## Decisions

- 接口封装延续现有 `*.api.ts`/`*.service.ts` 分层，统一调 server 路由（文件名下划线转斜杠；3 条例外见「运行时基线」）。
- 新增独立页面：`src/pages/radio`（电台）、`src/pages/video`（视频/播客）、`src/pages/account`（账号资料）、`src/pages/digital`（数字专辑）等；一起听房间作为播放器扩展。
- 云贝/会员/音乐人作为个人中心内子模块；粉丝中心作为音乐人/主播页扩展。
- 联调策略：每个接口接入前先用 `curl`/浏览器验证 server 返回，规避 eapi 失效风险；长尾接口失效概率更高，优先验证再实现。

## Risks / Trade-offs

- **[eapi 失效概率高]** 长尾多为加密接口且使用率低，原仓库停更后更易失效 → 严格逐接口联调，失效模块在提案中标注"待验证/可能不可用"。
- **[改动面最大]** 本 change 覆盖接口最多（约 100+）→ 按 capability 分批实现与验证。
- **[账号类风险]** 注册/换绑/验证码类接口涉及账号安全 → 实现时需谨慎，避免误触发真实注册/绑定流程。

## Migration Plan

纯新增/扩展，无破坏性变更；上线即生效，无需数据迁移。回滚只需回退前端提交。

## Open Questions

- 一起听（listentogether）依赖实时信令，前端是否需要 WebSocket/长轮询 → 实现前确认实现成本。
- 数字专辑/云贝涉及虚拟消费，是否需要支付闭环 → 本期仅做展示与查询，不下单。

## 运行时基线（2026-11-09 实测，编码前置）

来源：`.sdd/runtime-probe.md` 及两轮全量匿名探测（server 4.13.3，端口 `10130`）。「长尾失效概率高」的旧假设已被证伪：抽样 19 个中 17 个接口本身有效。但长尾的**登录态依赖**远高于核心层，须按下表分级。

### 路由规则修正

`server.js:193` 的 `special` 表覆盖 `parseRoute`（下划线转斜杠），**3 条例外必须写下划线路径**：`/personal_fm`、`/fm_trash`、`/daily_signin`。其中 `daily_signin` 属本 change 的账号模块，写成 `/daily/signin` 会 404。

### 接口分级（P2 共 111 个）

| 级别 | 数量 | 处置 |
|---|---|---|
| 匿名 / 带真实参数可用 | 约 47（含 dj 分类与榜单、record、部分 video/ugc） | 可直接接入；详情型必须挂在列表点击链上 |
| 需登录（`code:301`） | 约 51 | 云贝、会员、音乐人、粉丝中心、一起听、消息等；接口有效、缺 cookie，本环境只静态验证 |
| 写操作 / 账号动作 | 约 68 | 订阅、房间创建/结束、签到、注册、验证码、上传、下单；**禁止匿名探测**，需登录态验收 |
| 失效 / 待核 | 见下 | 不写进 UI 主路径 |

### 失效与例外登记

- `/yunbei/info`：上游 `api/v1/user/info` 404（同域 `/yunbei`、`/yunbei/tasks` 有效）→ 单点下线，登记不接；云贝域其余可用。
- `/cloud`、`/cloud_match`：上传/匹配接口，GET 探测不适用；`/cloud/match` 实测 301 需登录，路由有效。
- `digitalAlbum_detail` / `digitalAlbum_sales`：需有效 `id`，裸测 `code:400`，待核；`digitalAlbum_purchased` 需登录。
- `topic_detail` / `topic_detail_event_hot`：需有效 `actid`；`video_detail`：需有效视频 id（非分组 id）→ 待核。
- `pl_count`、`aidj_content_rcmd`：业务异常，暂不进主路径。
- 匿名 GET 返回 400/502 **不等于失效**：两轮带真实参数复测救回 29 个接口。

### 编码硬约束

1. **参数来源**：凡需 `rid`/`cateId`/`id`/`vid`/`uid`/`actid`/`voiceListId` 的接口，任务里必须写明参数取自哪个上游列表（如 `dj_program.rid` ← `/dj/recommend` 的 `djRadios[].id`）。
2. **UI 可触达**：每个封装函数必须有页面/组件真实调用点；「只封装不挂载」视为未完成。P0 已有 8 个此类死代码，不得复制。
3. **账号类安全**：`captcha_sent`、`register_cellphone`、`rebind`、`activate_init_profile`、`digitalAlbum_ordering`、`verify_getQr` 等一律不做匿名探测、不在无账号环境触发；实现时须有明确用户操作与二次确认。
4. **链路顺序**：先列表/入口型，再详情型；验收以「列表 → 点击带参 → 详情渲染」整条链为准。
