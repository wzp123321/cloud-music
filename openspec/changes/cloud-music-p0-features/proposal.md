# Proposal: 补齐网易云前端 P0 核心功能

## Why

`cloud-music-web` 当前仅接入 309 个可用接口中的 25 个，产品处于"能看详情、不能用的骨架"状态：首页只有 banner+搜索+排行榜入口，缺推荐流；歌单只能看详情不能创建/收藏/编辑；无用户中心；评论只有基础列表。需在停更风险可控的前提下补齐 P0 核心功能，使产品具备基本可用性。

## What Changes

- 修复 `portal.service.ts` 中专辑详情路由拼写 bug（`/ablum_detail` → `/album_detail`），并全局修正 `ablum` → `album` 拼写；清理 `pc.service` 中未调用的 `getSongUrlByIds` 死代码。
- 新增首页推荐流与排行榜模块：接入 `homepage_block_page`、`homepage_dragon_ball`、`personalized`(6)、`recommend_resource`、`recommend_songs`、`top_list`、`top_playlist_highquality`、`toplist`、`top_song`、`top_mv`。
- 新增歌单生态：接入 `playlist_create`/`delete`/`subscribe`/`subscribers`/`track_add`/`track_delete`/`catlist`/`hot`/`highquality_tags`/`update*`/`privacy`/`order_update`/`cover_update`/`desc_update`/`name_update`/`tags_update`/`mylike`/`detail_dynamic`/`track_all`/`video_recent`，支持创建/收藏/编辑/分类。
- 新增用户中心与登录增强：接入 `user_detail`/`user_playlist`/`user_follows`/`user_followeds`/`user_level`/`user_record`/`user_event`/`user_subcount`/`user_cloud`/`user_update`/`user_binding` 及 `login_qr_key`/`login_qr_create`/`login_qr_check`/`login_refresh`/`login_status`。
- 搜索增强与评论互动：接入 `search_hot`/`search_hot_detail`/`search_suggest`/`search_multimatch`；`comment_like`/`comment_hot`/`comment_floor`/`comment_new`/`comment_music`/`comment_album`/`comment_dj`/`comment_video`/`comment_event`/`comment_hug_list`；`simi_song`/`simi_playlist`/`simi_artist`/`simi_mv`/`simi_user`。

## Capabilities

### New Capabilities

- `home-recommendation`：首页推荐流 + 排行榜 + 金刚区
- `playlist-management`：歌单创建/收藏/编辑/分类/订阅
- `user-center`：用户中心（资料/歌单/关注/等级/云盘/动态）+ 登录增强（二维码/刷新/状态）
- `search-enhancement`：热搜、搜索建议、多重匹配
- `comment-interaction`：评论点赞/热评/楼层/发评 + 相似推荐

### Modified Capabilities

（无，项目此前未建立 spec）

## Impact

- 代码：仅 `cloud-music-web` 前端（`src/pages`、`src/services`、`src/components/cm-*`、`src/router`、`src/views`），`cloud-music-server` 接口已就绪无需改动。
- 依赖：复用既有 axios/services 层与组件，无新增运行时依赖。
- 风险：原 NeteaseCloudMusicApi 已停止维护，部分 eapi 加密接口可能失效；每个接口接入前需先联调验证。
- 兼容性：全为新增/扩展页面与组件，不破坏现有功能。

## 接口覆盖核对

以下接口前端 `cloud-music-web` 此前已接入（属已用 25 个），**不计入本次净新增**，仅澄清避免重复统计：`album`(album_detail)、`top_album`、`top_artists`、`comment_mv`、`comment_playlist`。

修正后口径：server 全量 309，前端已用 25，本次 P0 净新增约 63 个接口（规划点 68 扣除上述 5 个已用）。剩余 221 个未用接口由 `cloud-music-p1-enhancement` 与 `cloud-music-p2-longtail` 两个 change 覆盖。
