# Spec Delta

## Purpose

提供消息中心、私信、分享与评论补充，补全社交互动能力，使产品具备基础社区沟通形态。

## ADDED Requirements

### Requirement: 消息中心
系统 SHALL 聚合消息类型（`msg_comments` 评论、`msg_forwards` 转发、`msg_notices` 通知、`msg_private` 私信、`msg_private_history` 私信历史、`msg_recentcontact` 最近联系）。

#### Scenario: 查看消息
- **WHEN** 用户打开消息中心
- **THEN** 系统调用 `msg_notices` 等按 tab 展示各类消息

### Requirement: 分享与私信发送
系统 SHALL 支持分享资源（`share_resource`）、发送私信文本/歌曲/歌单/专辑（`send_text`、`send_song`、`send_playlist`、`send_album`）。

#### Scenario: 分享歌曲
- **WHEN** 用户点击分享歌曲
- **THEN** 系统调用 `send_song` 将歌曲发送给指定好友

### Requirement: 评论补充
系统 SHALL 提供通用发评论（`comment`）与评论抱抱（`hug_comment`）。

#### Scenario: 发布评论
- **WHEN** 用户在资源下发布评论
- **THEN** 系统调用 `comment` 提交并显示
