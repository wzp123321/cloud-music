# Tasks

并行语义：1.1 / 1.2 可并行；第 2 组与第 3 组在第 1 组完成后可并行；第 4 组为集成验收，必须最后执行。

## 1. 响应归一化（两组可并行）

- [x] 1.1 新增 `views/music-detail/api/song-enrichment.api.ts`：定义百科条目与红心数 VO，实现 `normalizeWiki` / `normalizeRedCount`，兼容 `data` 包裹与顶层字段、数字/字符串红心数；验证：`npm run build` 类型检查通过，能力中心对同一 id 调 `/song/wiki/info`、`/song/red/count`，控制台打印归一化结果字段齐全，异常形态返回空
- [x] 1.2 新增 `views/playlist/playlist-detail/api/playlist-social.api.ts`：定义订阅者与相关推荐歌单 VO，实现 `normalizeSubscribers` / `normalizeRcmd`，丢弃无 id 项；验证：`npm run build` 类型检查通过，能力中心对同一歌单调 `/playlist/subscribers`、`/playlist/detail/rcmd/get`，控制台打印归一化结果字段齐全

## 2. 歌曲详情接入

- [x] 2.1 新增 `views/music-detail/hooks/useSongEnrichment.ts`：按 `detailId` 变化并发拉百科与红心数，用请求序号拦截旧响应；验证：切歌后区块显示新歌数据，快速连续切歌区块不与当前歌曲串数据
- [x] 2.2 在 `music-detail.vue` 的「歌曲详情」面板挂载百科与红心数区块，样式沿用 `.md-detail` 体系与语义变量；验证：切到「歌曲详情」可见、切到「歌词」隐藏，深色主题下文字与底色可读
- [x] 2.3 验证本组降级：临时让两个接口返回空与抛错；验证：只隐藏新增区块，评论、`cm-simi` 相似推荐与播放器控件照常可用，控制台无新增错误提示

## 3. 歌单详情接入

- [x] 3.1 扩展 `usePlaylistDetailView`：按 `playlistId` 变化并发拉订阅者与相关推荐，用请求序号拦截旧响应，对外暴露 ref；验证：切到另一歌单后两组数据更新为新歌单内容，快速切换不串数据
- [x] 3.2 新增局部组件 `views/playlist/playlist-detail/components/subscriber-list.vue`（头像 + 昵称），在 `playlist-detail.vue` 挂载订阅者列表，底部用 `cm-playlist-card` 挂载相关推荐；验证：订阅者头像昵称正常显示，点击推荐歌单跳转到对应详情页
- [x] 3.3 验证本组降级：临时让两个接口返回空与抛错；验证：只隐藏新增区块，歌单信息、歌曲列表、播放全部与评论照常可用，控制台无新增错误提示

## 4. 集成验收

- [x] 4.1 `npm run build` 与 `npm run lint` 全绿，无新增 `any`、无未清理的 watch
- [x] 4.2 启动 server 与 web，逐项手测：歌曲百科/红心数、订阅者/相关推荐在真实数据下展示正确，切歌与切歌单无串数据，空态与失败态只隐藏对应区块，控制台无报错
