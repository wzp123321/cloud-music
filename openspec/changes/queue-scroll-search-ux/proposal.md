# Proposal

## Why

播放队列不能调整顺序、列表页返回后丢失滚动位置、搜索没有本地历史——三个交互断点让用户重复操作；同时 5 个在途 change 的 tasks 与实际代码状态脱节，后续探索会把已做事项当成未完成。

## What Changes

- 播放队列支持拖拽排序，顺序写入持久化状态，当前播放项不受影响。
- 路由切换记录并恢复列表页滚动位置；详情页进入后返回原位。
- 头部搜索与搜索页共享本地搜索历史，支持单条删除与一键清空；登录态无关。
- 归档已完成但 tasks 未勾完的 5 个在途 change（`login-session-hardening`、`hook-state-normalization`、`cloud-music-p1-enhancement`、`cloud-music-p2-longtail`、`cloud-music-modernize`）；归档前逐项确认代码现状，不回滚任何实现。
- 无 BREAKING 变更；不新增依赖服务端的能力。

## Capabilities

### New Capabilities

- `playback-queue-reorder`: 播放队列的顺序调整能力，定义拖拽重排、持久化与对当前播放的影响边界。
- `navigation-scroll-restore`: 路由导航的滚动位置记忆能力，定义哪些页面恢复、哪些强制回顶。
- `search-history`: 本地搜索历史能力，定义记录触发条件、上限、删除与清空行为。

### Modified Capabilities

无。

## Impact

- `src/views/home/components/play-list/play-list.vue` 及播放队列 store：新增排序交互与顺序持久化。
- `src/router/index.ts`：新增 `scrollBehavior`；列表页路由需标记是否记忆位置。
- `src/views/header/hooks/useHeader.ts`、`src/views/search/hooks/useSearch.ts`：接入本地历史读写。
- `openspec/changes/` 下 5 个在途 change 目录：归档迁移，不改代码。
- 依赖：拖拽排序优先用项目已有依赖能力，不新增第三方库（见 design.md）。
