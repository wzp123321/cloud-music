# Proposal

## Why
新增对齐的 38 个接口目前只有歌词搜索进入消费页，其余只能在能力中心控制台手动调试。用户已选定歌曲百科/红心数、歌单订阅者/相关推荐四项目标，要在本轮进入真实详情页，让接口能力对用户可见。

## What Changes
- 歌曲详情页「歌曲详情」面板增加歌曲百科与红心数信息，与现有评论、相似推荐并列。
- 歌单详情页增加订阅者列表与相关推荐歌单，分别落在作者信息区与页面底部。
- 四条接口统一采用失败降级：请求失败或数据为空时隐藏对应区块，不阻塞页面、不额外弹错（响应拦截器已统一提示）。
- 新增消费侧类型与数据编排 hook；`high-value.service.ts` 只复用不修改；能力中心控制台保持原样。

## Capabilities

### New Capabilities
- `song-detail-enrichment`: 歌曲详情页展示百科摘要与红心数，以及加载、空值与失败时的降级行为
- `playlist-social-insights`: 歌单详情页展示订阅者与相关推荐歌单，以及加载、空值与失败时的降级行为

### Modified Capabilities
（无）

## Impact
- 代码：`src/views/music-detail/`、`src/views/playlist/playlist-detail/` 新增局部组件与 hook；`src/apis/server-coverage/high-value.service.ts` 仅复用
- 接口：`/song/wiki/info`、`/song/red/count`、`/playlist/subscribers`、`/playlist/detail/rcmd/get`（均已封装）
- 依赖：无新增依赖；不改动请求层、播放器 store 与路由
- 兼容：失败只隐藏新增区块，现有页面结构与交互不变
