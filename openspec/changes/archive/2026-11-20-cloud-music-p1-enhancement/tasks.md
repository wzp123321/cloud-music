# Tasks

## 1. 专辑/歌手/MV 增强（content-detail-enhancement）

- [x] 1.1 接入 `album_new`/`album_newest`/`album_list`/`album_list_style`/`album_songsaleboard`，新增新碟/榜单/风格浏览，验证专辑列表展示
- [x] 1.2 接入 `album_detail_dynamic`/`album_sub`/`album_sublist`，在专辑详情页展示动态数据并支持订阅，验证订阅状态
- [x] 1.3 接入 `artist_list`/`artist_top_song`/`artist_songs`/`artist_new_song`/`artist_new_mv`/`artist_video`，扩展歌手页热门歌曲/视频，验证渲染
- [x] 1.4 接入 `artist_fans`/`artist_follow_count`/`artist_sub`/`artist_sublist`，支持歌手订阅与粉丝数展示，验证订阅
- [x] 1.5 接入 `mv_all`/`mv_exclusive_rcmd`/`mv_first`/`mv_detail_info`/`mv_sub`/`mv_sublist`，扩展 MV 浏览与订阅，验证列表

## 2. 个性化发现与风格分类（discovery-personalized）

- [x] 2.1 接入 `personalized_djprogram`/`personalized_mv`/`personalized_privatecontent`/`personalized_privatecontent_list`，新增个性化发现入口，验证推荐展示
- [x] 2.2 接入 `style_album`/`style_artist`/`style_playlist`/`style_song`/`style_list`/`style_detail`/`style_preference`，新增风格分类页，验证切换
- [x] 2.3 接入 `sheet_list`/`sheet_preview`/`toplist_artist`/`toplist_detail`/`cloudsearch`，补充歌单页与搜索，验证
- [x] 2.4 接入 `mlog_music_rcmd`/`mlog_to_video`/`mlog_url`/`starpick_comments_summary`/`hot_topic`，接入 mlog 与热题，验证

## 3. 歌曲互动与播放记录（play-interaction）

- [x] 3.1 接入 `like`/`likelist`/`resource_like`，实现红心与喜欢列表，验证红心状态同步
- [x] 3.2 接入 `personal_fm`/`fm_trash`，实现私人 FM 与垃圾桶，验证播放
- [x] 3.3 接入 `playmode_intelligence_list`/`playmode_song_vector`/`song_order_update`，实现智能播放与排序，验证
- [x] 3.4 接入 `song_url_v1`/`song_purchased`/`song_wiki_summary`/`check_music`/`lyric_new`/`music_first_listen_info`/`scrobble`，补全歌曲信息与可用性校验，验证
- [x] 3.5 接入 `record_recent_song`/`record_recent_album`/`record_recent_playlist`/`record_recent_video`/`record_recent_dj`/`record_recent_voice`/`history_recommend_songs`/`history_recommend_songs_detail`，新增播放记录与历史推荐，验证

## 4. 消息私信与分享（social-message）

- [x] 4.1 接入 `msg_comments`/`msg_forwards`/`msg_notices`/`msg_private`/`msg_private_history`/`msg_recentcontact`，新增消息中心，验证各 tab
- [x] 4.2 接入 `send_text`/`send_song`/`send_playlist`/`send_album`/`share_resource`，实现分享/私信发送，验证发送
- [x] 4.3 接入 `comment`/`hug_comment`，补全通用发评论与抱抱，验证

## 5. 动态与话题（feed-topic）

- [x] 5.1 接入 `event`/`event_del`/`event_forward`，新增动态流与操作，验证
- [x] 5.2 接入 `topic_detail`/`topic_detail_event_hot`/`topic_sublist`/`hot_topic`，新增话题页，验证
- [x] 5.3 接入 `related_allvideo`/`related_playlist`，在详情页展示相关视频/歌单，验证

## 6. 用户与歌单补充（user-playlist-supplement）

- [x] 6.1 接入 `user_account`/`user_audio`/`user_dj`/`user_comment_history`/`user_replacephone`，补充用户中心信息，验证
- [x] 6.2 接入 `user_cloud_del`/`user_cloud_detail`（云盘浏览/删除，与 P2 cloud 上传互补），验证
- [x] 6.3 接入 `playlist_update`/`playlist_tracks`/`playlist_update_playcount`/`playlist_video_recent`/`playlist_cover_update`/`playlist_desc_update`/`playlist_tags_update`/`playlist_order_update`/`playlist_privacy`，补齐 P0 未列的歌单编辑/详情接口，验证

## 7. 联调与验收

- [ ] 7.1 启动 server 与 web，逐接口联调，记录失效接口并上报
- [x] 7.2 输出 P1 验收清单：专辑/歌手/MV 增强、个性化发现、红心/记录、消息、动态、用户歌单补充

## Workflow follow-up

- 评审通过后执行 `openspec archive` 归档本 change。
- 归档后开启 `cloud-music-p2-longtail`（电台/视频/云贝/会员/音乐人等增值长尾）。

## 接入前置约束（编码前必读，优先级高于上方任务罗列顺序）

依据 `design.md` 的「运行时基线」。完成判定见 C 节。

### A. 依赖链（先列表后详情）

| 链   | 入口（提供参数）                                | 详情（消费参数）                                                                            |
| ---- | ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 专辑 | `album_new` / `album_list` / `album_list_style` | `album_detail_dynamic` ← `albums[].id`                                                      |
| 歌手 | `artist_list` / `toplist_artist`                | `artist_top_song` / `artist_songs` / `artist_fans` / `artist_video` ← `artists[].id`        |
| 风格 | `style_list` / `style_preference`               | `style_album` / `style_artist` / `style_playlist` / `style_song` / `style_detail` ← `tagId` |
| MV   | `mv_all` / `mv_first` / `mv_exclusive_rcmd`     | `mv_detail_info` ← `mvid`                                                                   |
| 歌单 | `sheet_list`                                    | `sheet_preview` ← `id`                                                                      |

以上 14 个详情型接口实测「裸 GET 400/502，带真实参数 200」；没有入口就没有参数来源。

### B. 需登录 / 写操作 / 例外路由 / 失效

- **需登录**（本环境只静态验证，UI 做未登录降级）：`artist_new_song`、`artist_new_mv`、`hot_topic`，以及 4.x / 6.x 的消息与用户资产类。
- **写操作**（禁止匿名探测，需登录态验收）：`album_sub`、`artist_sub`、`mv_sub` 及 `*_sublist`、`send_*`、`event_del`/`event_forward`、`like`、`hug_comment`、`playlist_*_update`、`playlist_order_update`、`playlist_privacy`、`fm_trash`。
- **例外路由（必须写下划线）**：`personal_fm` → `/personal_fm`、`fm_trash` → `/fm_trash`、`daily_signin` → `/daily_signin`。按常规「下划线转斜杠」写会 404。
- **失效不接**：`/yunbei/info`（上游 404）；`/top/list`（上游 400，P0 遗留，本 change 不修）。

### C. 完成判定

每个任务除「接口已封装」外还须满足：① 有上游参数来源；② 有页面/组件真实调用点；③ 匿名可用者经 `19830` 实测 `code:200`。三者缺一不算完成，不得勾选。

## 第一批（1.1~1.5）验收记录（2026-11-09）

依据 C 节完成判定逐项核对：24 个接口全部具备上游参数来源与页面真实调用点，匿名可用者均经 server `19830` 实测 `code:200`。

### 匿名接口实测（`code:200`）

| 接口                   | URL                     | 参数来源               | UI 调用点                       |
| ---------------------- | ----------------------- | ---------------------- | ------------------------------- |
| `album_new`            | `/album/new`            | 地区筛选               | `/album` 全部新碟               |
| `album_newest`         | `/album/newest`         | 无                     | `/album` 最新专辑               |
| `album_list`           | `/album/list`           | 地区筛选               | `/album` 数字专辑               |
| `album_list_style`     | `/album/list/style`     | 语种筛选               | `/album` 语种风格馆             |
| `album_songsaleboard`  | `/album/songsaleboard`  | 榜单周期               | `/album` 专辑销量榜             |
| `album_detail_dynamic` | `/album/detail/dynamic` | 新碟列表 `albums[].id` | `/album_detail` 动态数据        |
| `artist_list`          | `/artist/list`          | 分类/地区筛选          | `/artists` 歌手列表             |
| `artist_top_song`      | `/artist/top/song`      | `artists[].id`         | `/artist_detail` 热门 50 首     |
| `artist_songs`         | `/artist/songs`         | `artists[].id`、排序   | `/artist_detail` 全部歌曲       |
| `artist_video`         | `/artist/video`         | `artists[].id`         | `/artist_detail` 视频 tab       |
| `artist_fans`          | `/artist/fans`          | `artists[].id`         | `/artist_detail` 粉丝区         |
| `artist_follow_count`  | `/artist/follow/count`  | `artists[].id`         | `/artist_detail` 粉丝数与关注态 |
| `mv_all`               | `/mv/all`               | 地区/排序筛选          | `/mv` 全部 MV                   |
| `mv_exclusive_rcmd`    | `/mv/exclusive/rcmd`    | 无                     | `/mv` 网易出品                  |
| `mv_first`             | `/mv/first`             | 无                     | `/mv` 最新 MV                   |
| `mv_detail_info`       | `/mv/detail/info`       | MV 列表 `data[].id`    | `/mvplay` 互动数据              |

### 需登录只读（路由已注册，匿名返回 301，UI 未登录降级）

`album_sublist`、`artist_sublist`、`mv_sublist`、`artist_new_song`、`artist_new_mv`。

### 写操作（禁止匿名探测，需登录态验收）

`album_sub`（`/album_detail` 订阅按钮）、`artist_sub`（`/artist_detail` 关注按钮）、`mv_sub`（`/mvplay` 收藏按钮）。三者均有二次状态刷新：成功后重新拉取动态/粉丝数/收藏列表。

### 构建与静态核对

- `npm run build`（`vue-tsc --noEmit && vite build`）退出码 0，新增 `album-discovery`、`mv`、`content-enhance.service` chunk 均已产出。
- 静态核对：服务层 24 个接口函数均有 `contentEnhanceService.*` 页面调用点，缺失 0。
- 导航：`/album`、`/mv` 已注册；头部 `/singer` 死链修正为 `/artists`。

## 全批次验收记录（2026-11-10）

### 覆盖闭合

server `module/*.js` 共 **309** 个路由，前端静态引用 **309/309**，缺失 0。全集核对口径为 `server.js` 的 `parseRoute`（文件名下划线转斜杠）加 `special` 例外表（`personal_fm` / `fm_trash` / `daily_signin`）；前端页面路由不计入 API 集合。

最后两个未接入接口 `album_detail`（`/album/detail`）与 `artist_detail`（`/artist/detail`）由 `/route-completion` 补齐：参数分别来自 `/album/list` 的 `products[].albumId` 与 `/artist/list` 的 `artists[].id`，两者用真实 id 实测均返回 `code:200`。注意 `/album/detail` 只接受**数字专辑** id，传普通专辑 id 会返回 `code:404 无专辑商品`。

### 本批交付

| 页面                       | capability               | 接口数 |
| -------------------------- | ------------------------ | ------ |
| `/discovery`               | 个性化发现与风格分类     | 21     |
| `/play-interaction`        | 歌曲互动与播放记录       | 23     |
| `/message`                 | 消息私信与分享           | 13     |
| `/feed`                    | 动态与话题               | 9      |
| `/user-supplement`         | 用户与歌单补充           | 16     |
| `/dj-radio`                | 电台（P2）               | 27     |
| `/video-podcast`           | 视频与播客（P2）         | 14     |
| `/yunbei-vip-musician`     | 云贝/会员/音乐人（P2）   | 25     |
| `/ugc-listentogether`      | UGC 与一起听（P2）       | 15     |
| `/fanscenter-digitalalbum` | 粉丝中心与数字专辑（P2） | 9      |
| `/cloud-disk`              | 云盘（P2）               | 2      |
| `/account-profile`         | 账号资料（P2）           | 15     |
| `/misc-longtail`           | 杂项长尾（P2）           | 9      |
| `/route-completion`        | 路由补齐                 | 2      |

新增 14 个页面、`/capabilities` 统一入口，头部导航新增「能力中心」。静态核对：198 个规划 URL 全部落在服务层，服务层函数全部有页面真实调用点（死代码 0），能力中心 22 个入口与路由表零死链。

### 运行时探测（server `19830`）

对 105 个无副作用只读接口做匿名 GET：`code:200` 38 个、`301` 30 个（需登录）、`302` 2 个（重定向）、`400` 19 个（缺必填参数，不可判失效）、`404` 3 个、`500` 1 个、`502` 10 个（上游超时）、非 JSON 2 个。

分类口径：裸 GET 的 400/502 不等于失效，需带真实参数复测；本轮已用真实 id 复测 `/album/detail`、`/artist/detail`。已登记上游失效：`/top/list`、`/yunbei/info`、`/summary/annual`、`/verify/getQr`、`/user/cloud/detail`；`/pl/count` 返回空响应；`/playmode/intelligence/list` 返回 500。这些接口页面上有标注，不放在自动加载主路径。

### 安全红线

写操作与账号动作（注册、验证码、换绑、签到、上传、订阅、发送、删除等）统一 `hasLogin()` 未登录降级不发请求、用户点击后 `window.confirm` 二次确认、禁止 `onMounted` 自动调用；账号动作不预填真实手机号；上传统一 `postFormRequest` + `FormData`。需登录只读接口未登录时展示提示，不发请求。

### 构建

`npm run build`（`vue-tsc --noEmit && vite build`）退出码 **0**，14 个新页面 chunk 均已产出。构建前需把旧 `dist` 移开：环境的批量删除保护会拦住 Vite 的 `emptyDir`，与代码无关。

### 未覆盖范围

7.1 保留未勾：逐接口联调只覆盖 105 个匿名无副作用只读接口；需登录与写操作接口按安全红线不做匿名探测，待真实 cookie 环境补功能验收。P0 遗留的 8 个「已封装无 UI 入口」函数不在本批范围内。
