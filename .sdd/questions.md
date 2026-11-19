# questions（全程问题账本）

接力模式：Stage 0 / Stage 1 已由 OpenSpec propose 完成，以下为已闭环结论。后续任何阶段新问先查本账，按 Qn 续写。

| 编号 | 问题 | 结论 | 来源 |
|---|---|---|---|
| Q1 | 本轮接入哪些接口 | 歌曲百科 / 红心数、歌单订阅者 / 相关推荐，共四项 | openspec-propose（用户选定） |
| Q2 | 失败与空数据如何处理 | 隐藏对应区块，不额外弹错；响应拦截器已统一提示 | openspec-propose |
| Q3 | 参考模块 | `cm-simi.api.ts` 的 `normalizeSimi`（归一化范式）、`useSearch.ts` 的请求序号（防串数据）、`cm-playlist-card`（推荐卡片） | Stage 0 用户确认 |
| Q4 | 档位 | 中档：纯前端两个详情页、四条已封装接口、无新表、不跨端；接力模式保留设计评审门 | Stage 0 用户确认 |
| Q5 | 详设与 OpenSpec design 冲突如何处理 | 详设只读引用、只细化不推翻；冲突则回 OpenSpec `update-change` | sdd-orchestrator 接力规则 |
| Q6 | service 的准确导出名与返回类型 | `import { highValueService } from '@/apis/server-coverage/high-value.service'`；`high-value.service.ts:169` 具名导出，`:171 song` / `:173 playlist`，方法均返回 `Promise<HV_Result \| null>`（`:23`） | Wave 2 子任务提问，编排者 Grep 定位确认 |
| Q7 | 归一化别名用 `??` 还是跳过空串 | 允许 song 侧 `firstString` 跳过空串（更严格，不引入错误数据）；playlist 侧保留 `??` 与 `normalizeSimi` 一致 | Wave 1 评审提醒，编排者默认接受 |
