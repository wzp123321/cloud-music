# Design

## Context

当前 `src` 顶层：`apis, assets, components, config, constant, core, hooks, router, store, utils, views`。顶层已符合 `vue-standard`。问题在于子层：视图目录内耦合了 API 定义、service 对象与组合式 hook，违反"API 集中 `apis/{module}/`、hook 就近 `views/{module}/hooks/` 或全局 `hooks/`"的约定。现状数据（实测）：`*.service.ts` 共 34 个（其中 10 个导出 `useXxx`、23 个导出 `XxxService` 对象/类）；视图内 `*.api.ts` 6 个；嵌套 `services/` 3 个（`album-detail`、`artist-detail`、`portal`）；全局 `src/hooks/` 5 个（useAuth/useLyric/usePagination/usePlayer/useRequest）；`src/apis` 顶层有 `common/` 子目录（正确范式）及若干散文件。

## Goals / Non-Goals

**Goals:**
- 严格符合 `vue-standard` 目录规范：API 定义全部归 `src/apis/{module}/`，页面私有 hook 归 `views/{module}/hooks/`，跨页共享 hook 归 `src/hooks/`。
- 消除 `*.service.ts` 在视图层的双范式混淆（hook 与 service 对象同名混放）。
- 完成 `<script setup>` 迁移尾巴，启用 router 自动注册。

**Non-Goals:**
- 不改变任何用户可见功能、接口契约或视觉表现。
- 不重写业务代码逻辑，仅做文件搬迁与 import 修正。
- 不处理 `coding-standard` 类问题（console、any、v-html、错误吞没等）—— 属另一审查项，不在本 change。

## Decisions

### D1. 采用方案 b（就近内聚）收口页面逻辑

- 页面私有 `useXxx` → `views/{module}/hooks/useXxx.ts`；跨页复用的 5 个共享 hook 继续留在全局 `src/hooks/`。
- 所有 API 定义（含原 `*.api.ts` 与 `XxxService` 服务对象）→ `src/apis/{module}/`（纯 API 用 `index.api.ts`，服务/工具对象用 `index.ts` 或 `{name}.service.ts`）。
- **Rationale**：`common/` 已在 `apis/` 下、全局 `hooks/` 只放共享逻辑，现状本就朝此方向；就近内聚比全量集中改动面更小、更符合 `vue-standard` 明示的 `views/{module}/hooks/` 条款。
- **Alternative**：方案 a（全量集中到全局 `apis/` + `hooks/`）→ 改动更大、跨页耦合更强，否决。

### D2. 模块命名与文件形态

- `src/apis/{module}/index.api.ts`：纯请求函数（原 `*.api.ts`）。
- `src/apis/{module}/index.ts` 或 `{name}.service.ts`：无状态服务/工具对象（原 `XxxService`）。
- `views/{module}/hooks/useXxx.ts`：页面私有组合式函数，默认 `export const useXxx = () => {...}`。
- **Rationale**：与 `vue-standard` 的 `apis/{module}/index.api.ts + index.ts` 条款对齐，消除散落。

### D3. Router 自动注册

- `router/index.ts` 改为 `const modules = import.meta.glob('./modules/*.ts', { eager: true })` 聚合 `modules/*.ts` 的 `routes` 导出；删除手维护的 `import routes from './modules'`。
- **Rationale**：`vue-standard` 要求 `router/modules/{module}.ts` 自动注册，避免新增路由时漏改 barrel。

### D4. 迁移顺序：先 API/service，后 hook，再语法，最后 router

- 每步独立 `git commit`，便于 `git revert` 单步回滚。
- **Rationale**：API/service 收口影响面最广（最多 import），先集中可降低后续 hook 抽取的依赖噪音。

## Risks / Trade-offs

- **[批量移动漏改 import]** → 每步执行后用 `grep -rn "旧路径" src` 确认 0 命中；`npm run build` + `vue-tsc --noEmit` 兜底类型解析。
- **[跨页引用断裂]** → 已知跨页引用：`artist-detail/services/artist-detail-api.ts` 被 `search.service.ts` 引用、`views/home/components/play-controller/pc.service` 被 `music-detail.service.ts` 引用；迁移时一并改 import。
- **[`defineComponent` 迁移引入行为差]** → 仅语法形态变更（Options `setup()` → `<script setup>`），逻辑不变；逐文件迁移后 `npm run build` 验证。
- **[`skip_specs` 误用]** → 纯重构、零行为变化，已确认不产 delta spec，符合 `skip_specs` 适用条件。

## Migration Plan

1. API/service 收口：6 个 `*.api.ts` → `apis/{module}/index.api.ts`；3 个嵌套 `services/` → `apis/{module}/`；`apis` 顶层散文件归模块；23 个 `XxxService` 对象迁入 `apis/{module}/`；修正 import。
2. Hook 收口：10 个 `useXxx` 从 `*.service.ts` 抽为 `views/{module}/hooks/useXxx.ts`；清理转出后空的 `*.service.ts`。
3. `<script setup>` 迁移：19 个 `.vue` 改写法。
4. Router：`import.meta.glob` 自动注册。
5. 验证：`npm run build` + `npm run lint` 全绿；`grep "defineComponent" src` = 0；`grep -rn "\.service\.ts" src/views` 残留为 0。

**回滚策略**：每步独立 commit；任一阶段异常 `git revert` 该提交，不影响已完成步骤。

## Open Questions

（无 —— 方案 b 已定，任务拆分明确。）
