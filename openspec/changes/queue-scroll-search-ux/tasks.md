# Tasks

## 1 播放队列重排（组 A，与 2/3 并行）

- [x] 1.1 在 `playlist` store 新增 `reorderMusic(from, to)`，重排 `musicList` 并按当前播放歌曲 id 重算 `player.currentIndex`；验证：重排后当前歌曲不变、顺序落盘、刷新后保持
- [x] 1.2 `cm-playlist-table` 行加原生 drag 事件，回调 `reorderMusic`；验证：拖拽一行到新位置，列表顺序即时更新
- [x] 1.3 验证重排后"下一首/上一首"按新顺序；随机模式行为不变
- [x] 1.4 冒烟：播放中点歌 → 拖拽 → 切歌 → 刷新，队列与当前曲目一致

## 2 路由滚动恢复（组 B，与 1/3 并行）

- [x] 2.1 `router/index.ts` 新增 `scrollBehavior`，按 `route.name + 关键参数` 从 sessionStorage 读取位置；新导航与换参数返回顶部
- [x] 2.2 需记忆的列表页路由标记 `meta.keepScroll: true`（歌单详情、搜索结果等）
- [x] 2.3 为异步渲染页面补数据就绪后的二次位置恢复，避免空列表导致恢复失效
- [x] 2.4 冒烟：歌单详情滚动中段 → 进歌曲详情 → 返回，位置恢复；换 tab/换词从顶部开始

## 3 搜索历史（组 C，与 1/2 并行）

- [x] 3.1 新增 `utils/searchHistory.ts`：记录/读取/删单条/清空，键 `cloud-search-history`，上限 20、去重、最近置顶、容错
- [x] 3.2 搜索页提交时调用记录函数；空白不记录
- [x] 3.3 头部搜索入口展示历史，点击回填并立即搜索；未登录可用
- [x] 3.4 删除单条与确认清空交互；验证刷新后状态保持
- [x] 3.5 冒烟：搜索 → 历史出现 → 删除/清空 → 刷新验证

## 4 集成验收（依赖 1/2/3 完成）

- [x] 4.1 `npm run build` 与 `npm run lint` 全绿
- [x] 4.2 三功能浏览器手测：队列重排不中断播放、返回恢复位置、搜索历史复用
- [x] 4.3 `openspec validate queue-scroll-search-ux --strict` 通过

## 5 流程债归档（独立，执行前单独确认）

- [ ] 5.1 核对 5 个在途 change（`login-session-hardening`、`hook-state-normalization`、`cloud-music-p1-enhancement`、`cloud-music-p2-longtail`、`cloud-music-modernize`）代码是否已合入、工作区是否干净
- [ ] 5.2 向用户逐项列出待归档 change 与依据，取得单独确认
- [ ] 5.3 归档 5 个 change，不改业务代码；确认 `openspec list` 不再显示它们在途
