# Tasks

## 1. API / Service 层收口（apis/{module}/）

- [x] 1.1 将视图内 6 个 `*.api.ts`（`header-loginform.api.ts`、`home/components/play-list/play-list.api.ts`、`mvplay.api.ts`、`playlist-detail/playlist-detail.api.ts`、`search.api.ts`、`user.api.ts`）迁入对应 `src/apis/{module}/index.api.ts`，并修正所有 import 引用；验证 `grep -rn "旧相对路径" src` 为 0 且 `npm run build` 过
- [x] 1.2 将 3 个嵌套 `services/` 目录（`album-detail/services`、`artist-detail/services`、`portal/services`）整体迁入 `src/apis/{module}/`，修正跨页引用（如 `artist-detail-api.ts`、`portal-request.service.ts`）；验证 `npm run build` 过
- [x] 1.3 将 `src/apis` 顶层散文件（`content-enhance.*`、`playlist-manage.api.ts`、`search-enhance.api.ts`、`user.api.ts`、`user.service.ts`、`common.service.ts`）归到 `apis/{module}/` 子目录（`common/` 已为范式）；验证 `npm run build` 过
- [x] 1.4 将视图内 23 个导出 `XxxService` 对象的 `*.service.ts` 迁入 `src/apis/{module}/`（纯服务/工具对象），保留调用方 `xxxService.method()` 形式；验证 `grep -rn "原路径" src` 为 0

## 2. Hooks 收口（views/{module}/hooks/）

- [x] 2.1 从 10 个导出 `useXxx` 的 `*.service.ts` 抽离组合式函数，落地为 `views/{module}/hooks/useXxx.ts`，调用方由 `new Xxx()`/`xxx.method()` 改为 `useXxx()`；验证 `npm run build` 过
- [x] 2.2 转出 hook 后清理对应 `*.service.ts` 的残留导出，确保视图层 `*.service.ts` 仅含合法 `XxxService` 或已删除；验证 `grep -rln "export const use" src/views --include=*.service.ts` 为 0

## 3. `<script setup>` 迁移

- [x] 3.1 将 19 个仍用 `defineComponent({ setup(){} })` 的 `.vue` 改为 `<script setup lang="ts">`；验证 `grep -rl "defineComponent" src --include=*.vue` 为 0 且 `npm run build` 过

## 4. Router 自动注册

- [x] 4.1 将 `router/index.ts` 的 `import routes from './modules'` 改为 `import.meta.glob('./modules/*.ts', { eager: true })` 聚合；验证 `npm run build` 过、`npm run preview` 路由跳转正常

## 5. 集成验证

- [x] 5.1 `npm run build` 与 `npm run lint` 全绿；`defineComponent` 与 `src/views` 下 `*.service.ts` 残留为 0；本地 `npm run preview` 走通主要路由跳转与请求链路

## Workflow follow-up

- 待 `cloud-music-p1-enhancement`、`cloud-music-p2-longtail` 归档后再实施本 change（与 modernize 审查建议一致）。
- 实施完成后执行 `openspec archive` 归档本 change。
