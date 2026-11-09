# Tasks

## 1. 电台（dj-radio）

- [ ] 1.1 接入 `dj_catelist`/`dj_category_recommend`/`dj_category_excludehot`/`dj_banner`/`dj_hot`/`dj_recommend`/`dj_recommend_type`/`dj_personalize_recommend`/`dj_today_perfered`，新增电台首页与分类，验证
- [ ] 1.2 接入 `dj_detail`/`dj_program`/`dj_program_detail`/`dj_program_toplist`/`dj_program_toplist_hours`/`dj_radio_hot`，实现电台详情与节目，验证
- [ ] 1.3 接入 `dj_sub`/`dj_sublist`/`dj_subscriber`/`dj_paygift`/`dj_toplist`/`dj_toplist_hours`/`dj_toplist_newcomer`/`dj_toplist_pay`/`dj_toplist_popular`，实现订阅/榜单/礼物，验证
- [ ] 1.4 接入 `program_recommend`/`aidj_content_rcmd`/`audio_match`，补充节目推荐与音频匹配，验证

## 2. 视频与播客（video-podcast）

- [ ] 2.1 接入 `video_category_list`/`video_group`/`video_group_list`/`video_timeline_all`/`video_timeline_recommend`，新增视频分类与信息流，验证
- [ ] 2.2 接入 `video_detail`/`video_detail_info`/`video_url`/`video_sub`，实现视频播放与订阅，验证
- [ ] 2.3 接入 `voicelist_list`/`voicelist_list_search`/`voicelist_search`/`voice_detail`/`voice_upload`，实现播客列表与上传，验证

## 3. 云贝/会员/音乐人（yunbei-vip-musician）

- [ ] 3.1 接入 `yunbei`/`yunbei_info`/`yunbei_expense`/`yunbei_receipt`/`yunbei_sign`/`yunbei_today`/`yunbei_rcmd_song`/`yunbei_rcmd_song_history`/`yunbei_task_finish`/`yunbei_tasks`/`yunbei_tasks_todo`，实现云贝中心，验证
- [ ] 3.2 接入 `vip_info`/`vip_info_v2`/`vip_growthpoint`/`vip_growthpoint_get`/`vip_growthpoint_details`/`vip_tasks`/`vip_timemachine`，实现会员成长，验证
- [ ] 3.3 接入 `musician_sign`/`musician_tasks`/`musician_tasks_new`/`musician_cloudbean`/`musician_cloudbean_obtain`/`musician_data_overview`/`musician_play_trend`，实现音乐人中心，验证

## 4. UGC 与一起听（ugc-listentogether）

- [ ] 4.1 接入 `ugc_album_get`/`ugc_artist_get`/`ugc_artist_search`/`ugc_detail`/`ugc_mv_get`/`ugc_song_get`/`ugc_user_devote`，实现 UGC 内容查看，验证
- [ ] 4.2 接入 `listentogether_room_create`/`listentogether_room_check`/`listentogether_status`/`listentogether_play_command`/`listentogether_heatbeat`/`listentogether_sync_playlist_get`/`listentogether_sync_list_command`/`listentogether_end`，实现一起听房间，验证

## 5. 粉丝中心与数字专辑（fanscenter-digitalAlbum）

- [ ] 5.1 接入 `fanscenter_overview_get`/`fanscenter_basicinfo_age_get`/`fanscenter_basicinfo_gender_get`/`fanscenter_basicinfo_province_get`/`fanscenter_trend_list`，实现粉丝中心，验证
- [ ] 5.2 接入 `digitalAlbum_detail`/`digitalAlbum_sales`/`digitalAlbum_ordering`/`digitalAlbum_purchased`，实现数字专辑，验证

## 6. 云盘（cloud-disk）

- [ ] 6.1 接入 `cloud`/`cloud_match`，实现云盘上传匹配，验证

## 7. 账号资料（account-profile）

- [ ] 7.1 接入 `verify_getQr`/`verify_qrcodestatus`/`captcha_sent`/`captcha_verify`/`countries_code_list`/`cellphone_existence_check`，实现验证与注册前置，验证（注意：避免误触发真实注册）
- [ ] 7.2 接入 `register_anonimous`/`register_cellphone`/`rebind`/`nickname_check`/`activate_init_profile`/`sign_happy_info`/`signin_progress`/`setting`/`daily_signin`，实现账号资料与签到，验证

## 8. 杂项（misc-longtail）

- [ ] 8.1 接入 `inner_version`/`weblog`/`threshold_detail_get`/`summary_annual`/`creator_authinfo_get`/`pl_count`/`batch`/`get_userids`/`calendar`，实现内部/年度/统计类展示，验证

## 9. 联调与验收

- [ ] 9.1 启动 server 与 web，逐接口联调，记录失效接口并上报（长尾失效概率高）
- [ ] 9.2 输出 P2 验收清单：电台/视频/播客/云贝/会员/音乐人/UGC/一起听/粉丝中心/数字专辑/云盘/账号/杂项

## Workflow follow-up

- 评审通过后执行 `openspec archive` 归档本 change。
- 至此 server 端 309 接口在前端规划层面全部有归属（P0+P1+P2）。
