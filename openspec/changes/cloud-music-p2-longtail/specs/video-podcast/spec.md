# Spec Delta

## Purpose

提供视频与播客能力：分类、信息流、详情播放、订阅，以及播客列表与上传，补全视频/播客内容形态。

## ADDED Requirements

### Requirement: 视频发现
系统 SHALL 提供视频分类（`video_category_list`）、分组（`video_group`、`video_group_list`）与信息流（`video_timeline_all`、`video_timeline_recommend`）。

#### Scenario: 浏览视频流
- **WHEN** 用户进入视频页
- **THEN** 系统调用 `video_timeline_recommend` 展示推荐视频

### Requirement: 视频播放与订阅
系统 SHALL 提供视频详情（`video_detail`、`video_detail_info`）、播放地址（`video_url`）与订阅（`video_sub`）。

#### Scenario: 播放视频
- **WHEN** 用户点击视频
- **THEN** 系统调用 `video_url` 获取播放地址并播放

### Requirement: 播客
系统 SHALL 提供播客列表与搜索（`voicelist_list`、`voicelist_list_search`、`voicelist_search`）、播客详情（`voice_detail`）与上传（`voice_upload`）。

#### Scenario: 搜索播客
- **WHEN** 用户输入播客关键词
- **THEN** 系统调用 `voicelist_search` 返回播客结果
