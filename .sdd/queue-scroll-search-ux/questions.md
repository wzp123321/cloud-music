# questions（全程问题账本 · queue-scroll-search-ux）

接力模式：Stage 0 / Stage 1 由 OpenSpec explore + propose 完成，以下为已闭环结论。后续任何阶段新问先查本账，按 Qn 续写。

| 编号 | 问题 | 结论 | 来源 |
|---|---|---|---|
| Q1 | 本轮范围 | 三个交互断点（队列重排 / 滚动恢复 / 搜索历史）+ 流程债归档，一起纳入 | 用户「一起放进去做吧」 |
| Q2 | 参考模块 | 用已定位锚点，不另做全库检索：`store/playlist.ts`、`router/index.ts`、`views/search/hooks/useSearch.ts` | Stage 0 用户确认 |
| Q3 | 档位 | 重档：三模块并行 + 交叉评审 + 集成审计；接力模式保留设计评审门 | Stage 0 用户确认 |
| Q4 | 详设与 OpenSpec design 冲突 | 详设只读引用、只细化不推翻；冲突回 OpenSpec `update-change` | sdd-orchestrator 接力规则 |
| Q5 | 归档动作边界 | tasks 第 5 组执行前单独确认，不随实现自动跑；不回滚代码 | 本轮 proposal + 用户指令 |
| Q6 | 队列重排实现方式 | 原生 HTML5 drag，不引第三方依赖；按歌曲 id 重算 `player.currentIndex` 防跳歌 | OpenSpec design D1/D2 |
| Q7 | 滚动位置存储 | `sessionStorage`，按 `route.name + 关键参数` 分键；新导航/换参数回顶 | OpenSpec design D4 |
| Q8 | 搜索历史存储 | 独立 localStorage key `cloud-search-history`，上限 20、去重、最近置顶 | OpenSpec design D5 |
| Q9 | 详设 A1：滚动 key 取 name 还是 meta.name | 取 `meta.name`。代码事实：所有路由只有 `meta.name`、无顶层 `name`（`router/modules/playlist.ts:8/15/22`、`search.ts:8`）；补顶层 name 属范围外改动 | 编排者 Grep 定位 |
| Q10 | 详设 A2：记录时机 | 用 `router.beforeEach` 记录 from 位置；afterEach 读到的是新页 DOM，不可靠 | 编排者判定（详设推荐） |
| Q11 | 详设 A3/A4：返回判定与 key 保留 | 判定 = `savedPosition` 命中 + sessionStorage key 命中；key 覆盖式保留（连续往返）；刷新后后退按实测校正 | 编排者判定（详设 A3/A4 推荐） |
| Q12 | 详设 A5/A6：滚动容器与 keepScroll 页 | 容器是 `window`（`home.vue` 仅 `overflow-x: hidden`，无 `el-scrollbar`）；标记页 = `playlist_detail`（关键参数 id）+ `search`（keyword/type）；这两个 key 从真实路由 query 取，不猜 | 编排者 Grep 定位 |
| Q13 | 详设 B1：历史词点击跳转锚点 | 复用 `views/header/hooks/useHeaderView.ts:41 handleSearch`（`router.replace` 到 `/search`，query.keyword）；历史词填入 keyword 后调同一路径 | 编排者 Grep 定位 |
| Q14 | 详设 B3：清空确认弹窗 | 用 `ElMessageBox.confirm`（`useHeaderView.ts:97` 既有用法），不用 `window.confirm` | 编排者判定 |
| Q15 | 详设 C1：`searchHistory.ts` 导出名 | 定死 `getHistory` / `addHistory` / `removeHistory` / `clearHistory`，派活契约按此写（防 KP-01） | 编排者判定 |
| Q16 | 详设 B2：切 tab 是否记历史 | 不记录。只记用户主动提交关键词（符合 spec「主动执行搜索」）；tab 切换复用 `query()` 但不写历史 | 编排者默认决策，卡点②可否决 |
| Q17 | C 路待确认：搜索页 query() 在 onMounted/路由 watch 也调用，是否记历史 | 不记。只有用户主动提交（头部回车/点击历史词/搜索页提交）记；`search.vue:110/136/143` 的 query() 是被动渲染与参数响应，不写历史。C 路已按 Q16 实现，与 Q17 一致 | 编排者 Grep 定位 |
| Q18 | C 路待确认：历史删除按钮用 `×` 还是 cm-icon | 用 `×` 文本。清单内未授权新增图标引用，最小改动；`icon-Close` 虽存在但仅为登录框局部用法，不扩张 | 编排者判定（按最小改动） |
| Q19 | A 路待确认：`player.currentMusic` 是 computed ref，Pinia 自动解包后 `player.currentMusic.id` 正确；但实现用 `getActivePinia()._s.get('player')` 私有字段而非惰性 `usePlayerStore()` | 交卡点③ reviewer 核实：私有 `_s` 是否可用、是否违反详设 §1.3 惰性调用要求；若违反则返工为 `usePlayerStore()`（循环依赖由函数体内调用规避） | 编排者抽查门 Grep |
| Q20 | B 路待确认：搜索页 `.search{overflow:hidden}`（:180）是否使滚动容器非 window；`type` 是组件内 ref（useSearch.ts:49）、非 query 字段 | 交卡点③ reviewer 核实：滚动容器实际是谁；`type` 不应作为滚动 key 的 query 字段（KP-02），若实现里按 query.type 取则需修正 | 编排者抽查门 Grep |
| Q21 | 卡点③返工口径：Q19/Q20/Q17 三处 | A：改回函数体内 `usePlayerStore()`，禁私有 `_s`（详设 §1.3）。B：滚动 key 去掉 type（非 query 字段，KP-02）；滚动源实测后再定，先按 window.scrollY 保留并在评审记录风险。C：`addHistory` 从 `useSearch.query()` 移到 `useHeaderView.handleSearch` 主动提交入口；历史词点击复用 handleSearch 会记一条，属用户主动行为可接受；首屏/换词/tab 的被动 query() 不记 | 编排者据卡点③结论定夺 |
| Q22 | 手测实证：滚动容器 | 浏览器实测 `scrollHeight=clientHeight=900`（window 无滚动），真实容器是 `div.home`（`scrollHeight=5679, clientHeight=900, overflowY:auto`）。B 路按 `window.scrollY` 记录全程读写 0，功能未生效。改为读/写 `.home` 的 `scrollTop`；`scrollBehavior` 返回 `{top}` 对内部容器无效，恢复须由容器侧 `scrollTo` 完成 | 浏览器手测 diag-scroll.js |
| Q23 | 手测二轮实证：B 路恢复时序 | sessionStorage 写入正确（1500），返回时读取到 1500，但写入 `.home.scrollTop=1500` 时 DOM 未渲染（sh=900 ch=900 rows=0）→ actual=0；数据渲染后（rows=20 sh=5816）无再次校正。搜索页 451→494 偏差。修复方向：恢复动作必须在容器可滚后执行（监听 scrollHeight 变化 / 内容行数 >0 后再写），不能只在 nextTick 写一次 | verifier-b2 diag-b2c.log |
| Q24 | 卡点④前变更清单 | 11 改 + 3 新增目录/文件：A 组 3 文件（playlist.ts / cm-playlist-table / play-list.vue）；B 组 5 文件（router/index.ts + 2 modules + playlist-detail.vue + search.vue）；C 组 1 新 + 3 改（searchHistory.ts / useHeader.ts / useHeaderView.ts / header.vue）；产物 2 目录（openspec change / .sdd change）。净 +496/-14。build/lint/validate 全绿，浏览器三路全通过 | 编排者汇总 |
| Q25 | 后续优化：热搜/建议词点击不记历史 | `onSelectKeyword`（useHeaderView.ts:66）走独立 router.replace，不记历史。spec 字面只要求"用户输入并提交"，不在本轮范围；最小改动原则不改，留后续 | C 路返工回报 + 编排者判定 |
