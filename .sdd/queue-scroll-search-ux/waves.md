# 波次排程：queue-scroll-search-ux

任务正文以 OpenSpec `tasks.md` 为唯一真源。本文只标波次与依赖，完成度回写 tasks.md。

## Wave 1 — 三路并行（契约冻结门已过：Q1-Q16 全闭环）

| 路 | 覆盖 tasks | 依赖 | 说明 |
|---|---|---|---|
| A 队列重排 | 1.1 / 1.2 / 1.3 / 1.4 | 无 | store + 组件 + 页面，单路内按序 |
| B 滚动恢复 | 2.1 / 2.2 / 2.3 / 2.4 | 无 | router 层 + 两页 meta；与 C 文件级不交叉 |
| C 搜索历史 | 3.1 / 3.2 / 3.3 / 3.4 / 3.5 | 无 | 新工具 + useSearch + 头部；不写入 useSearch 的滚动逻辑 |

三路文件级无重叠：A 动 `store/playlist.ts` / `cm-playlist-table` / `play-list.vue`；B 动 `router/` 两页；C 动 `utils/searchHistory.ts`（新）/ `useSearch.ts` / `useHeader*`。

## Wave 2 — 交叉评审（重档卡点③）

- 换独立 reviewer 审 Wave 1 三路；检查存在性 / 非占位 / 契约吻合；不通过返工 ≤2 轮。

## Wave 3 — 集成验收

- tasks 4.1 / 4.2 / 4.3：build + lint + 浏览器手测 + openspec validate --strict。

## 不在本轮

- tasks 第 5 组（归档 5 个在途 change）：执行前单独确认，不随本波自动跑。
