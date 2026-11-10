# 代码审查报告：cloud-music-web（modernize 分支）

> 审查依据：`references/rules/coding-standard.md`、`references/rules/vue-standard.md`
> 审查范围：当前 `modernize` 分支全量 `src/`（working tree clean，以 HEAD `9d3a9f0` 为准）
> 审查方式：静态扫描（grep 规则 + 目录统计）+ 关键文件抽读，未运行修改

---

## 一、总体结果

- **结论：存在必须修复的 Critical 问题 2 类，及一批 Major 结构/规范偏离。建议修复后复审。**
- 已完成项（与本次 modernize 目标对照）：Vuex→Pinia ✅、RxJS 移除 ✅、依赖升级 ✅、组件四件套合并 ✅（大体）、`el-` 组件实为 Element Plus 官方栈（**非缺陷**，详见 M8）。
- 待决项：目录结构偏离 `vue-standard`（M1/M2），属「规范与项目既有栈冲突」，需用户拍板。

---

## 二、审查文件清单与范围

- 静态覆盖：`src/**/*.vue`（62 个）、`src/**/*.ts`（共 45 个非 api/service 的 .ts + 若干 `*.api.ts`/`*.service.ts`）。
- 重点通读：`services/request.ts`、`composables/useRequest.ts`、`pages/search/search.service.ts`、`utils/index.ts`、`eslint.config.mjs`、`router/*`。
- 统计：`any` 423 处；`console.log/warn` 8 处；`defineComponent` 19 处；`.less` 9 个（均在 `assets/` 下，全局样式，正常）；`.html` 0 个；`hooks/` 目录 0 个；vuex/rxjs 引用 0。

---

## 三、问题列表（分级）

### Critical（必须修复）

**C1. 生产代码残留 console.log / console.warn（8 处）**
- `src/utils/index.ts:107` `console.log(res)`
- `src/services/file-download-upload.service/file-download.service.ts:45` `console.warn('导出数据', '-->', error)`
- `src/services/file-download-upload.service/util.ts:95,100` `console.log(size)`
- `src/pages/artist/artist-detail/artist-detail.vue:233` `console.log(pageEle)`
- `src/pages/artist/artist-detail/services/artist-detail.service.ts:162` `console.log(res)`
- `src/pages/mvplay/mvplay.service.ts:76` `console.log(res)`
- `src/pages/music-detail/music-detail.service.ts:49` `console.log(res)`

违反 coding-standard「禁止调试代码」。当前 ESLint 未启用 `no-console`，故未被拦截——属真实遗漏。

**C2. 直接使用 axios 绕过统一请求层（1 处，且存在功能缺陷）**
- `src/utils/index.ts:86` `await axios({...})` 位于 `getFileStreamDownload`，未走 `services/request.ts`。
- 风险：未注入 `Authorization`（仅硬编码空 `tenantCode`），需登录态的文件流下载会失败/越权；同时绕过了统一拦截器的超时与错误处理。

### Major（建议修复）

**M1. 目录结构偏离 vue-standard（规范符合性核心问题）**

| 规范（vue-standard 一/三节） | 实际项目 |
|---|---|
| `src/views/{module}/` | `src/pages/{module}/`（另有遗留 `src/views/` 含 home/header 共存）|
| `src/apis/{module}/index.api.ts + index.ts` | `src/services/*.service.ts` + `src/services/*.api.ts` + 页级 `*.api.ts`，分散 |
| `src/hooks/`（全局）+ `views/{module}/hooks/` | **0 个 `hooks/` 目录**，hooks 内联在 `.service.ts` |
| `src/router/modules/{module}.ts` 自动注册 | `src/router/index.ts` + `router/routes.ts` 扁平 |
| `src/store/` | `src/stores/`（复数）|

**M2. 「service→hooks」迁移半成品 / 命名混淆**
用户要求「service 全都改造成 hooks」，但 `.service.ts` 内同时并存两种范式：
- 导出 `useXxx` 组合式函数（`useSearch`/`usePortal`/`useAlbumDetail`/`useMusicDetail`/`useMvPlayer` 等）——实为 hooks，却用 `.service.ts` 命名；
- 仍导出 `XxxService` 服务类/对象（`contentEnhanceService`、`discoveryService`、`feedService` 等），页面以 `xxxService.method()` 调用。
建议：hooks 统一落到 `hooks/` 或按 `useXxx.ts` 命名；纯服务对象保留 `*.service.ts` 且仅置于 `services/` 全局层，不混入页面目录。

**M3. 19/62 个 .vue 仍用 `defineComponent` 旧写法**
涉及 `components/cm-album-card`、`cm-loading`、`cm-table`、`cm-playlist-card`、`cm-error`、`cm-skeleton`、`cm-navbar`、`cm-mv-card`、`views/home`、`views/header`、`pages/rank`、`pages/portal`、`pages/album-detail`、`pages/artist-detail` 等。规范明确「必须 `<script setup lang="ts">`、禁止 Options API」。当前为 `defineComponent({ setup(){} })`——功能可用但不符合规范、增加维护成本。

**M4. `v-html` 渲染外部富文本（XSS 风险，3 处）**
- `components/cm-comment/cm-comment.vue:41/50/75`（评论）
- `views/home/components/play-controller/play-controller.vue:39`（歌词）
- `pages/artist/artist-detail/artist-detail.vue:160/164`（歌手简介）

均用 `eslint-disable-next-line vue/no-v-html` 关闭校验。安全规范禁止 `innerHTML` 拼接用户输入；云音乐 API 返回的评论/歌词含富文本，若内容不可信则有 XSS 风险。建议用 DOMPurify 清洗，或明确标注来源可信并保留禁用说明。

**M5. 状态覆盖（Loading/Empty/Error）不一致**
- `composables/useRequest.ts`：`run` 的 `catch` 仅置 `error`，**不 `message.error`**，错误被静默吞掉。
- `pages/search/search.service.ts` `query()` 的 `catch` 仅重置数组，无失败提示。
不符合 vue-standard「操作失败有 message 提示」「Error 状态 message.error」。

**M6. ESLint 配置过简，未承接 coding-standard**
`eslint.config.mjs` 仅引入通用 recommended 集（js/ts/vue + prettier），且 `no-explicit-any: 'off'`。未覆盖：console 禁用、any 禁用、import 顺序、魔法数字、te-/el- 约束。规范与实际 lint 脱节——这是 C1 能存活的根因之一。

**M7. `any` 类型泛滥（423 处）**
集中于 API 响应层：`cm-comment.api.ts`、`cm-api-block/*`、`cm-simi.api.ts`、`content-enhance.api.ts`、`useRequest.ts`。coding-standard 将 `any` 列为 Critical，但 lint 已关闭该规则，故实际为非阻断项。建议：API 边界用 `unknown` + 类型收窄，内部动态结构用 `Record<string, unknown>` 替代 `any`；并开启 `no-explicit-any: warn` 逐步收敛。

**M8. `el-` 组件与 vue-standard 的 te- 约束冲突（非缺陷，需确认）**
vue-standard 4.5 禁止 `el-` 前缀、要求 `@tiansu/element-plus`（`te-`）。但本仓库 `package.json` 实测 `element-plus: true`、`vuex/rxjs: false`、`pinia: true`——即项目真实 UI 栈是 **Element Plus 官方组件**，`el-` 用法是既有约定而非违规。结论：`el-` **不应作为缺陷处理**，但需在规范中明确标注「cloud-music 项目以 Element Plus 为 UI 库，豁免 te- 约束」，避免后续审查误判。

### Minor（建议优化）

- `utils/index.ts`：`Deffer` 类（疑似 `Defer` 拼写错误）字段全 `any`；`timeStamp: any`；`downloadBlobFile(data: any, ...)`。
- `pages/search/search.service.ts:19` 中文 enum key `enum EPath { 搜索 = '/search' }`——优先用 `const` 对象。
- 魔法数字：portal `el-carousel :interval="4000"`、`height="320px"`、`el-radio :label="0"/"10"`（歌单隐私），建议提为常量。
- 跨结构依赖：`pages/music-detail/music-detail.service.ts` 引用 `../../views/home/components/play-controller/pc.service`——pages 反向依赖 views，结构耦合。
- `search.service.ts` 顶部保留 2022 旧作者头（`@Author/@Date`），属噪音注释。

### Suggestion

- `useRequest` 可改为返回 `{ data, error }` 并让调用方决定提示，避免静默吞错。
- API 层统一 `CommonResponseType<T>` 泛型（vue-standard 6.2），当前各 `*.api.ts` 自行其是。

---

## 四、与设计文档一致性检查

- 项目无 `archive-spec/design/`，设计来源为 `openspec/changes/{cloud-music-modernize, cloud-music-p1-enhancement, cloud-music-p2-longtail}/design.md`。
- 对照 `cloud-music-modernize/design.md`：
  - Vuex→Pinia：✅ 完成（deps 无 vuex，`stores/` 均为 Pinia Setup Store）
  - RxJS 移除：✅ 完成（deps 无 rxjs，0 引用）
  - 升级基础依赖：✅ 完成
  - service→hooks：⚠ 半成品（见 M2）
  - 组件四件套合并：✅ 大体完成（无 `.html`，组件无分离 `.ts`；仅 9 个全局 `.less` 在 `assets/` 下，正常）
  - 函数 const 声明 + 中文注释：✅ 大体符合
- 目录结构：⚠ 偏离 vue-standard（见 M1），但与本仓库既有约定（NetEase 克隆）一致——属「规范与项目实际栈冲突」，需用户拍板是否对齐。

---

## 五、Review Gate

- [x] 全部文件已审查（静态 + 抽样通读）
- [ ] 无 Critical Issue —— ❌ 存在 C1 / C2
- [x] Major Issue 已列出
- [ ] 与设计文档一致 —— ⚠ M1/M2 偏离
- [x] 审查报告已生成

---

## 六、最终建议（按优先级）

1. **先修 Critical**：清除 8 处 console；把 `utils/index.ts` 的文件流下载改为复用 `services/request.ts`（或显式注入 `Authorization`）。
2. **决策目录结构标准**（呼应「先定标准再动手」原则，二选一）：
   - 方案 A：将 cloud-music 显式登记为「vue-standard 例外项目」，保留 `pages/`、`services/`、`composables/`、`stores/`、`router/`（扁平），把 M1/M2/M3/M8 标记为「已确认的项目约定」；
   - 方案 B：按规范逐步迁移到 `views/`、`apis/`、`hooks/`、`router/modules/`、`store/`。
3. **收口 `any`**：开启 `no-explicit-any: warn`，从 API 边界开始收敛；补齐 ESLint（console/import 顺序/魔法数字）。
4. **补齐 `<script setup>` 迁移与状态提示**（M3/M5），并处置 `v-html` 的 XSS 风险（M4）。

> 本阶段仅产出审查报告，未修改任何代码。请确认修复范围后进入修改阶段。
