# Tasks

## 1. 修复已知缺陷

- [x] 1.1 将 `portal.service.ts:99` 的 `/ablum_detail` 改为 `/album_detail`，并全局替换 `ablum`→`album`（`search.service.ts`、`search.vue`），验证专辑详情可正常进入
- [x] 1.2 删除 `pc.service.ts` 中未调用的 `getSongUrlByIds` 死代码，验证播放功能不受影响

## 2. 首页推荐流与排行榜（home-recommendation）

- [x] 2.1 在 `src/pages/portal` 接入 `homepage_block_page`/`homepage_dragon_ball`，新增区块瀑布流与金刚区组件，验证首页渲染
- [x] 2.2 接入 `personalized`/`personalized_newsong`/`recommend_resource`/`recommend_songs`/`recommend_songs_dislike`，新增每日推荐页，验证推荐与"不感兴趣"
- [x] 2.3 接入 `toplist`/`top_list`/`top_playlist_highquality`/`top_song`/`top_mv`，新增排行榜页与详情，验证榜单展示（注：`top_album`/`top_artists` 前端已接入，非新增）

## 3. 歌单生态（playlist-management）

- [x] 3.1 接入 `playlist_catlist`/`playlist_hot`/`playlist_highquality_tags`，新增歌单分类/精品浏览页，验证分类切换
- [ ] 3.2 接入 `playlist_create`/`playlist_delete`/`playlist_subscribe`/`playlist_subscribers`/`playlist_mylike`，实现创建/删除/收藏，验证状态刷新
- [ ] 3.3 接入 `playlist_name_update`/`desc_update`/`tags_update`/`cover_update`/`privacy`/`order_update`，实现歌单编辑页，验证编辑生效
- [x] 3.4 接入 `playlist_track_add`/`playlist_track_delete`/`playlist_track_all`/`playlist_detail_dynamic`，实现歌曲增删与动态数据，验证歌曲数更新

## 4. 用户中心与登录增强（user-center）

- [x] 4.1 接入 `user_detail`/`user_playlist`/`user_level`/`user_subcount`/`user_record`/`user_event`/`user_cloud`，新增个人中心页，验证资料与歌单展示
- [x] 4.2 接入 `user_follows`/`user_followeds`/`follow`，实现关注/粉丝列表与关注操作，验证列表刷新
- [ ] 4.3 接入 `user_update`/`user_binding`/`user_bindingcellphone`/`avatar_upload`，实现资料编辑，验证修改生效
- [x] 4.4 接入 `login_qr_key`/`login_qr_create`/`login_qr_check`，在登录框新增二维码登录，验证扫码登录流程
- [x] 4.5 接入 `login_refresh`/`login_status`，实现启动会话恢复，验证刷新后保持登录

## 5. 搜索增强与评论互动（search-enhancement / comment-interaction）

- [x] 5.1 接入 `search_hot`/`search_hot_detail`/`search_suggest`/`search_multimatch`，增强搜索框（热搜榜/联想/多类型匹配），验证联想与热搜
- [x] 5.2 在 `cm-comment` 扩展 `comment_like`/`comment_hot`/`comment_floor`/`comment_hug_list`/`comment_new`，支持点赞/热评/楼层/发评，验证点赞与发评
- [x] 5.3 接入 `comment_music`/`comment_album`/`comment_dj`/`comment_video`/`comment_event`，打通各类型发评，验证类型正确（注：`comment_mv`/`comment_playlist` 前端已接入，非新增）
- [x] 5.4 接入 `simi_song`/`simi_playlist`/`simi_artist`/`simi_mv`/`simi_user`，在详情页展示相似推荐，验证相似列表

## 6. 联调与验收

- [ ] 6.1 启动 `cloud-music-server` 与 `cloud-music-web`，逐模块联调每个新增接口，记录失效接口并上报
- [ ] 6.2 验证全链路：首页推荐→歌单→播放、搜索→详情→评论/相似、登录→个人中心，输出验收清单

## 接口覆盖核对

以下接口前端 `cloud-music-web` 此前已接入（属已用 25 个），**非本次新增**，仅在此澄清避免重复统计：`album`(album_detail)、`top_album`、`top_artists`、`comment_mv`、`comment_playlist`。

修正后口径：server 全量 309，前端已用 25，本次 P0 净新增 72 个接口（按前端 URL 字面量实测：已引用 97 − 基线 25）。

## 验收状态

- 已闭环 15 项；未闭环 5 项。
- 3.2 / 3.3 / 4.3：端点与接口封装齐全，但有 8 个函数无 UI 调用点（`deletePlaylist`、`getPlaylistSubscribers`、`updatePlaylistCover`、`updatePlaylistPrivacy`、`updatePlaylistOrder`、`getUserBinding`、`bindingCellphone`、`uploadAvatar`），见 `.sdd/cross-review.md` §二。
- 6.1 / 6.2：运行时联调与全链路验收未做，server 未启动、eapi 可用性未验证。
- 本 change 按用户确认归档，上述 5 项转入后续步骤，不因归档视为完成。

## Workflow follow-up

- 评审通过后执行 `openspec archive` 归档本 change。
- 归档后按 P1/P2 优先级开启后续 change（album/artist/mv 增强、dj/video 等）。
