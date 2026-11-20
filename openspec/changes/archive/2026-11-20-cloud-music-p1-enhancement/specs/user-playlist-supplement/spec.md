# Spec Delta

## Purpose

补全 P0 `user-center` 与 `playlist-management` 未覆盖的用户与歌单接口，使个人中心与歌单编辑能力完整。

## ADDED Requirements

### Requirement: 用户补充
系统 SHALL 提供账户信息（`user_account`）、音频/电台足迹（`user_audio`、`user_dj`）、评论历史（`user_comment_history`）、换绑手机（`user_replacephone`）、云盘浏览与删除（`user_cloud_detail`、`user_cloud_del`）。

#### Scenario: 查看云盘
- **WHEN** 用户进入云盘
- **THEN** 系统调用 `user_cloud_detail` 展示已上传文件，支持 `user_cloud_del` 删除

### Requirement: 歌单补充
系统 SHALL 补全歌单编辑与详情接口（`playlist_update`、`playlist_tracks`、`playlist_update_playcount`、`playlist_video_recent`、`playlist_cover_update`、`playlist_desc_update`、`playlist_tags_update`、`playlist_order_update`、`playlist_privacy`）。

#### Scenario: 编辑歌单隐私
- **WHEN** 用户修改歌单隐私设置
- **THEN** 系统调用 `playlist_privacy` 并更新
