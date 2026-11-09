# Spec Delta

## Purpose

提供个性化发现入口、风格分类浏览、搜索补充与 mlog，丰富内容发现路径，使首页之外另有系统化的发现渠道。

## ADDED Requirements

### Requirement: 个性化推荐入口
系统 SHALL 提供个性化推荐内容（`personalized_djprogram` 播客、`personalized_mv` MV、`personalized_privatecontent`/`personalized_privatecontent_list` 独家内容）。

#### Scenario: 查看个性化 MV
- **WHEN** 用户点击个性化 MV 入口
- **THEN** 系统调用 `personalized_mv` 展示推荐 MV 列表

### Requirement: 风格分类浏览
系统 SHALL 提供按风格筛选的专辑/歌手/歌单/歌曲（`style_album`、`style_artist`、`style_playlist`、`style_song`），以及风格列表与详情（`style_list`、`style_detail`、`style_preference`）。

#### Scenario: 按风格筛选
- **WHEN** 用户选择某风格
- **THEN** 系统调用 `style_playlist` 展示该风格下歌单

### Requirement: 发现补充与 mlog
系统 SHALL 提供歌单页补充（`sheet_list`、`sheet_preview`）、榜单补充（`toplist_artist`、`toplist_detail`）、云搜索（`cloudsearch`）、mlog（`mlog_music_rcmd`、`mlog_to_video`、`mlog_url`）、精选评论摘要（`starpick_comments_summary`）与热门话题（`hot_topic`）。

#### Scenario: 浏览歌单页
- **WHEN** 用户进入歌单分类页
- **THEN** 系统调用 `sheet_list` 展示歌单列表，`sheet_preview` 提供预览
