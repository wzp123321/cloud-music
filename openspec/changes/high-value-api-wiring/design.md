# Design

## Context

`high-value.service.ts` 已封装四条读接口，但只在能力中心 `new-capabilities.vue` 以 `run: () => svc.xxx()` 形式被手动调用，没有消费页。歌曲详情页的「歌曲详情」面板目前只有 `cm-comment` 与 `cm-simi`；歌单详情页所有状态由 `usePlaylistDetailView` 提供，模板只做解构。响应拦截器已统一处理错误提示，业务侧失败应静默降级。

## Goals / Non-Goals

**Goals:**
- 四个接口的数据经归一化后进入各自详情页，页面不直接读上游字段。
- 快速切歌 / 切歌单时新增区块不串数据。
- 请求失败或数据为空时只隐藏新增区块，不影响主流程。

**Non-Goals:**
- 不修改 `high-value.service.ts`、请求层、播放器 store 与路由。
- 不改变能力中心控制台，不引入新依赖。
- 不接本轮未选中的其余 34 个接口。

## Decisions

1. **数据入口沿用现有分层**：歌曲详情新增 `views/music-detail/hooks/useSongEnrichment.ts`，歌单详情扩展 `usePlaylistDetailView`。页面只解构 hook 返回的 ref。
   - 备选：页面脚本内直接 `await` 接口 → 与现有 hook 分层冲突，切歌时清理逻辑散落，不采用。

2. **上游字段在 `.api.ts` 内归一化**：仿 `cm-simi.api.ts` 的 `normalizeSimi`，各写 `normalizeWiki` / `normalizeRedCount` / `normalizeSubscribers` / `normalizeRcmd`，输出固定 VO（百科条目数组、红心数、订阅者数组、推荐歌单数组）。页面只读 VO。
   - 备选：模板里用 `?.` 深读并罗列字段别名 → 字段兜底散落在模板，后续上游改名要改多处，不采用。

3. **切歌竞态用请求序号拦截**：hook 内自增 `requestId`，仅最新序号的响应允许写入 ref；沿用 `useSearch.ts` 已有范式，不引 AbortController（请求层暂未提供取消通道）。
   - 备选：不做保护 → 快速切歌时旧歌百科覆盖新歌，属可见 bug。

4. **组件复用优先**：相关推荐复用 `cm-playlist-card`（已支持 id / title / cover / playCount / creator / size，点击自带跳详情）；订阅者列表只在歌单详情使用，放 `views/playlist/playlist-detail/components/subscriber-list.vue` 局部 import，不进 `components/register.ts`。
   - 备选：新建全局 `cm-subscriber-list` → 单点使用不必全局注册。

5. **加载态只加局部标记**：新增区块各自维护 `loading`，失败/空值直接置空并隐藏。`cm-state` 三态用于整页，不套在局部区块上。
   - 备选：整页 loading → 切换详情时白屏，体验倒退。

6. **字段别名以真实响应为准**：四个接口的归一化字段表来自服务端实测（`19830`，歌曲 `3460493895` / 歌单 `14059525387`），不按接口命名或同类接口推定。实测：百科在 `data.blocks[].rnData.blocks[].blockInfo.wikiSubElementVos[]`（`title` 作 label，`content` 或 `wikiSubMetaVos[].text` 作 value）、红心数在 `data.count`、订阅者主键是 `userId`、相关推荐在 `data.recPlaylist[]`（每项 `playlist` 需解包）。
   - 备选：按接口语义猜字段别名 → 静态评审与 build 均通过，但三个区块运行时恒空（本次已踩，见 KP-02）。

## Risks / Trade-offs

- [上游字段形态不统一] → 已用真实响应确认四条字段路径并写入详设 §2；normalize 仍保留多别名兜底，解析不出即返回空、隐藏区块。
- [红心数返回类型可能是数字或字符串] → normalize 统一转 number，非有限数按空值处理。
- [相关推荐接口可能返回歌单数组或包裹对象] → normalize 两种形态都取，`id` 缺失项丢弃。
- [请求序号只防写入不取消在途请求] → 旧请求仍占一次网络往返；本轮可接受，待请求层提供取消能力后统一升级。

## Migration Plan

前端增量改动，无数据迁移。四条接口真实响应已核对（见 Decisions 6）；上线前仍需在浏览器逐个确认区块渲染与降级。回滚只需移除两个 hook 的调用与模板挂载点，service 与请求层不动。
