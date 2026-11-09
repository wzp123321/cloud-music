# Spec Delta

## Purpose

补全评论互动能力与相似内容推荐，使详情页具备社区互动（点赞/热评/楼层/发评）与相关推荐（相似歌曲/歌单/歌手/MV/用户）。

## ADDED Requirements

### Requirement: 评论点赞与热评
系统 SHALL 支持评论点赞（`comment_like`）、查看热门评论（`comment_hot`）、评论楼层（`comment_floor`）、点赞列表（`comment_hug_list`）。

#### Scenario: 点赞评论
- **WHEN** 用户点击评论"赞"
- **THEN** 系统调用 `comment_like` 并更新点赞数

### Requirement: 发布评论
系统 SHALL 支持发布评论（`comment_new`）到歌曲/专辑/歌单/MV/电台/动态（`comment_music`/`comment_album`/`comment_playlist`/`comment_mv`/`comment_dj`/`comment_video`/`comment_event`）。

#### Scenario: 发表歌曲评论
- **WHEN** 用户在歌曲详情填写评论并提交
- **THEN** 系统调用 `comment_new`（类型=歌曲）并追加到列表

### Requirement: 相似内容推荐
系统 SHALL 在详情页展示相似歌曲（`simi_song`）、相似歌单（`simi_playlist`）、相似歌手（`simi_artist`）、相似MV（`simi_mv`）、相似用户（`simi_user`）。

#### Scenario: 歌曲详情相似推荐
- **WHEN** 用户查看歌曲详情
- **THEN** 系统调用 `simi_song` 展示相似歌曲列表
