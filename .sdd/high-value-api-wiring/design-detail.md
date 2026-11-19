# 详设：高价值接口接入消费页

## 0. 上游契约（只读，不推翻）

| 文件 | 作用 |
|---|---|
| `openspec/changes/high-value-api-wiring/proposal.md` | 范围：四条读接口进两个消费页 |
| `openspec/changes/high-value-api-wiring/specs/song-detail-enrichment/spec.md` | 歌曲百科 / 红心数行为契约 |
| `openspec/changes/high-value-api-wiring/specs/playlist-social-insights/spec.md` | 订阅者 / 相关推荐行为契约 |
| `openspec/changes/high-value-api-wiring/design.md` | 归一化、请求序号、组件复用、局部降级四项决策 |
| `openspec/changes/high-value-api-wiring/tasks.md` | 实现任务编号 1.1–4.2 |

本详设只补文件级落点、函数签名与字段兜底顺序。与上游冲突时回 OpenSpec `update-change`，不在此处改写。

## 1. 代码锚点（用户已确认的参考模块）

| 锚点 | 复用点 |
|---|---|
| `cloud-music-web/src/components/cm-simi/cm-simi.api.ts` → `normalizeSimi` | `res?.songs ?? []` 式字段兜底 + `id` 默认缺失值 |
| `cloud-music-web/src/views/search/hooks/useSearch.ts` → 请求序号 | 自增序号比对后再写入 ref |
| `cloud-music-web/src/components/cm-playlist-card/cm-playlist-card.vue` | props：`id` / `title` / `coverImageUrl` / `playCount` / `creator` / `size`；点击自带跳详情 |

落点文件：`src/views/music-detail/music-detail.vue`（`detailId` computed 在脚本约 237 行，「歌曲详情」面板在模板约 81–85 行）；`src/views/playlist/playlist-detail/playlist-detail.vue`（模板挂载点）、`hooks/usePlaylistDetailView.ts`（状态编排）。

## 2. 数据契约（VO 与兜底顺序）

上游 `HV_Result = Record<string, unknown> & { code?: number; data?: unknown }` 已在 `apis/server-coverage/high-value.service.ts` 定义，本轮不改。

| 归一化函数 | 输入 | 输出 VO | 字段兜底顺序 |
|---|---|---|---|
| `normalizeWiki` | `HV_Result \| null` | `{ entries: { label: string; value: string }[]; summary: string }` | 实测路径：`data.blocks[]` → `rnData.blocks[]` → `blockInfo.wikiSubElementVos[]`；`title` 作 label，`content` 或 `wikiSubMetaVos[].text` 作 value；块级 `summary` 全为 null，data 层无 summary → `summary` 返回 `''`；解析不出返回空 VO。歌曲 `3460493895` 实测 18 条 |
| `normalizeRedCount` | `HV_Result \| null` | `number \| null` | `data.count`（实测命中，歌曲 `3460493895` = 576611）→ `data` → `count` → `redCount` → `likedCount`；`Number()` 后非有限数返回 `null` |
| `normalizeSubscribers` | `HV_Result \| null` | `{ id: number\|string; nickname: string; avatarUrl: string }[]` | 列表 `subscribers`（顶层）；主键 `userId` → `user_id` → `id`；昵称 `nickname`/`nickName`/`name`、头像 `avatarUrl`/`avatar`/`headimgUrl`；无 id 项丢弃。歌单 `14059525387` 实测 5 项 |
| `normalizeRcmd` | `HV_Result \| null` | `{ id: number\|string; name: string; coverImgUrl: string; playCount: number }[]` | 列表 `data.recPlaylist` → `playlists` → `data`（数组）；每项解包 `item.playlist`（兼容 item 自带 id）；封面 `coverImgUrl`/`picUrl`/`cover`；`playCount` 实测为整数，`Number()` + `isFinite` 兜底；无 id 项丢弃。歌单 `14059525387` 实测 6 项 |

四条接口均为读操作，不校验登录态；`service` 已吞异常返回 `null`，归一化函数必须接受 `null`。

## 3. 文件级改动

**新增（3 个）**

| 文件 | 职责 |
|---|---|
| `src/views/music-detail/api/song-enrichment.api.ts` | `SongWikiVO` / `normalizeWiki` / `normalizeRedCount` |
| `src/views/music-detail/hooks/useSongEnrichment.ts` | 按歌曲 id 拉百科与红心数，序号防串 |
| `src/views/playlist/playlist-detail/components/subscriber-list.vue` | 订阅者头像 + 昵称，局部 import |

**新增（1 个）**

| 文件 | 职责 |
|---|---|
| `src/views/playlist/playlist-detail/api/playlist-social.api.ts` | `SubscriberVO` / `RcmdPlaylistVO` / 两个 normalize |

**修改（3 个）**

| 文件 | 改动 |
|---|---|
| `src/views/music-detail/music-detail.vue` | 脚本调用 `useSongEnrichment(detailId)`；「歌曲详情」面板 `cm-comment` 之前插入百科与红心数区块，`v-if` 由 VO 是否为空决定 |
| `src/views/playlist/playlist-detail/hooks/usePlaylistDetailView.ts` | 新增 `subscribers` / `rcmdPlaylists` ref 与序号保护的加载逻辑，对外暴露 |
| `src/views/playlist/playlist-detail/playlist-detail.vue` | 作者信息区后挂订阅者列表；`cm-simi` 前挂相关推荐卡片；局部 import `subscriber-list.vue` |

禁止改：`high-value.service.ts`、`apis/request.ts`、播放器 store、路由、`components/register.ts`（订阅者组件只局部用）。

## 4. 函数级设计

```ts
// useSongEnrichment.ts
useSongEnrichment(songId: ComputedRef<number>): {
  wiki: Ref<SongWikiVO>; redCount: Ref<number | null>; loading: Ref<boolean>;
}
// watch(songId, immediate) → seq = ++requestId → 清空旧值 →
// Promise.all([highValueService.song.wiki(id), highValueService.song.redCount(id)]) →
// seq !== requestId 则丢弃 → 否则写入 normalize 结果；onScopeDispose 使序号失效

// usePlaylistDetailView.ts 内新增（不改既有导出）
const subscribers = ref<SubscriberVO[]>([]);
const rcmdPlaylists = ref<RcmdPlaylistVO[]>([]);
const currentPlaylistId = computed(() => Number(route.query.id || 0));
// watch(currentPlaylistId, immediate) → 同款 seq 保护 →
// Promise.all([highValueService.playlist.subscribers(id), highValueService.playlist.rcmd(id)])
```

`playlistId` 现有取值是常量，路由参数变化但组件复用时不会更新。新增数据改用 `currentPlaylistId` 监听路由 query，以满足 spec 的「切歌单更新」；既有详情数据逻辑不动。

## 5. 样式与降级

- 新区块沿用 `.md-detail` / `.pd-*` 既有布局与 `--color-*` / `--radius-*` / `--shadow-*` 语义变量，不写死色值，不加 `!important`。
- `v-if` 判空：VO 为空数组 / 空对象 / `null` 时不渲染整个区块，不显示「暂无」占位（避免空框）。
- 加载中只显示区块内轻量 loading 标记；失败由 `service` 返回 `null`，hook 置空，不弹错。
- `cm-image` 默认 lazy，头像与封面沿用。

## 6. 验证点（对应 tasks 编号）

| 任务 | 验证 |
|---|---|
| 1.1 / 1.2 | `npm run build` 类型检查；能力中心对同一 id 调四条接口，控制台打印 normalize 结果 |
| 2.1 | 切歌后数据更新；快速连切不串数据 |
| 2.2 / 3.2 | 面板显示；深色主题可读；推荐点击跳转正确歌单 |
| 2.3 / 3.3 | 空与失败响应只隐藏新增区块，主流程可用 |
| 4.1 / 4.2 | build + lint 绿；真实接口手测；`components.d.ts` 副产物还原 |

## 7. 风险

- 上游字段形态未知 → 归一化多别名兜底，解析失败返回空并隐藏区块（不猜字段、不报错）。
- 序号只防写入不取消在途请求 → 旧请求仍占一次往返，本轮可接受。
- 组件复用下路由 query 变化 → 用 `currentPlaylistId` computed 单独监听，不改既有详情加载链路。
