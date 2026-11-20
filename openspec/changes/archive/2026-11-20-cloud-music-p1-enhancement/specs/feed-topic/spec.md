# Spec Delta

## Purpose

提供动态流、话题与相关推荐，补全社区形态，使内容之外另有用户共创与讨论入口。

## ADDED Requirements

### Requirement: 动态流
系统 SHALL 展示动态（`event`）并支持删除（`event_del`）与转发（`event_forward`）。

#### Scenario: 查看动态
- **WHEN** 用户进入动态页
- **THEN** 系统调用 `event` 展示动态列表

### Requirement: 话题
系统 SHALL 展示话题详情（`topic_detail`、`topic_detail_event_hot`）、已订阅话题（`topic_sublist`）与热门话题（`hot_topic`）。

#### Scenario: 进入话题
- **WHEN** 用户点击某话题
- **THEN** 系统调用 `topic_detail` 展示话题下动态

### Requirement: 相关推荐
系统 SHALL 在详情页展示相关视频与相关歌单（`related_allvideo`、`related_playlist`）。

#### Scenario: 查看相关歌单
- **WHEN** 用户在歌单详情查看相关
- **THEN** 系统调用 `related_playlist` 展示相似歌单
