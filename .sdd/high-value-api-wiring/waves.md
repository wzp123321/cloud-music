# waves：high-value-api-wiring

任务正文以 `openspec/changes/high-value-api-wiring/tasks.md` 为唯一来源，本文件只标波次与依赖。完成度回写 OpenSpec tasks，进度真源为 `openspec status --change high-value-api-wiring --json`。

| 波次 | 路数 | 任务编号 | 依赖 | 并发语义 |
|---|---|---|---|---|
| Wave 1 | 2 | 1.1 / 1.2 | 无 | 并行：歌曲响应归一化、歌单响应归一化 |
| Wave 1 评审 | 1 | 卡点③ 交叉评审 | Wave 1 | 换 agent，核对存在性 / 非占位 / 契约吻合 |
| Wave 2 | 2 | 2.1+2.2+2.3 / 3.1+3.2+3.3 | 1.1 / 1.2 | 并行：歌曲详情接入、歌单详情接入 |
| Wave 2 评审 | 1 | 卡点③ 交叉评审 | Wave 2 | 换 agent，核对三条强制项 |
| Wave 3 | 1 | 4.1 + 4.2 | Wave 2 全绿 | 串行集成验收（build / lint / 真实接口手测） |
| Stage 5 | 1 | 集成审计 → 构建门 → 卡点④ | Wave 3 | 专门只读审计 agent + 真实构建 |

## 派活种子（用户已确认的参考锚点）

| 锚点 | 用途 |
|---|---|
| `src/components/cm-simi/cm-simi.api.ts` → `normalizeSimi` | 字段兜底范式 |
| `src/views/search/hooks/useSearch.ts` → 请求序号（约 38–41 / 81 / 94 行） | 切歌 / 切歌单防串数据 |
| `src/components/cm-playlist-card/cm-playlist-card.vue` → props `id`/`title`/`coverImageUrl`/`playCount` | 相关推荐卡片 |
| `src/views/music-detail/music-detail.vue` → `detailId` computed（约 237 行）、「歌曲详情」面板（约 81–85 行） | 歌曲侧挂载 |
| `src/views/playlist/playlist-detail/hooks/usePlaylistDetailView.ts` → `usePlaylistDetailView` | 歌单侧状态编排 |

## 全局约束（每波派活必带）

- 项目根：`D:/workspace/private/collect/cloud-music`
- 只读上游：OpenSpec proposal / spec delta / design / tasks、`.sdd/high-value-api-wiring/design-detail.md`
- 禁止改：`high-value.service.ts`、`apis/request.ts`、播放器 store、路由、`components/register.ts`
- 工作区可能有并行会话：动手前 `git status`，只改派活清单内的文件
- 加密兜底：读文件前 `head -c 64 "$f"` 探密文；密文用 `git show HEAD:<path>` 取明文，不用 cat / Read 直读；写完用 `tr -dc '\0' < "$f" | wc -c` 复验
- `npm run build` 会改 `components.d.ts`，提交前还原
