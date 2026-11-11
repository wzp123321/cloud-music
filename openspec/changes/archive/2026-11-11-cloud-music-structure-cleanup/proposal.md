# Proposal

## Why

`cloud-music-web` 顶层目录已对齐 `vue-standard`（`views / apis / hooks / router/modules / store`），但视图层仍散落大量 `*.service.ts`（34 个）、`*.api.ts`（6 个）与嵌套 `services/` 子目录（3 个）；19/62 个 `.vue` 仍用 `defineComponent`；`router/index.ts` 用手动 barrel 而非自动注册。现状属"规范与项目实际栈已大体对齐、但子层未收口"，需一次纯结构清理以严格符合 `vue-standard`。

## What Changes

- **API 层收口**：视图内 6 个 `*.api.ts` 与 3 个嵌套 `services/` 目录迁入 `src/apis/{module}/`；`src/apis` 顶层散文件归到 `apis/{module}/` 子目录（以现有 `common/` 为范式）。
- **Hooks 收口（方案 b：就近内聚）**：视图内 `*.service.ts` 中导出的 `useXxx`（实测 10 个）抽为 `views/{module}/hooks/useXxx.ts`；跨页复用的 5 个共享 hook 保留全局 `src/hooks/`；纯 `XxxService` 服务对象（实测 23 个）迁入 `src/apis/{module}/`。
- **`<script setup>` 迁移**：19/62 个仍用 `defineComponent({ setup(){} })` 的 `.vue` 改为 `<script setup lang="ts">`。
- **Router 自动注册**：`router/index.ts` 由 `import routes from './modules'` 改为 `import.meta.glob('./modules/*.ts', { eager: true })` 自动聚合。
- 同步修正所有受影响的 import 路径与跨页引用（如 `artist-detail/services/artist-detail-api.ts`、`views/home/components/play-controller/pc.service`）。

## Capabilities

### New Capabilities

（无 —— 纯目录/结构重构，不改变任何 spec 级行为。）

### Modified Capabilities

（无）

## Impact

- 代码：`src/views/**` 下 34 个 `*.service.ts`、6 个 `*.api.ts`、3 个嵌套 `services/` 目录的迁移与 import 修正；`src/apis/` 顶层散文件归模块；`src/router/index.ts` 注册方式；19 个 `.vue` 语法迁移。
- 依赖：无新增/移除。
- 行为：零功能变化，仅目录与文件组织调整；路由表、API 契约、视觉表现不变。
- 风险：批量移动易漏改 import；`skip_specs: true` 已声明，本 change 不产生 delta spec。
