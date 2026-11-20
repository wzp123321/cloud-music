# Proposal

## Why

`cloud-music-web` 仍停留在 2022 年的技术栈（Vite 2.9 / Vue 3.2 / Element Plus 2.2 / TS 4.5），且"全局状态"实际由三个未进 Vuex 的 `ref` 单例（Player / PlayListService / UserService）散落承载，RxJS 仅用于 `takeUntil` 退订、无任何流式语义，页面层零 composables、单体 `.vue` 最高达 844 行。现状可维护性与可观测性差，且已明显落后于生态。本次改造在不改变任何用户可见行为的前提下，做依赖升级、状态层重写、去 RxJS、组件与 hooks 拆分。

## What Changes

- **依赖升级（BREAKING 于构建链路）**：`vite` 2.9→5.x、`@vitejs/plugin-vue` 跟随、`vue` 3.2→3.5、`vue-router` 4.0→4.4+、`element-plus` 2.2→2.9、`typescript` 4.5→5.x、`vue-tsc` 0.34→2.x、`less` 4.1→4.2+、`unplugin-auto-import`/`unplugin-vue-components` 升最新、`axios` 0.27→1.x。
- **状态层重写（重写增强）**：移除空的 `vuex`，引入 `pinia` + `pinia-plugin-persistedstate`。把三个 `ref` 单例按子域拆为 `playlist` / `player` / `lyric` / `user` 四个强类型 store；其中 Player 与 PlayListService 重复的队列合并进 `usePlaylistStore` 作为唯一真相源；音频 DOM 元素由 store 以 `shallowRef` 持有、组件 `bindAudio(el)` 注入。
- **移除 RxJS**：`package.json` 删除 `rxjs`；service 中 `BehaviorSubject`→`ref`，组件中 `Subject + takeUntil`→`watch` / `onUnmounted` 或直读 Pinia 响应式 state。
- **service 层改造为 hooks**：所有页面级 `*.service.ts`（class 式状态层）改写为 `use*` composables，在 `setup` 内以 `useXxx()` 调用；纯 API 定义文件（`*.api.ts`）与工具模块保持不变。跨切面的三个全局单例（Player / PlayList / User）走 Pinia store（见设计 D1），不在此列。
- **组件合并为单文件 SFC**：现有四件套组件（`.vue + .html + .ts + .less`）合并为单一 `.vue`，内联 `<template>` / `<script setup lang="ts">` / `<style lang="less" scoped>`。
- **组件与 hooks 拆分**：新增 `useRequest` / `usePagination` / `usePlayer` / `useAuth` / `useLyric` 等 composables，抽离页面逻辑；将 `user-supplement`(844) / `play-interaction`(775) / `account-profile`(766) / `ugc-listentogether`(751) 等单体 `.vue` 拆为展示型子组件（每个子组件同样为单文件 `.vue`）。
- **统一代码风格**：函数一律以 `const` 箭头声明；关键逻辑补齐中文注释。
- **工程化地基（补质量门）**：引入 ESLint 9 flat config（`@eslint/js` + `typescript-eslint` + `eslint-plugin-vue` + `eslint-config-prettier`），新增 `lint` / `lint:fix` scripts；`tsconfig.json` 在 `strict` 基础上补 `noUnusedLocals` / `noUnusedParameters` / `noImplicitReturns` / `noFallthroughCasesInSwitch`。
- **请求层统一**：合并并存的两份 `src/config/request.ts` 与 `src/services/request.ts`（及 portal 专用封装）为单一 `src/services/request.ts`，统一 axios 实例与拦截器（token 注入 + 错误归一），供 hooks 与 `useRequest` 复用。
- **构建与产物优化**：审计 `vite.config.ts`（vite 2→5），加 `manualChunks` vendor 分包、`terser` 去 `console`、显式 `less` 预处理选项（`javascriptEnabled`）、按环境控制 `sourcemap`。
- **杂项清理**：`formatDuration` 移入 `core/utils`；`PLAY_TYPE` / `playTypes` 降为模块级常量；`demo.vue` 顺手删除。

## Capabilities

纯重构，不改变任何 spec 级行为。`skip_specs: true` 已在 `.openspec.yaml` 声明，本 change 不产生 delta spec。

## Impact

- 代码：`src/store/index.ts`（删除）、`src/views/home/components/play-controller/*`、`src/views/home/components/play-list/*`、`src/services/user.service.ts`、`core/token.ts`、34 个 `*.service.ts`（页面级改写为 hooks）、8 个含 RxJS 的 `.vue`、全部四件套组件（合并为单 `.vue`）、多个 600+ 行页面；新增 `src/services/request.ts`（合并双 request）、`eslint.config.js`、`stores/` 四文件；修改 `vite.config.ts`、`tsconfig.json`、`package.json` scripts。
- 依赖：`vuex`、`rxjs` 移除；`pinia`、`pinia-plugin-persistedstate` 新增；其余按上表升级；新增 `eslint`、`@eslint/js`、`typescript-eslint`、`eslint-plugin-vue`、`eslint-config-prettier`（dev）。
- 数据：localStorage 沿用 `cloud-music-list` / `cloud-play-index` 旧 key（经 persistedstate 兼容），已有用户播放列表不丢失。
- 构建：Vite 5 需审 `vite.config` 的 `server` / `build` 选项；`build` 脚本 `vue-tsc --noEmit && vite build` 保持不变。
- 风险：页面拆分工作量最大；依赖大版本跳跃需回归验证。
