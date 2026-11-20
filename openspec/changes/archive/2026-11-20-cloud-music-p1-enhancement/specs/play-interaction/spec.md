# Spec Delta

## Purpose

补全听歌互动闭环：红心/喜欢、私人 FM、智能播放、歌曲信息校验与播放记录，使播放体验从"能放"到"可管理、可回看"。

## ADDED Requirements

### Requirement: 红心与喜欢列表
系统 SHALL 支持对歌曲/资源红心（`like`、`resource_like`）并展示喜欢列表（`likelist`）。

#### Scenario: 红心歌曲
- **WHEN** 用户点击歌曲红心
- **THEN** 系统调用 `like` 并同步 `likelist` 状态

### Requirement: 私人 FM
系统 SHALL 提供私人 FM 播放（`personal_fm`）与垃圾桶（`fm_trash` 将歌曲移出推荐）。

#### Scenario: 播放私人 FM
- **WHEN** 用户点击私人 FM
- **THEN** 系统调用 `personal_fm` 进入连续推荐播放

### Requirement: 智能播放与排序
系统 SHALL 提供智能播放列表（`playmode_intelligence_list`）、歌曲向量（`playmode_song_vector`）与手动排序（`song_order_update`）。

#### Scenario: 智能播放
- **WHEN** 用户开启智能播放
- **THEN** 系统调用 `playmode_intelligence_list` 生成接续歌曲

### Requirement: 歌曲信息与可用性校验
系统 SHALL 提供歌曲扩展信息（`song_url_v1`、`song_purchased`、`song_wiki_summary`、`music_first_listen_info`、`lyric_new`）与可用性校验（`check_music`）、播放记录上报（`scrobble`）。

#### Scenario: 校验歌曲可用
- **WHEN** 点击播放某歌曲
- **THEN** 系统调用 `check_music` 校验版权可用性，不可用则提示

### Requirement: 播放记录与历史推荐
系统 SHALL 记录并展示最近播放（`record_recent_song`/`album`/`playlist`/`video`/`dj`/`voice`）与历史推荐（`history_recommend_songs`、`history_recommend_songs_detail`）。

#### Scenario: 查看最近播放
- **WHEN** 用户打开最近播放
- **THEN** 系统调用 `record_recent_song` 等展示各类最近记录
