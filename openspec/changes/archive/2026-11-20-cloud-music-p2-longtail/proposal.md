# Proposal: 补齐网易云前端 P2 增值长尾

## Why

P0 已补齐核心五块、P1 补齐体验增强。剩余未用接口全部属于增值长尾形态：电台、视频、播客、云贝积分、会员成长、音乐人、UGC、一起听、粉丝中心、数字专辑、云盘、账号资料与内部杂项。这些构成产品完整生态的长尾，本 change 集中规划，使 server 端 309 个接口在前端规划层面全部有归属。

## What Changes

- **电台**：`dj_banner`/`dj_catelist`/`dj_category_recommend`/`dj_category_excludehot`/`dj_hot`/`dj_recommend`/`dj_recommend_type`/`dj_personalize_recommend`/`dj_today_perfered`/`dj_detail`/`dj_program`/`dj_program_detail`/`dj_program_toplist`/`dj_program_toplist_hours`/`dj_radio_hot`/`dj_sub`/`dj_sublist`/`dj_subscriber`/`dj_paygift`/`dj_toplist`/`dj_toplist_hours`/`dj_toplist_newcomer`/`dj_toplist_pay`/`dj_toplist_popular`、`program_recommend`、`aidj_content_rcmd`、`audio_match`。
- **视频与播客**：`video_category_list`/`video_detail`/`video_detail_info`/`video_group`/`video_group_list`/`video_sub`/`video_timeline_all`/`video_timeline_recommend`/`video_url`、`voicelist_list`/`voicelist_list_search`/`voicelist_search`、`voice_detail`/`voice_upload`。
- **积分/会员/音乐人**：`yunbei`/`yunbei_info`/`yunbei_expense`/`yunbei_receipt`/`yunbei_sign`/`yunbei_today`/`yunbei_rcmd_song`/`yunbei_rcmd_song_history`/`yunbei_task_finish`/`yunbei_tasks`/`yunbei_tasks_todo`、`vip_info`/`vip_info_v2`/`vip_growthpoint`/`vip_growthpoint_get`/`vip_growthpoint_details`/`vip_tasks`/`vip_timemachine`、`musician_sign`/`musician_tasks`/`musician_tasks_new`/`musician_cloudbean`/`musician_cloudbean_obtain`/`musician_data_overview`/`musician_play_trend`。
- **UGC 与一起听**：`ugc_album_get`/`ugc_artist_get`/`ugc_artist_search`/`ugc_detail`/`ugc_mv_get`/`ugc_song_get`/`ugc_user_devote`、`listentogether_room_create`/`listentogether_room_check`/`listentogether_status`/`listentogether_play_command`/`listentogether_heatbeat`/`listentogether_sync_playlist_get`/`listentogether_sync_list_command`/`listentogether_end`。
- **粉丝中心与数字专辑**：`fanscenter_overview_get`/`fanscenter_basicinfo_age_get`/`fanscenter_basicinfo_gender_get`/`fanscenter_basicinfo_province_get`/`fanscenter_trend_list`、`digitalAlbum_detail`/`digitalAlbum_sales`/`digitalAlbum_ordering`/`digitalAlbum_purchased`。
- **云盘**：`cloud`/`cloud_match`。
- **账号资料**：`verify_getQr`/`verify_qrcodestatus`/`register_anonimous`/`register_cellphone`/`rebind`/`cellphone_existence_check`/`captcha_sent`/`captcha_verify`/`countries_code_list`/`nickname_check`/`activate_init_profile`/`sign_happy_info`/`signin_progress`/`setting`/`daily_signin`。
- **杂项/内部**：`inner_version`/`weblog`/`threshold_detail_get`/`summary_annual`/`creator_authinfo_get`/`pl_count`/`batch`/`get_userids`/`calendar`。

## Capabilities

### New Capabilities

- `dj-radio`：电台全套（分类/推荐/节目/榜单/订阅/主播）
- `video-podcast`：视频与播客（分类/详情/分组/订阅/上传）
- `yunbei-vip-musician`：云贝积分、会员成长、音乐人中心
- `ugc-listentogether`：UGC 内容与一起听房间
- `fanscenter-digitalAlbum`：粉丝中心与数字专辑
- `cloud-disk`：云盘上传与匹配
- `account-profile`：账号注册/绑定/验证/资料
- `misc-longtail`：内部/杂项接口

### Modified Capabilities

（无）

## Impact

- 代码：仅 `cloud-music-web` 前端，新增 `src/pages/radio`、`src/pages/video`、`src/pages/account` 等；`cloud-music-server` 无需改动。
- 依赖：复用既有 axios/services 层与组件，无新增运行时依赖。
- 风险：原 NeteaseCloudMusicApi 已停止维护，长尾接口多为加密接口，失效概率更高；每个接口接入前需先联调验证，集中失效模块及时上报。
- 兼容性：全为新增页面与组件，不破坏现有功能。
