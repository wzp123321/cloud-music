# 详细设计：queue-scroll-search-ux

## 0. 文档定位与边界

- 本文把 OpenSpec 行为契约（D1~D6 + 三个 spec delta）细化为可直接派活的实现级设计，**只细化、不推翻**。文中保留契约的 SHALL / MUST 原文；与 OpenSpec 不一致处写入 §5「待确认项」，不自行修改 OpenSpec 产物。
- 三个模块（队列重排 / 滚动恢复 / 搜索历史）**逻辑上无相互依赖，可完全并行**，对应 tasks 组 A / B / C；集成验收（组 4）依赖三者完成。唯一的文件级交叉点见 §4「隐含依赖」。
- **本轮不碰归档**：tasks 第 5 组（`login-session-hardening`、`hook-state-normalization`、`cloud-music-p1-enhancement`、`cloud-music-p2-longtail`、`cloud-music-modernize`）属流程维护，依 D6 与功能实现解耦、执行前需单独向用户确认。本文不覆盖、不移动任何 OpenSpec 变更目录。
- 项目约定（README「开发约定」）：状态一律 `ref` 直出（禁用 `reactive(...)` 再解构）；颜色走 `--color-*`、圆角 `--radius-*`、阴影 `--shadow-*`、字号 `--font-size-*` 语义变量；新增 `cm-*` 全局组件需注册到 `components/register.ts`——**本轮不新增全局组件**（仅在既有 `cm-playlist-table` 内加 drag 事件）；工具类 `reset.less` 间距/字号上限 64，不扩大 `range()`。

---

## 1. 模块一：播放队列拖拽重排

### 1.1 对应 OpenSpec requirement
- `playback-queue-reorder` → Requirement「队列拖拽重排」：系统 SHALL 允许用户拖拽改序，结果 MUST 跨刷新保持；Scenario「拖拽改变顺序」「当前播放项被重排」。
- `playback-queue-reorder` → Requirement「重排后的播放推进」：系统 SHALL 按新顺序决定上/下一首；Scenario「重排后切下一首」「随机模式不受影响」。
- 落地 D1（原生 drag，不加依赖）、D2（索引跟随歌曲 id）、D3（随机分支不动）。

### 1.2 改动点（文件 → 方法）

| 文件 | 位置 | 改动 |
|---|---|---|
| `src/store/playlist.ts` | `defineStore`(:18) 内、`musicList`(:23) 之后 | **新增** `reorderMusic(from, to)` action，并入 `:120` 的 return 暴露 |
| `src/components/cm-playlist-table/cm-playlist-table.vue` | 模板行 `<tr>`(:13)、`defineEmits`(:34-37) | 行加 `draggable` 与原生 drag 事件；emits 新增 `reorder: [from: number, to: number]` |
| `src/views/home/components/play-list/play-list.vue` | 模板 `<cm-playlist-table>`(:19-24)、`handlePlay`(:45) | 绑定 `@reorder`，转调 `playList.reorderMusic` |
| `src/store/player.ts` | — | **不改**（`currentIndex`(:28)、`currentMusic`(:49)、`switchMusic`(:204)、`onEnded` 随机分支(:179-183) 保持原样，由 index 重算自然生效） |

### 1.3 数据结构与核心算法

- 数据：`musicList: ref<PL_PlayVO[]>`（:23）保持不变；不新增字段、不新增持久化 key。顺序随既有 `persist`（`pick: ['musicList']`，:123-126）自动落盘——满足「跨刷新保持」MUST。
- `reorderMusic(from, to)` 步骤（D2）：
  1. 边界校验：`from`/`to` 为合法且不同的索引、`musicList.value.length > 1`，否则直接 return（详见 1.4）。
  2. **惰性**取播放态：在 action 函数体内调用 `const player = usePlayerStore()`（**不在模块顶层 import**，规避 `player.ts:9` 顶层 import `playlist.ts` 造成的循环依赖，见 §4）；读取 `const playingId = player.currentMusic.value.id`（currentMusic 由 player 提供，符合 D2）。
  3. 原地移动引用：`const [moved] = musicList.value.splice(from, 1); musicList.value.splice(to, 0, moved);`——**保持 item 对象引用不变**（currentMusic computed 依赖 `musicList[currentIndex]`，引用稳定才有 `:src` 稳定）。
  4. 重算索引：`const next = musicList.value.findIndex((i) => i.id === playingId); player.currentIndex = next >= 0 ? next : Math.min(player.currentIndex, musicList.value.length - 1);`（playingId 不在队列时回退，避免 -1）。
  5. 不调用 `queryMusicUrl`、不清空 url、不改 `isPlaying`/`playTimestamp`——重排不改播放状态、不重新拉音源（D2）。
- 正确性论证：重排后 `currentIndex` 指向同一 `playingId` 的同一 item 对象 → `currentMusic` computed 重求值结果对象不变 → `<audio :src>` 绑定值不变 → 播放不中断；`switchMusic`(:204) 基于新 index ±1 取模 → 自动按新顺序切歌；`onEnded` 的 RANDOM 分支(:180) 不依赖顺序 → 随机行为不变（D3）。

### 1.4 边界条件
- `from === to` / 越界 / 队列长度 ≤ 1：no-op，不发 emit、不写盘。
- 拖拽中 `@click="emit('play', item)"`(:13) 可能被误触发：组件内用 `isDragging` ref + `dragend` 后置标志抑制紧随的 click（一次宏任务或 `dragend` 后清除），避免拖完即切歌。
- 被拖歌曲正是当前播放曲：playingId 命中移动后的新位置，currentIndex 随之前移/后移，曲目与进度不变（Scenario「当前播放项被重排」）。
- persist 序列化(:130) 会清空写盘的 url，但**内存 item 的 url 与对象引用不变**，`startPlayback` 仅在缺 url 时才补拉——重排不会触发补拉。集成验收需确认此点。
- 并发：重排与 `setQueue`(:61)/`removeMusic`(:94) 同时发生属边界，重排内以当前 `musicList.value` 快照为准；Pinia action 同步执行，无竞态（不引入 async）。

### 1.5 验证方式
- 单元/手测：播放中拖动一行到新位置 → 当前歌曲 id 与进度不变、currentIndex 指向新位置；`localStorage['cloud-music-list']` 顺序与新顺序一致；刷新后顺序保持。
- 推进：重排后点「下一首/上一首」→ 播放新顺序相邻曲；随机模式下重排 → 选曲仍走 `Math.random`，展示顺序变化但逻辑不变。
- 冒烟（tasks 1.4）：播放中点歌 → 拖拽 → 切歌 → 刷新，队列顺序与当前曲目一致。
- 构建：`npm run build` / `npm run lint` 全绿（组 4.1）。

---

## 2. 模块二：路由滚动恢复

### 2.1 对应 OpenSpec requirement
- `navigation-scroll-restore` → Requirement「返回列表恢复滚动位置」SHALL；Scenario「歌单列表往返」「搜索结果往返」。
- `navigation-scroll-restore` → Requirement「新导航回到顶部」SHALL；Scenario「切换到新页面」「同一页不同参数」。
- 落地 D4（按路由身份记忆、sessionStorage、异步二次校正）。

### 2.2 改动点（文件 → 方法）

| 文件 | 位置 | 改动 |
|---|---|---|
| `src/router/index.ts` | `createRouter`(:20-23) | 增加 `scrollBehavior(to, from, savedPosition)`；增加位置记录钩子（推荐 `router.beforeEach` 记录 from 位置，或按 D4 在各列表页 `onBeforeUnmount` 记录） |
| `src/router/modules/playlist.ts` | `playlist_detail`(:5-11)、`playlist`(:12-18)、`我的收藏`(:19-25) | 需记忆的列表页 `meta` 加 `keepScroll: true` 及关键参数声明 |
| `src/router/modules/search.ts` | `search`(:4-12) | 同上，`meta.keepScroll: true` |
| 各列表页组件（歌单详情、搜索结果等） | 数据就绪处 | 异步渲染后触发一次二次位置恢复（D4 / tasks 2.3）；具体文件清单外，见 §5 |

> `router/index.ts:12-18` 的 `import.meta.glob` 自动注册机制不改；新增 meta 字段不影响注册顺序。

### 2.3 数据结构与核心算法

- 存储：`sessionStorage`，键前缀 `cloud-scroll:`，值 `scrollTop: number`。选 sessionStorage 而非内存：刷新后返回仍可恢复、关闭标签即清除、不跨会话残留（D4）。
- 路由身份 key：`key = meta.name + '|' + <关键参数序列化>`。关键参数取路由 query/params 中能唯一标识该列表内容的字段（如歌单 id、搜索 keyword）；换参数即换 key → 不命中 → 回顶（Scenario「同一页不同参数」）。
  - **注意**：现有路由只有 `meta.name`（playlist.ts:8/15/22、search.ts:8），**没有 Vue Router 顶层 `name`**。D4 的「route.name」须落地为 `route.meta.name`（或补顶层 name），见 §5 待确认 A1。
  - 推荐把参与 key 的字段名收敛为 `meta.scrollParams: string[]`，由 `scrollBehavior` 统一从 `to.query`/`to.params` 抽取，避免逐页硬编码。
- 记录时机（离开前记录 from 位置）：
  - 推荐：`router.beforeEach((to, from) => { if (from.meta.keepScroll) sessionStorage.setItem(keyOf(from), String(currentScrollTop())); })`——此时旧页 DOM 仍在，读取可靠。
  - D4 备选：组件 `onBeforeUnmount` 内记录该页滚动容器 scrollTop。若采用 afterEach 需警惕：导航完成后旧页已卸载、读到的是新页位置（不推荐）。见 §5 待确认 A2。
- 恢复（`scrollBehavior`）：
  1. `if (!to.meta.keepScroll)` → 返回 `{ top: 0 }`（新导航回顶）。
  2. 判定是否为「返回导航」：优先用 `savedPosition`（浏览器历史返回时 Vue Router 提供）；刷新后 `savedPosition` 缺失时，用 sessionStorage 中 `keyOf(to)` 是否存在作为返回佐证（见 §5 待确认 A3 的可靠判定）。
  3. 命中 → 返回 `{ top: Number(sessionStorage.getItem(keyOf(to))) || 0, left: 0 }`；否则 `{ top: 0 }`。
  4. 读完是否立即删除该 key：保留更利于连续往返，采用「覆盖式」（每次离开重写）；见 §5 待确认 A4。
- 异步二次校正（D4/tasks 2.3）：列表数据异步到达时，首次 scrollBehavior 可能因列表为空、高度不足而恢复失败。页面在数据 resolved / 列表长度由 0 变正后，`nextTick` 再读 `keyOf(route)` 的 scrollTop 设到滚动容器一次。封装为轻量 composable（本轮不新增全局组件；composable 放 `src/composables/`，不算 cm-* 组件注册范畴）。

### 2.4 边界条件
- 新导航到「曾访问过的同 key 页」应是新会话视角回顶，不能因 key 残留误恢复——依赖「返回导航」判定（A3），不能只看 key 命中。
- 同路由换参数（搜索换词、歌单 tab 切换）：key 变化 → 不命中旧 key → 回顶（Scenario 明确要求）。
- 滚动容器是 window 还是内部 `el-scrollbar`：决定 scrollBehavior 返回值能否直接生效及记录时读谁；清单外，见 §5 待确认 A5。
- sessionStorage 读到非法值（NaN/负数）：`|| 0` 兜底回顶；写入前 clamp ≥ 0。
- 详情页不标记 keepScroll：从列表进详情走 `{ top: 0 }`，详情自身不需要记忆。

### 2.5 验证方式
- 手测（tasks 2.4）：歌单详情滚动到中部 → 点进歌曲详情 → 返回 → 位置恢复；搜索结果往返同样恢复；换 tab / 换关键词 → 从顶部开始；从底部导航切到新列表页 → 顶部。
- 刷新后返回：刷新列表页 → 进详情 → 后退 → 仍恢复（验证 sessionStorage 持久化，区别于纯内存）。
- 异步列表：在曲目尚未渲染完即返回的场景，确认二次校正生效（断言前等列表行数 > 0，避免 KP-04 误判）。
- 构建：`npm run build` / `npm run lint` 全绿。

---

## 3. 模块三：搜索历史

### 3.1 对应 OpenSpec requirement
- `search-history` → Requirement「搜索历史记录」SHALL：主动搜索时记录、去重、最近置顶、上限 20、超出丢最旧；Scenario「记录一次搜索」「空白不记录」「达到上限」。
- `search-history` → Requirement「搜索历史展示与使用」SHALL；Scenario「点击历史词」「未登录可用」。
- `search-history` → Requirement「搜索历史管理」SHALL；Scenario「删除单条」「清空全部」。
- 落地 D5（独立本地存储、localStorage、与 setting 风格一致但独立）。

### 3.2 改动点（文件 → 方法）

| 文件 | 位置 | 改动 |
|---|---|---|
| `src/utils/searchHistory.ts` | 新建 | 导出 `getHistory / addHistory / removeHistory / clearHistory`（纯函数，操作 localStorage key `cloud-search-history`） |
| `src/views/search/hooks/useSearch.ts` | `query()`(:66-172)、`keyword`(:46) | 提交搜索处调用 `addHistory`；空白/纯空格不记录 |
| `src/views/header/hooks/useHeader.ts` | `create()`(:41)、`keyword`(:43)、返回对象(:137-152) | 新增 `historyList` ref；聚焦时 `getHistory()` 刷新；新增点击回填/删除单条/清空方法 |
| 头部 / 搜索页视图组件 | 历史面板模板 | 展示历史词、点击回填并跳转、删除按钮、清空入口；具体文件清单外，见 §5 |

### 3.3 数据结构与核心算法

- `searchHistory.ts`（参照 setting.ts:33/103-105 的存储风格，但**用 localStorage、独立 key**，满足「清空后刷新仍为空」）：
  - 键：`cloud-search-history`；值：`string[]`（最多 20 条，最近置顶，去重）。
  - `getHistory(): string[]`：`JSON.parse(localStorage.getItem(KEY))` → 仅当 `Array.isArray` 且元素为 string 才返回，`null`/非法/非数组 → `[]`（容错）。
  - `addHistory(keyword)`：`const kw = (keyword ?? '').trim(); if (!kw) return;` → 取 `getHistory()` → `filter(x => x !== kw)` → `unshift(kw)` → `slice(0, 20)` → 写回。满足去重、置顶、上限、空白不记录。
  - `removeHistory(keyword)`：`filter(x => x !== keyword)` → 写回，其余顺序不变（Scenario「删除单条」）。
  - `clearHistory()`：写入 `[]`（或 `removeItem`；两者刷新后均为空，选 `removeItem` 更干净，需与 getHistory 兜底一致）。
  - 写入用 try/catch 包裹（localStorage 不可用/隐私模式静默降级，不抛错、不弹登录）。
- `useSearch.ts`：在 `query()` 里 **request 前快照之后**（:68-72 之后）调用 `addHistory(requestKeyword)`；`requestKeyword` 已由 :69 取得、`:79-92` 等分支共享，保证「一次提交记一次」。天然满足「空白不记录」（addHistory 内 trim 判断）。
  - 注意 `handleTypeChange`(:199-201) 切 tab 也走 `query()` 会重复 addHistory（同词置顶）；去重+置顶使其幂等，但切 tab 是否算「主动搜索」见 §5 待确认 B2。
- `useHeader.ts`：
  - 新增 `const historyList = ref<string[]>([])`（ref 直出）；聚焦搜索框（现有 `searchFocus`/`loadHot` 时机，:47/73）时 `historyList.value = getHistory()`。
  - 点击历史词：回填 `keyword.value = word` 并立即跳转 `/search?keyword=<word>`（跳转用 `useRouter()`，提交逻辑须与头部既有「回车搜索」路径一致——清单外，见 §5 待确认 B1）。
  - 删除单条：`removeHistory(word)` 后 `historyList.value = getHistory()` 即时刷新。
  - 清空：确认弹窗（项目既有 `window.confirm` 用法见 player.ts:408，或复用现有 message 确认组件；选型见 §5 待确认 B3）确认后 `clearHistory()` + 刷新 ref。
  - 全程不接 `withSession`、不读登录态、不触发任何接口（Scenario「未登录可用」）。

### 3.4 边界条件
- 空白/纯空格：不记录、不改历史（addHistory trim 兜底）。
- 历史已达 20：`unshift` 后 `slice(0,20)` 丢弃最旧。
- 重复词：`filter` 去重后置顶，仅保留一条。
- localStorage 被清空/非数组/损坏：`getHistory` 返回 `[]`，面板展示空态，不报错。
- 点击历史词与「立即搜索」：回填后必须真实触发跳转+搜索（不是只填框），与 Scenario「立即跳转到对应搜索结果」一致。
- 切 tab（`handleTypeChange`）重复记录：幂等置顶；若判定为非主动搜索，则改用「仅提交入口调 addHistory」的收敛方案（B2）。

### 3.5 验证方式
- 手测（tasks 3.5）：搜索 → 历史出现且置顶 → 重复词只留一条 → 搜到第 21 条时最旧被移除 → 点击历史词回填并跳转 → 删除单条仅移除该词 → 确认清空后列表空 → 刷新仍空。
- 未登录态：清登录态后历史展示、点击、清空均正常，无登录提示、无接口调用。
- 空白：提交空格，历史不变。
- 构建：`npm run build` / `npm run lint` 全绿。

---

## 4. 隐含依赖与风险（三模块间 + 模块内）

**模块间**：三模块逻辑无相互依赖，可并行（组 A/B/C）。潜在交叉点：
- 模块二与模块三都触及**搜索页**：模块二改搜索页路由 meta + 异步二次恢复（页面/路由层），模块三在 `useSearch` hook 记录历史（hook 层）。若二次恢复逻辑也改到 `useSearch.ts` 或同一视图文件，可能与模块三产生合并冲突——建议模块二的恢复逻辑独立成 composable/路由层，不写入 `useSearch.ts`。这是唯一需协调的文件级交叉点。

**模块内风险**：
- **R1（循环依赖）**：`player.ts:9` 顶层 import `playlist.ts`；`playlist.reorderMusic` 需读写 `player.currentIndex`。推荐在 action 体内惰性 `usePlayerStore()`（非顶层 import）规避；集成审计须验证 store 初始化顺序与 `currentIndex` 写回生效。
- **R2（引用稳定）**：重排必须用 splice 移动原对象引用；若改成 map 重建对象，`currentMusic` 指向新对象可能触发 `<audio :src>` 变化打断播放。验收重点。
- **R3（关键参数靠猜）**：滚动 key 的 query/params 字段名必须从真实路由/URL 确认，不得推定——否则重演 KP-02「静态过、运行时恒空」。
- **R4（返回判定）**：刷新后浏览器后退的可靠判定（savedPosition 缺失场景）是滚动恢复正确性的核心，须实测。

---

## 5. 待确认项（不改 OpenSpec，回报给 team-lead）

- **A1**：D4 写「route.name」，但实际路由（playlist.ts:8/15/22、search.ts:8）**只有 `meta.name`、无顶层 `name`**。确认 key 取 `meta.name`，还是给路由补顶层 `name`？（推荐前者，零改动风险）
- **A2**：D4 的「离开记录」在 afterEach / onBeforeUnmount 二选一。afterEach 时旧页 DOM 已切换、读取不可靠；是否同意改用 `router.beforeEach` 记录 from 位置？
- **A3**：「返回导航」的可靠判定口径：仅 `savedPosition`、还是叠加 sessionStorage 命中 + `history.state` 的 back/current 标记？刷新后后退场景须确认。
- **A4**：滚动位置 key 读完是否删除（一次性恢复）还是覆盖式保留（连续往返）？建议覆盖式。
- **A5**：列表页滚动容器是 `window` 还是内部 `el-scrollbar`/div？决定 scrollBehavior 能否直接生效及记录来源。清单外，需给具体文件锚点。
- **A6**（A5 延伸）：需标记 `keepScroll` 并做异步二次恢复的**具体页面文件**（歌单详情、搜索结果等）及关键参数字段清单——清单外，未漫游，请提供锚点或授权读取。
- **B1**：头部「点击历史词立即搜索」的跳转/提交实现在哪个组件（清单外）？需与既有回车搜索路径一致，请给锚点。
- **B2**：`useSearch.query()` 被切 tab（:199-201）复用，切 tab 是否算「主动搜索」需记录？决定 addHistory 放 query() 内还是收敛到提交入口。
- **B3**：清空历史的「确认弹窗」用 `window.confirm`（player.ts:408 现有用法）还是既有 message 确认组件？请指定。
- **C1**：`searchHistory.ts` 的导出函数名 `getHistory/addHistory/removeHistory/clearHistory` 为本文拟定，派活契约需定死（KP-01），请确认或修订。

> 以上待确认项**不阻塞**三模块各自独立开工：A 组按 §1 实现、C 组按 §3 的 `searchHistory.ts` + `useSearch` 记录部分可实现；A1~A6 仅在模块二落地前需答复，B1~B3 在模块三头部视图接入前需答复。

---

## 6. known-patterns（KP-01~05）本轮复现声明

| 编号 | 本轮是否可能复现 | 说明与规避 |
|---|---|---|
| KP-01 契约伪代码导出名 | **可能（C1）** | 新增 `searchHistory.ts` 导出名未核对既有代码，派活须带精确导出名+行号；store/组件改动已有锚点（usePlaylistStore/usePlayerStore/useHeader/useSearch），集成审计核对 import 与调用名 |
| KP-02 字段别名靠猜 | **可能（模块二 R3）** | 滚动 key 的 query/params 字段名不得推定，必须从真实路由/URL 取样本；搜索历史为纯本地数据、不涉及上游字段，不复现 |
| KP-03 主题选择器 | 基本不复现 | 本轮不碰 `data-theme`/`dark`、颜色全走语义变量；若验收搜索历史面板，注意 `v-show` 隐藏元素取色误判（先让面板可见再取色） |
| KP-04 视觉验收时序 | **可能（模块二/三）** | 滚动二次校正与历史面板均依赖异步渲染；断言前等列表行数 > 0，空态结论须二次确认 |
| KP-05 组件样式透传 | 基本不复现 | 本轮不新增全局 cm-* 组件、不改 cm-image；drag 视觉样式直接写在 cm-playlist-table 的 scoped 内，不用 `:deep` |

---

## 7. 与 OpenSpec 契约对应总表

| 契约 | 本文落点 | 任务组 |
|---|---|---|
| D1 原生 drag 不加依赖 | §1.2 / §1.3 | 组 1（A） |
| D2 索引跟随歌曲 id 重算 | §1.3 步骤 2-5 / R1 / R2 | 组 1（A） |
| D3 随机模式不动 | §1.3 正确性论证 | 组 1（A） |
| D4 按路由身份记忆 + sessionStorage + 异步校正 | §2.3 / §2.4 / A1~A6 | 组 2（B） |
| D5 独立本地历史 | §3.3 / §3.4 / B1~B3 / C1 | 组 3（C） |
| D6 归档独立不可逆 | §0（本轮不碰第 5 组） | 组 5（不在本轮） |
| Requirement「队列拖拽重排」「重排后的播放推进」 | §1.1 / §1.5 | 组 1 |
| Requirement「返回列表恢复滚动位置」「新导航回到顶部」 | §2.1 / §2.5 | 组 2 |
| Requirement「搜索历史记录」「展示与使用」「管理」 | §3.1 / §3.5 | 组 3 |
