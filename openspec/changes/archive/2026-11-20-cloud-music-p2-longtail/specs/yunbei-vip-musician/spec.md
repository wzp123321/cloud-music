# Spec Delta

## Purpose

提供云贝积分、会员成长、音乐人中心三大增值体系，使产品具备账号增值与创作者生态。

## ADDED Requirements

### Requirement: 云贝积分
系统 SHALL 展示云贝总额与信息（`yunbei`、`yunbei_info`）、收支（`yunbei_expense`、`yunbei_receipt`）、签到（`yunbei_sign`、`yunbei_today`）、推荐歌曲（`yunbei_rcmd_song`、`yunbei_rcmd_song_history`）与任务（`yunbei_task_finish`、`yunbei_tasks`、`yunbei_tasks_todo`）。

#### Scenario: 云贝签到
- **WHEN** 用户打开云贝中心
- **THEN** 系统调用 `yunbei` 展示余额，`yunbei_sign` 完成签到

### Requirement: 会员成长
系统 SHALL 展示会员信息（`vip_info`、`vip_info_v2`）、成长值（`vip_growthpoint`、`vip_growthpoint_get`、`vip_growthpoint_details`）、任务（`vip_tasks`）与时光机（`vip_timemachine`）。

#### Scenario: 查看会员
- **WHEN** 用户进入会员页
- **THEN** 系统调用 `vip_info` 展示会员状态与成长值

### Requirement: 音乐人中心
系统 SHALL 提供音乐人签到（`musician_sign`）、任务（`musician_tasks`、`musician_tasks_new`）、云豆（`musician_cloudbean`、`musician_cloudbean_obtain`）、数据概览（`musician_data_overview`）与播放趋势（`musician_play_trend`）。

#### Scenario: 查看音乐人数据
- **WHEN** 用户进入音乐人中心
- **THEN** 系统调用 `musician_data_overview` 展示数据概览
