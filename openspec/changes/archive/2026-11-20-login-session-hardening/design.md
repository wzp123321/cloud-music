# Design

## Context

动机与范围见 `proposal.md`。以下是塑造方案的技术约束：

- 后端是 `NeteaseCloudMusicApi`，鉴权完全依赖上游 cookie（`MUSIC_U` / `MUSIC_A` / `__csrf`），没有独立 token，也不读 `Authorization` 头。
- 缺少 `MUSIC_U` 时后端注入全局 `anonymous_token`，**静默按游客返回**，不报错、不返回 401。
- `server.js` 用 `Object.assign({}, { cookie: req.cookies }, req.query, req.body, ...)` 组装参数，显式传入的 `cookie` 优先级高于浏览器 cookie，且接受字符串形式。
- 前端为 Vue 3 + Pinia 单体应用，无 SSR，登录态只在浏览器侧维护；单人单机使用，不改后端。

当前实现是 2026-11-17 的临时方案：`localStorage['cloud-session']` 保存后端下发的 cookie 串，axios 请求拦截器按 payload 形态嗅探后注入。它能解决「刷新即丢」，但留下了所有权分散与嗅探漏注入两类问题。

## Goals / Non-Goals

**Goals:**

- 登录凭证只有一个所有者，建立、续期、吊销、判定存活由同一模块负责。
- 请求注入不依赖运行时类型嗅探，新增请求形态时不会静默漏注入。
- 消除逐请求的同步存储读取。
- 命名规范收敛为单一可执行标准，存量一次迁完。

**Non-Goals:**

- 不改后端，不引入 JWT 或独立 token。
- 不做多用户、跨设备、跨浏览器同步。
- 不迁移到 IndexedDB（凭证体积 < 1KB，localStorage 足够）。

## Decisions

### D1 凭证所有权：`SessionManager` 单例

`core/session.ts` 导出一个实例，而不是三个游离函数。接口：

| 方法 | 职责 |
|---|---|
| `establish(rawCookie)` | 登录成功后建立会话，规范化并落盘 |
| `renew(rawCookie?)` | 续期：有入参则替换，无入参则触发 `login_refresh` |
| `revoke()` | 吊销：清内存、清存储（登出或判定失效） |
| `snapshot()` | 返回当前 cookie 串供请求层注入 |
| `isAlive()` | 是否持有可用会话 |

**为什么不用 Pinia store 承担**：store 是视图层状态容器，凭证是基础设施，二者生命周期不同（store 会随 HMR 重建，凭证不能）。**为什么不用模块级散落函数**：无法保证「内存值 / 存储值 / 后端真值」三者一致，失效态无从判定。

### D2 注入点：`publicReq` 显式组合

在请求组装层调用 `withSession(payload)`，组装完再交给 axios，删除拦截器里的 `instanceof FormData` / `typeof === 'object'` / `undefined` 三路嗅探。

**为什么**：嗅探把「请求参数模型」交给运行时猜测，上一版正是漏了 `data === undefined` 分支导致 `/login/refresh`、`/logout` 不带凭证。显式组合让 payload 形态在调用点就确定，新增形态只需在 `withSession` 内加一个分支，且类型层面可见。

`getBlobResponse` 等直接走 axios 实例的出口，统一改为经过 `publicReq` 或显式调用 `withSession`，不留旁路。

### D3 读取策略：内存缓存

`SessionManager` 在模块初始化时读一次存储，之后只在 `establish` / `renew` / `revoke` 时写盘。`snapshot()` 返回内存值。

**代价**：多标签页不同步。**缓解**：监听 `storage` 事件，键匹配时刷新内存值。

### D4 一致性仲裁：单一真源 + 失效探测

- `SessionManager` 是唯一真源；浏览器 cookie 只是后端 `Set-Cookie` 的副产品，前端不再读取。
- 失效探测：任一需登录接口返回 `account.anonimousUser === true` 且 `isAlive()` 为真 → 触发一次 `renew()`；仍为游客态则 `revoke()`，页面回到未登录。
- 探测只在明确的「需登录语义」响应上做，不做全局响应拦截，避免匿名接口误判。

### D5 `cloud-token` 的定位

保留，但职责收窄为「首屏 profile 快照」：30 天有效期，仅供刷新瞬间渲染头像，**不参与任何登录判定**。

**为什么保留而非直接删**：重开浏览器后需要一次 `login_status` 往返才能拿到 profile，期间会闪一下未登录。保留快照换来无感首屏，代价是一条明文 PII cookie（已知风险，接受）。后续若要彻底消除，可改存 `sessionStorage` 并接受首屏骨架屏。

### D6 命名规范

| 对象 | 规范 | 本次是否执行 |
|---|---|---|
| 变量 / 函数 / 参数 / 对象成员 | `camelCase` | 是 |
| 模块级常量 | `camelCase`（如 `TOKEN_KEY` → `tokenKey`） | 是 |
| hook 内部状态与返回成员 | 见 `hook-state-normalization` | 否，独立变更 |
| 类型 / 接口 / 枚举 / 组件 | `PascalCase`，禁模块下划线前缀 | 否，见 D9 |
| 枚举成员 | 中文标识（`ELOGINTYPE.邮箱`） | 不变 |
| 文件名 | `kebab-case` | 不变 |
| 环境变量 | `VITE_*`，外部约定 | 不变 |
| Ref 订阅字段 | `$` 后缀（`loginResult$`） | 不变 |

**常量存量清单**：31 处声明、约 60 处引用，分布在 `core/`、`config/`、`constant/`、`utils/`、`components/`、`store/`、`views/`。

**执行方式**：机械化改名 + `tsc --noEmit` 兜底，独立 commit，不与行为变更混提。顺带修正 `TIME_OUT` 的拼写为 `timeout`。

### D7 `hasLogin()` 退役

合并为 `sessionManager.isAlive()`，删除 `getCookie(TOKEN_KEY)` 兼容分支。旧版本用户首次访问时 `cloud-session` 为空但浏览器可能仍有 `MUSIC_U`，此时首个请求走浏览器 cookie，`login_refresh` 成功即自动落盘，无需兼容分支。

### D8 hook 状态改造：移交独立变更

hook 内部 47 个 `_` 前缀状态、8 个 hook、12 个消费文件、145 处成员访问的改造，与登录态持久化没有因果关系，已拆为独立 change `hook-state-normalization`，本变更不涉及。命名细则见该 change 的 `design.md`。

### D9 类型名前缀：本次不执行

全仓还有 **62 个类型/接口**带模块下划线前缀，是比常量和 hook 变量更大的一批：

| 前缀 | 数量 | 示例 |
|---|---|---|
| `UC_` | 19 | `UC_Playlist`、`UC_UserDetail` |
| `PM_` | 10 | `PM_PlaylistVO`、`PM_DynamicRes` |
| `CM_` | 10 | `CM_CommentType`、`CM_SimiItem` |
| `SE_` | 7 | `SE_HotItem`、`SE_HotRes` |
| `CS_` | 5 | `CS_SongDetail`、`CS_MvUrl` |
| `Common_` | 3 | `Common_IMusic`、`Common_IUserVO` |
| `MP_` / `SEARCH_` / `PL_` / `PD_` / `Header_` / `HL_` / `AD_` | 各 1-2 | `MP_MvDetail`、`SEARCH_MultimatchEntry` |

外加 1 处 camel_snake 混写：`artistDetail.is_error`（应改 `isError`）。

**为什么不并入本期**：这 62 个前缀是在手工模拟模块命名空间（`CM_` = comment，`SE_` = search，`PM_` = playlist module）。规范做法是用目录隔离或 `import * as` 命名空间，而不是在类型名上编码来源。但重命名要动全仓引用，改动量超过本期三个阶段之和，且不修复任何缺陷。`Common_I` 前缀还叠了匈牙利式 `I`，属于双重违规，改法（`CommonIMusic` → `CommonMusic`）需要单独评审。

**建议**：作为独立 change `type-name-normalization`，排在常量与 hook 两阶段之后。本次只在规范表里确立"类型名禁模块下划线前缀"的规则，新建代码遵守，存量不动。

`artistDetail.is_error` 除外，它属 camel_snake 混写且仅 1 处，随本期顺手修正。

## Risks / Trade-offs

| 风险 | 缓解 |
|---|---|
| 31 处常量改名与三个在途变更（p1-enhancement / p2-longtail / modernize）文件重叠 | 排在它们归档后执行；或单独 commit 便于 rebase |
| `SessionManager` 是模块单例，单测间状态泄漏 | 暴露 `resetForTest()`，仅测试环境使用 |
| 游客态探测依赖 `account.anonimousUser` 字段，上游改结构会误判 | 字段缺失视为「无法判定」，不触发 `revoke` |
| 内存缓存与多标签页不同步 | 监听 `storage` 事件刷新 |
| 凭证在 localStorage，可被 XSS 读取 | 已知且接受；彻底解决需后端下发独立 token，超出本次范围 |
| 显式注入让 GET 请求 URL 变长（实测最大 903 字符） | 远低于浏览器 2KB 保守限制，可接受；若后续接长凭证需改投 header |

## Migration Plan

1. **阶段 1 — 凭证与请求层**（行为变更）：新增 `SessionManager`，改造 `publicReq`，退役 `hasLogin` 兼容分支，store 改为订阅。独立可回滚：回滚即恢复拦截器注入并保留 `localStorage` 键。
2. **阶段 2 — 常量命名统一**（纯机械）：31 处常量改 `camelCase`，`tsc --noEmit` + `vite build` 通过后提交。回滚为 revert 单个 commit。
3. **阶段 3 移交**：hook 状态直出 ref 的改造已拆为 `hook-state-normalization`，与本变更无依赖，可并行或先做。

三个阶段互不依赖，可交换顺序；阶段 1 优先，因为它是本次问题的实体修复。

**验证口径**：真实账号登录 → 刷新 → 关浏览器重开，三个阶段都保持头像与歌单；DevTools 中删除 `cloud-token` 后重开应仍能自愈；登出后 `localStorage['cloud-session']` 清空。
