# Spec Delta

## Purpose

让用户能够创建、收藏、编辑与管理歌单，以及浏览歌单分类与精品歌单，补全当前仅能查看歌单详情的能力缺口。

## ADDED Requirements

### Requirement: 歌单创建与删除
系统 SHALL 允许用户创建歌单（`playlist_create`）并删除自建歌单（`playlist_delete`）。

#### Scenario: 创建歌单
- **WHEN** 用户点击"新建歌单"并填写名称
- **THEN** 系统调用 `playlist_create` 并在列表中显示新歌单

### Requirement: 歌单订阅与收藏
系统 SHALL 支持订阅/取消订阅歌单（`playlist_subscribe`）、查看收藏者（`playlist_subscribers`）、我的收藏歌单（`playlist_mylike`）。

#### Scenario: 收藏歌单
- **WHEN** 用户点击歌单"收藏"
- **THEN** 系统调用 `playlist_subscribe` 并刷新收藏状态

### Requirement: 歌单编辑
系统 SHALL 允许用户编辑歌单名称（`playlist_name_update`）、描述（`playlist_desc_update`）、标签（`playlist_tags_update`）、封面（`playlist_cover_update`）、隐私（`playlist_privacy`）、歌曲顺序（`playlist_order_update`）。

#### Scenario: 修改歌单名
- **WHEN** 用户在编辑页修改名称并提交
- **THEN** 系统调用 `playlist_name_update` 并更新显示

### Requirement: 歌单歌曲增删
系统 SHALL 支持向歌单添加歌曲（`playlist_track_add`）与移除歌曲（`playlist_track_delete`），并获取全部歌曲（`playlist_track_all`）。

#### Scenario: 添加歌曲到歌单
- **WHEN** 用户选择歌曲并"添加到歌单"
- **THEN** 系统调用 `playlist_track_add` 并刷新歌单歌曲数

### Requirement: 歌单分类与精品
系统 SHALL 提供歌单分类浏览（`playlist_catlist`、`playlist_hot`）、精品歌单标签（`playlist_highquality_tags`）、精品歌单列表，并展示歌单动态数据（`playlist_detail_dynamic` 播放量/收藏数）。

#### Scenario: 浏览分类歌单
- **WHEN** 用户选择某分类
- **THEN** 系统调用 `playlist_catlist` 展示该分类下歌单
