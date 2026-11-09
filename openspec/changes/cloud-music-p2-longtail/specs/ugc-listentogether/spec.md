# Spec Delta

## Purpose

提供 UGC 内容查看与一起听实时房间，补全用户共创内容与实时互动玩法。

## ADDED Requirements

### Requirement: UGC 内容
系统 SHALL 提供 UGC 专辑/歌手/歌曲/MV 详情（`ugc_album_get`、`ugc_artist_get`、`ugc_artist_search`、`ugc_detail`、`ugc_mv_get`、`ugc_song_get`）与用户贡献（`ugc_user_devote`）。

#### Scenario: 查看 UGC 歌曲
- **WHEN** 用户进入 UGC 歌曲页
- **THEN** 系统调用 `ugc_song_get` 展示歌曲 UGC 内容

### Requirement: 一起听房间
系统 SHALL 支持创建/加入房间（`listentogether_room_create`、`listentogether_room_check`、`listentogether_status`）、播放指令（`listentogether_play_command`）、心跳（`listentogether_heatbeat`）、同步歌单与列表（`listentogether_sync_playlist_get`、`listentogether_sync_list_command`）与结束（`listentogether_end`）。

#### Scenario: 创建一起听房间
- **WHEN** 用户发起一起听
- **THEN** 系统调用 `listentogether_room_create` 创建房间并返回房间状态
