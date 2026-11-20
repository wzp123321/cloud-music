# Proposal: 补齐网易云前端 P1 体验增强

## Why

P0 已补齐首页推荐、歌单生态、用户中心、搜索增强、评论互动五块核心。但以下体验层能力仍缺，直接影响"可用 → 好用"：专辑/歌手/MV 详情页的增强数据（新碟、榜单、订阅、相似）、个性化发现与风格分类入口、红心与播放记录、消息私信、动态话题，以及 P0 未覆盖的用户/歌单补充接口。本 change 补全这些 P1 体验增强。

## What Changes

- **专辑/歌手/MV 增强**：`album_detail_dynamic`/`album_list`/`album_list_style`/`album_new`/`album_newest`/`album_songsaleboard`/`album_sub`/`album_sublist`、`artist_fans`/`artist_follow_count`/`artist_list`/`artist_new_mv`/`artist_new_song`/`artist_songs`/`artist_sub`/`artist_sublist`/`artist_top_song`/`artist_video`、`mv_all`/`mv_detail_info`/`mv_exclusive_rcmd`/`mv_first`/`mv_sub`/`mv_sublist`。
- **个性化发现与风格分类**：`personalized_djprogram`/`personalized_mv`/`personalized_privatecontent`/`personalized_privatecontent_list`、`style_album`/`style_artist`/`style_detail`/`style_list`/`style_playlist`/`style_preference`/`style_song`、`sheet_list`/`sheet_preview`、`toplist_artist`/`toplist_detail`、`cloudsearch`、`mlog_music_rcmd`/`mlog_to_video`/`mlog_url`、`starpick_comments_summary`、`hot_topic`。
- **歌曲互动与播放记录**：`song_order_update`/`song_purchased`/`song_url_v1`/`song_wiki_summary`、`like`/`likelist`/`resource_like`、`fm_trash`/`personal_fm`、`playmode_intelligence_list`/`playmode_song_vector`、`lyric_new`/`check_music`/`music_first_listen_info`/`scrobble`、`record_recent_album`/`record_recent_dj`/`record_recent_playlist`/`record_recent_song`/`record_recent_video`/`record_recent_voice`、`history_recommend_songs`/`history_recommend_songs_detail`。
- **消息私信与分享**：`msg_comments`/`msg_forwards`/`msg_notices`/`msg_private`/`msg_private_history`/`msg_recentcontact`、`send_album`/`send_playlist`/`send_song`/`send_text`、`share_resource`、`comment`/`hug_comment`。
- **动态与话题**：`event`/`event_del`/`event_forward`、`topic_detail`/`topic_detail_event_hot`/`topic_sublist`、`related_allvideo`/`related_playlist`。
- **用户与歌单补充（P0 未覆盖子集）**：`user_account`/`user_audio`/`user_cloud_del`/`user_cloud_detail`/`user_comment_history`/`user_dj`/`user_replacephone`、`playlist_cover_update`/`playlist_desc_update`/`playlist_order_update`/`playlist_privacy`/`playlist_tags_update`/`playlist_tracks`/`playlist_update`/`playlist_update_playcount`/`playlist_video_recent`。

## Capabilities

### New Capabilities

- `content-detail-enhancement`：专辑/歌手/MV 详情页增强数据（新碟、榜单、订阅、相似、粉丝）
- `discovery-personalized`：个性化发现、风格分类、搜索补充、mlog
- `play-interaction`：红心/喜欢、私人 FM、智能播放、播放记录、历史推荐
- `social-message`：消息中心、私信、分享、评论补充
- `feed-topic`：动态、话题、相关推荐
- `user-playlist-supplement`：用户与歌单的补充能力（P0 未覆盖部分）

### Modified Capabilities

（无，项目此前未建立 spec；与 P0 的 `user-center`/`playlist-management` 为互补而非修改）

## Impact

- 代码：仅 `cloud-music-web` 前端（`src/pages`、`src/services`、`src/components/cm-*`、`src/router`），`cloud-music-server` 接口已就绪无需改动。
- 依赖：复用既有 axios/services 层与组件，无新增运行时依赖。
- 风险：原 NeteaseCloudMusicApi 已停止维护，部分 eapi 加密接口可能失效；每个接口接入前需先联调验证。
- 兼容性：全为新增/扩展页面与组件，不破坏现有功能。
