# Spec Delta

## Purpose

补全专辑、歌手、MV 三类内容详情页的增强数据（新碟、榜单、风格、动态、订阅、粉丝、相似），提升内容页信息密度与互动能力。

## ADDED Requirements

### Requirement: 专辑增强
系统 SHALL 提供新碟与专辑榜单浏览（`album_new`、`album_newest`、`album_list`、`album_list_style`、`album_songsaleboard`），并在专辑详情页展示动态数据（`album_detail_dynamic`）与订阅能力（`album_sub`、`album_sublist`）。

#### Scenario: 浏览新碟
- **WHEN** 用户进入新碟页
- **THEN** 系统调用 `album_new`/`album_newest` 展示最新专辑列表

#### Scenario: 订阅专辑
- **WHEN** 用户在专辑详情点击订阅
- **THEN** 系统调用 `album_sub` 并刷新订阅状态

### Requirement: 歌手增强
系统 SHALL 在歌手页展示热门歌曲与视频（`artist_top_song`、`artist_songs`、`artist_new_song`、`artist_new_mv`、`artist_video`）、歌手列表/相似（`artist_list`）、粉丝数与订阅（`artist_fans`、`artist_follow_count`、`artist_sub`、`artist_sublist`）。

#### Scenario: 查看歌手热门
- **WHEN** 用户进入歌手页
- **THEN** 系统调用 `artist_top_song` 展示热门歌曲，`artist_fans` 展示粉丝数

### Requirement: MV 增强
系统 SHALL 提供 MV 全量/独家/最新浏览（`mv_all`、`mv_exclusive_rcmd`、`mv_first`）、详情信息（`mv_detail_info`）与订阅（`mv_sub`、`mv_sublist`）。

#### Scenario: 浏览 MV 列表
- **WHEN** 用户进入 MV 页
- **THEN** 系统调用 `mv_all` 展示全部 MV，`mv_exclusive_rcmd` 展示独家推荐
