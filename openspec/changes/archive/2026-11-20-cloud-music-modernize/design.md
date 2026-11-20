# Design

## Context

现状（详见 explore 阶段实测）：

- `src/store/index.ts` 为 `createStore({})`，全项目零 `useStore()` 调用 —— Vuex 实质空置。
- 真正的全局状态是三个模块级 class 单例，均用 `ref()` 实现：
  - `play-controller.service.ts` → `export default new Player()`：持有 `musicVO / _musicList / is_playing / typeIndex / index / is_mute / play_timestamp / lrcList / lrcPanel / volume / progress / dragging`，并直接持有 `musicRef`（`<audio>` DOM 元素）调用 `.play()/.pause()/.currentTime`。
  - `play-list.service.ts` → `PlayListService`：持有独立的 `_musicList`（队列）+ `addMusic/removeMusic/queryMusicUrl`，持久化到 `localStorage['cloud-music-list']`。
  - `services/user.service.ts` → `UserService`：登录/资料请求；token 走 `core/token.ts` 的 cookie，非响应式。
- **队列双源问题**：`Player._musicList` 与 `PlayListService._musicList` 是同一份列表的镜像，Player 通过 `getMusicList()` 从 localStorage 重读同步，属于设计缺陷，重写时须合并。
- RxJS 仅出现在 service 的 `BehaviorSubject` 与组件的 `Subject + takeUntil`，全项目唯一操作符是 `takeUntil`，无任何 `map/switchMap/merge/debounce` 等流式语义。
- 组件层：`components/` 已做四件套（`.vue+.html+.ts+.less`）物理拆分；`pages/` 与 `views/` 为单体 `.vue`（最高 844 行）且零 composables。

## Goals / Non-Goals

**Goals:**

- 依赖升级到 2026 主流版本，消除构建链路技术债。
- 用 Pinia 重建状态层：四个强类型 store，单一队列真相源，DevTools 可观测，播放列表持久化。
- 彻底移除 RxJS，降低心智负担与包体积。
- 引入 composables 复用逻辑，拆分超大页面，提升可维护性。

**Non-Goals:**

- 不改变任何用户可见功能、接口契约或视觉表现。
- 不重写后端 `cloud-music-server`（本次仅前端 `cloud-music-web`）。
- 不引入新功能（如新的播放模式、新的全局状态字段）。
- 不保留四件套（`.vue+.html+.ts+.less`）拆分形态——本次明确将其合并为单文件 SFC（见 D7）。

## Decisions

### D1. 状态层拆为四个 store，合并队列真相源

```
stores/
  playlist.ts   usePlaylistStore   队列唯一真相源
    state   musicList: PL_IPlayVO[]      (persist → localStorage 'cloud-music-list')
    actions addMusic(v) / removeMusic(id) / queryMusicUrl(id) / loadFromStorage()
  player.ts     usePlayerStore     播放状态 + 音频绑定（不持有队列）
    state   musicVO / currentIndex / isPlaying / playTypeIndex /
            playTimestamp / progress / dragging / errorList[] /
            audioEl: shallowRef<HTMLAudioElement|null>
    getters playTypes / currentMusic (= playlist.musicList[currentIndex])
    actions play(song) / switchMusic(prev|next) / switchPlayType /
            switchPlayStatus / switchIsMute / setVolume /
            onTimeUpdate(e) / seek(ms) / onEnded() / onError() /
            getSongLyric() / downloadMusic()
  lyric.ts      useLyricStore
    state   lrcList:{time,lyc}[] / lrcPanel:string[]
    getter  showLyc
    actions parse(raw) / reset()
  user.ts       useUserStore       来自 UserService + core/token 的 cookie
    state   token / profile / isLogin
    actions login / logout / fetchProfile
```

- **Rationale**：原 `Player` 把"播放引擎 + DOM 音频控制 + 队列"混在一个 class。按子域拆分后，`playlist` 独占队列（消除双源），`player` 只管播放状态与音频驱动，`lyric` 独立便于复用，`user` 收敛登录态。
- **Alternative 考虑**：单一 `usePlayerStore` 容纳全部 → 改动最小但违背本次"按子域拆细"诉求；故采用拆分。`volume` 曾考虑独立 store，因与播放强相关并入 `player` 避免过碎。

### D2. 音频 DOM 元素由 store 持有（shallowRef + bindAudio）

- `audioEl` 用 `shallowRef<HTMLAudioElement | null>`（避免深响应式包裹 DOM），PlayController 组件挂载 `<audio ref>` 后调用 `usePlayerStore().bindAudio(el)` 注入。
- 所有 `musicRef.value.play()/pause()/currentTime/volume` 调用改为 store action 内部 `audioEl.value?.play()` 等。
- **Rationale**：保持播放控制的单一真相源，状态变更可在 DevTools 追踪；组件只负责渲染与事件转发。
- **Alternative**：音频留在组件、store 仅存状态 → 改动小但控制逻辑分散，否决。

### D3. RxJS 全量移除

- service：`BehaviorSubject` → `ref`；`musicDetail$.next(v)` → 直接赋值 ref；service 本就混用 `ref`（如 `_lyric`），统一为 ref 即可。
- 组件：`Subject + takeUntil` 退订 → 因状态已迁入 Pinia 响应式 state，组件直接 `watch` 或 `storeToRefs` 读取，多数场景连订阅都不需要；确需订阅时用 `watch` + `onUnmounted` 兜底。
- 涉及 8 个 `.vue` + 6 个 service；`demo.vue` 删除。
- **Rationale**：唯一操作符 `takeUntil` 仅用于组件卸载退订，Vue 原生 `onUnmounted`/`watch` 完全覆盖，移除零语义损失、减包、降复杂度。

### D4. 依赖升级目标与顺序

- 目标版本：`vite 5.x` / `@vitejs/plugin-vue 5.x` / `vue 3.5.x` / `vue-router 4.4+` / `element-plus 2.9.x` / `typescript 5.x` / `vue-tsc 2.x` / `less 4.2+` / `unplugin-auto-import 0.18+` / `unplugin-vue-components 0.27+` / `axios 1.x`；移除 `vuex`+`rxjs`，新增 `pinia`+`pinia-plugin-persistedstate`。
- 执行顺序建议：**先依赖升级 + 去 RxJS（低风险、解耦旧栈）→ 再 Pinia 重写 → 最后页面拆分（工作量最大）**。每步独立可验证。
- **Rationale**：先解耦旧依赖可降低后续重构的编译噪音；页面拆分放最后，因它依赖前两步打好的状态/hooks 基础。

### D5. 持久化与兼容

- `pinia-plugin-persistedstate` 接管 `usePlaylistStore.musicList`，key 沿用 `cloud-music-list`；`currentIndex` 随 player 持久化到 `cloud-play-index`，保证老用户数据不丢。
- `formatDuration` 移入 `core/utils`；`PLAY_TYPE` / `playTypes` 降为模块级常量（非响应式状态）。

### D6. 页面级 service 全量改写为 composables（hooks）

- 全部页面级 `*.service.ts`（class 式状态层，如 `music-detail.service.ts`、`search.service.ts`、`user.service.ts`、`mvplay.service.ts`、`playlist-detail.service.ts` 等约 28 个）改写为 `use*` composables：原 class 的私有 `ref` 字段 + getter 转为 `setup` 内声明的 `ref`/`computed`，方法转为 `const` 箭头函数返回。
- 调用方由 `new XxxService()` 改为 `setup` 内 `useXxx()`；因原 service 即 per-instance 使用，行为一致。
- 纯 API 定义文件（`*.api.ts`）与无状态的工具模块（`common.service.ts`、`file-download-upload.service/*` 等）**保留为普通模块**，不强行 hook 化。
- 跨切面的三个全局单例（Player / PlayList / User）已在 D1 归为 Pinia store，**不走 hooks**，避免多实例各自持状态。
- **Rationale**：hooks 与组件生命周期对齐、复用性与可读性强于 class 单例；与 D3 去 RxJS、`watch` 读取自然衔接。
- **Alternative**：保留 class service 仅去掉 RxJS → 改动最小但不符合"全 hooks"诉求，否决。

### D7. 四件套组件合并为单文件 SFC

- 现有 `components/*/` 下 `.vue + .html + .ts + .less` 四件套，合并为单一 `<name>.vue`，内联：
  - `<template> ... </template>`
  - `<script setup lang="ts"> ... </script>`
  - `<style lang="less" scoped> ... </style>`
- 原 `.html` 模板内容搬入 `<template>`，`.ts` 的 `defineComponent({ setup })` 改为 `<script setup>`，`.less` 搬入 `<style scoped>`；原 `register.ts` 的全局注册改为 `components` 目录统一 `index.ts` 导出或按需 import。
- 拆分出的展示型子组件（见原"组件拆分"目标）同样以单文件 `.vue` 产出。
- **Rationale**：单文件 SFC 是 Vue3 主流形态，配合 `<script setup>` 与 Vite 5 体验最佳，减少文件跳转。
- **Alternative**：保留四件套 → 与用户指令冲突，否决。

### D8. 统一代码风格：const 函数 + 注释

- 所有函数（hooks、工具函数、store action 内的辅助函数）以 `const fn = (...) => {...}` 箭头声明；不再使用 `function fn() {}` 或 class 方法（store 用 setup-store 写法，action 即 `const` 函数）。
- 关键逻辑（播放模式切换、歌词解析、进度计算、持久化）补齐中文注释；保留原 `@Description/@Author` 头部精神，但改为行内注释，避免多余样板。
- **Rationale**：箭头函数 + 词法 `this` 在 hooks/store 中更安全、风格统一，便于 review。

### D9. 工程化地基：补 ESLint + tsconfig 严格度

- 现状全项目仅有 `.prettierrc`，**无 ESLint 配置、devDependencies 也未安装**；代码质量门实质上真空，仅 `vue-tsc` 做类型检查。
- 引入 ESLint 9 flat config（`eslint.config.js`）：`@eslint/js` + `typescript-eslint`（`parser`/`eslint-plugin`）+ `eslint-plugin-vue` 的 `vue3-recommended`，并以 `eslint-config-prettier` 关闭所有风格规则，避免与 Prettier 冲突。
- `package.json` scripts 加 `"lint": "eslint . --ext .vue,.js,.ts"`、`"lint:fix": "eslint . --fix"`。
- `tsconfig.json` 在已有 `strict: true` 基础上补：`noUnusedLocals` / `noUnusedParameters` / `noImplicitReturns` / `noFallthroughCasesInSwitch`。
- **Rationale**：升级与重构（去 RxJS、合并 SFC）过程中会产出大量未用变量/潜在 bug，统一质量门可一次性收敛；配合 D8 的 const/注释风格形成完整代码规范。
- **Alternative**：仅开 tsconfig 严格度、不引 ESLint → 成本更低但抓不到风格/逻辑类问题，且长期缺门禁，否决。

### D10. 请求层统一（为 `services/request.ts` 增加拦截器）

- 实测澄清：真正的请求底层仅 `src/services/request.ts` **一份** axios 封装；`src/config/request.ts` 是网关配置对象（BASE_URL/TIME_OUT，被 request.ts import，**不可删**）；`pages/portal/services/portal-request.service.ts` 是**业务 service**（调用 request.ts 的 `postRequest`/`getRequest`），归 D6 改造为 hooks，**不删**。故不存在"多份封装合并"，而是"为唯一请求源补齐拦截器"。
- 目标：为 `src/services/request.ts` 增加 axios 拦截器——请求拦截注入 cookie token（复用 `core/token` 的 `FGetCookie`），响应拦截做错误归一（统一错误对象/提示）；`config/request.ts` 与业务 service 保持不变。
- 原 `*.service.ts` 改写为 hooks（D6）后，统一引用该实例；上层 `useRequest` composable（D6 的 hooks 之一）负责 loading/error 状态封装。
- **Rationale**：去 RxJS 后异步层理应统一，单一请求源 + 拦截器避免 token 注入遗漏、错误处理碎片化。
- **Alternative**：保留无拦截器的裸 `axios.create` → token 注入与错误处理散落各处，否决。

### D11. 构建与产物优化（vite.config 审计）

- Vite 2→5 须重审 `vite.config.ts` 的 `server` / `build` / `css` / `optimizeDeps` 选项；已废弃 API 需替换。
- 在 `build.rollupOptions.output` 加 `manualChunks` 做 vendor 分包（vue / vue-router / element-plus / pinia 各自成块），减小首包、利用长缓存。
- `build.minify: 'terser'` + `terserOptions.compress.drop_console`（保留 `console.warn/error` 便于线上排查）；`build.sourcemap` 按环境变量控制；调高 `chunkSizeWarningLimit`。
- `css.preprocessorOptions.less` 显式设 `javascriptEnabled: true`（Element Plus 主题定制与 less 4 兼容所需）。
- **Rationale**：升级是顺手做产物治理的最佳窗口；分包与去 console 直接改善加载性能与产物整洁度。
- **Alternative**：仅升级不优化 config → 能跑但错过治理窗口、首包偏大，否决。

## Risks / Trade-offs

- **[Vite 5 大版本跳跃]** → 需审 `vite.config` 的 `server`/`build` 选项与已废弃 API；升级后跑 `npm run build`（含 `vue-tsc --noEmit`）全量类型检查兜底。
- **[页面拆分回归面大]** → 仅做结构拆分、不改行为；拆分后逐页人工回归播放/歌词/进度等交互。
- **[RxJS 退订遗漏]** → 用 `watch` 替换时确认依赖 `flush` 时机与原 `takeUntil` 一致；组件卸载由 `onUnmounted` 保证。
- **[音频 shallowRef 误用]** → 严禁将 `audioEl` 放入 `ref`（深响应会代理 DOM），统一 `shallowRef` + `bindAudio`。
- **[localStorage key 变更致数据丢失]** → 严格沿用旧 key，persistedstate 配置显式指定 key 名。
- **[四件套合并丢内容]** → 合并时逐组件核对 `.html`(模板) / `.ts`(逻辑) / `.less`(样式) 三段完整搬入单 `.vue`；合并后 `npm run build` 验证无遗漏 import。
- **[service→hook 多实例状态]** → 跨页面共享数据（播放队列/用户态）已在 D1 归 Pinia，页面级 hook 仅持有本页状态，避免误把单例状态塞进 hook 导致多实例不一致。
- **[const 箭头函数 this 丢失]** → 已无 class 方法，hooks/store 全用 `const` 箭头 + 词法作用域，无需 `this` 绑定；若有回调内引用，统一用闭包捕获。
- **[ESLint 首跑风格冲突/批量误报]** → 用 `eslint-config-prettier` 关掉所有风格规则，仅留质量规则；首跑报错按文件分批 `lint:fix` + 人工复核，不与 D8 注释规范冲突。
- **[双 request.ts 合并功能遗漏]** → 合并前 `diff` 两份及 portal 专用封装，保留功能并集；统一后跑 `npm run build` + 本地预览验证登录/请求链路。
- **[Vite 分包致首屏变慢或资源 404]** → `manualChunks` 仅做 vendor 分包、不拆业务模块；`build` 后本地 `preview` 验证首屏与路由跳转资源加载。

## Migration Plan

1. 升级 `package.json` 依赖并执行 `npm install`；新增 ESLint 9 flat config + `eslint-config-prettier`、`package.json` 加 `lint`/`lint:fix` scripts、补 `tsconfig` 严格度（D9）；合并双 `request.ts` 为单一 `src/services/request.ts`（D10）；审计并优化 `vite.config`（vendor 分包 / terser 去 console / less 预处理选项，D11）；修 `vue-tsc` 报错。
2. 移除 `rxjs`：替换 6 个 service 的 `BehaviorSubject` 与 8 个组件的 `Subject+takeUntil`；删 `demo.vue`。
3. 引入 Pinia：建 `stores/` 四文件 + `main.ts` 挂载；迁移 Player/PlayListService/UserService 字段与方法；合并队列双源；配置 persistedstate。
4. 页面级 `*.service.ts` 改写为 `use*` composables（D6）；纯 `*.api.ts`/工具模块保留；调用方 `new Xxx()` → `useXxx()`。
5. 四件套组件合并为单文件 SFC（D7）；原 `register.ts` 改为统一导出。
6. 抽 composables（`useRequest`/`usePagination`/`usePlayer`/`useAuth`/`useLyric`）。
7. 拆分 `user-supplement`/`play-interaction`/`account-profile`/`ugc-listentogether` 等单体页面为子组件（每个子组件为单文件 `.vue`）。
6. 全量 `npm run build` + 人工回归。

**回滚策略**：本次以 OpenSpec change 分阶段实施，每步可独立 commit；若 Pinia 阶段出问题可 `git revert` 该阶段提交，不影响已完成的依赖升级与去 RxJS。

## Open Questions

- `user` store 是否需要在本次接入 `pinia-plugin-persistedstate` 持久化登录态（token 目前走 cookie，刷新即失效）——可留待后续，不影响本 change 结构。

## Resolved (from earlier exploration)

- 四件套 SFC 是否统一为内联 SFC —— **已定：合并**（见 D7），用户明确要求四件套组件全部合并为单文件 `.vue`。
