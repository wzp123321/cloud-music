# Tasks

## 1. 专辑/歌手/MV 增强（content-detail-enhancement）

- [ ] 1.1 接入 `album_new`/`album_newest`/`album_list`/`album_list_style`/`album_songsaleboard`，新增新碟/榜单/风格浏览，验证专辑列表展示
- [ ] 1.2 接入 `album_detail_dynamic`/`album_sub`/`album_sublist`，在专辑详情页展示动态数据并支持订阅，验证订阅状态
- [ ] 1.3 接入 `artist_list`/`artist_top_song`/`artist_songs`/`artist_new_song`/`artist_new_mv`/`artist_video`，扩展歌手页热门歌曲/视频，验证渲染
- [ ] 1.4 接入 `artist_fans`/`artist_follow_count`/`artist_sub`/`artist_sublist`，支持歌手订阅与粉丝数展示，验证订阅
- [ ] 1.5 接入 `mv_all`/`mv_exclusive_rcmd`/`mv_first`/`mv_detail_info`/`mv_sub`/`mv_sublist`，扩展 MV 浏览与订阅，验证列表

## 2. 个性化发现与风格分类（discovery-personalized）

- [ ] 2.1 接入 `personalized_djprogram`/`personalized_mv`/`personalized_privatecontent`/`personalized_privatecontent_list`，新增个性化发现入口，验证推荐展示
- [ ] 2.2 接入 `style_album`/`style_artist`/`style_playlist`/`style_song`/`style_list`/`style_detail`/`style_preference`，新增风格分类页，验证切换
- [ ] 2.3 接入 `sheet_list`/`sheet_preview`/`toplist_artist`/`toplist_detail`/`cloudsearch`，补充歌单页与搜索，验证
- [ ] 2.4 接入 `mlog_music_rcmd`/`mlog_to_video`/`mlog_url`/`starpick_comments_summary`/`hot_topic`，接入 mlog 与热题，验证

## 3. 歌曲互动与播放记录（play-interaction）

- [ ] 3.1 接入 `like`/`likelist`/`resource_like`，实现红心与喜欢列表，验证红心状态同步
- [ ] 3.2 接入 `personal_fm`/`fm_trash`，实现私人 FM 与垃圾桶，验证播放
- [ ] 3.3 接入 `playmode_intelligence_list`/`playmode_song_vector`/`song_order_update`，实现智能播放与排序，验证
- [ ] 3.4 接入 `song_url_v1`/`song_purchased`/`song_wiki_summary`/`check_music`/`lyric_new`/`music_first_listen_info`/`scrobble`，补全歌曲信息与可用性校验，验证
- [ ] 3.5 接入 `record_recent_song`/`record_recent_album`/`record_recent_playlist`/`record_recent_video`/`record_recent_dj`/`record_recent_voice`/`history_recommend_songs`/`history_recommend_songs_detail`，新增播放记录与历史推荐，验证

## 4. 消息私信与分享（social-message）

- [ ] 4.1 接入 `msg_comments`/`msg_forwards`/`msg_notices`/`msg_private`/`msg_private_history`/`msg_recentcontact`，新增消息中心，验证各 tab
- [ ] 4.2 接入 `send_text`/`send_song`/`send_playlist`/`send_album`/`share_resource`，实现分享/私信发送，验证发送
- [ ] 4.3 接入 `comment`/`hug_comment`，补全通用发评论与抱抱，验证

## 5. 动态与话题（feed-topic）

- [ ] 5.1 接入 `event`/`event_del`/`event_forward`，新增动态流与操作，验证
- [ ] 5.2 接入 `topic_detail`/`topic_detail_event_hot`/`topic_sublist`/`hot_topic`，新增话题页，验证
- [ ] 5.3 接入 `related_allvideo`/`related_playlist`，在详情页展示相关视频/歌单，验证

## 6. 用户与歌单补充（user-playlist-supplement）

- [ ] 6.1 接入 `user_account`/`user_audio`/`user_dj`/`user_comment_history`/`user_replacephone`，补充用户中心信息，验证
- [ ] 6.2 接入 `user_cloud_del`/`user_cloud_detail`（云盘浏览/删除，与 P2 cloud 上传互补），验证
- [ ] 6.3 接入 `playlist_update`/`playlist_tracks`/`playlist_update_playcount`/`playlist_video_recent`/`playlist_cover_update`/`playlist_desc_update`/`playlist_tags_update`/`playlist_order_update`/`playlist_privacy`，补齐 P0 未列的歌单编辑/详情接口，验证

## 7. 联调与验收

- [ ] 7.1 启动 server 与 web，逐接口联调，记录失效接口并上报
- [ ] 7.2 输出 P1 验收清单：专辑/歌手/MV 增强、个性化发现、红心/记录、消息、动态、用户歌单补充

## Workflow follow-up

- 评审通过后执行 `openspec archive` 归档本 change。
- 归档后开启 `cloud-music-p2-longtail`（电台/视频/云贝/会员/音乐人等增值长尾）。
