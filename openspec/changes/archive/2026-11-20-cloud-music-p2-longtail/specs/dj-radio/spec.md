# Spec Delta

## Purpose

提供电台全套能力：分类、推荐、节目、榜单、订阅与礼物，补全音频内容第三形态（电台），使产品涵盖音乐/MV/电台三类音频。

## ADDED Requirements

### Requirement: 电台发现
系统 SHALL 提供电台首页与分类浏览（`dj_banner`、`dj_catelist`、`dj_category_recommend`、`dj_category_excludehot`、`dj_hot`、`dj_recommend`、`dj_recommend_type`、`dj_personalize_recommend`、`dj_today_perfered`）。

#### Scenario: 浏览电台分类
- **WHEN** 用户进入电台
- **THEN** 系统调用 `dj_catelist` 展示分类，`dj_recommend` 展示推荐电台

### Requirement: 电台与节目
系统 SHALL 展示电台详情与节目列表（`dj_detail`、`dj_program`、`dj_program_detail`、`dj_program_toplist`、`dj_program_toplist_hours`、`dj_radio_hot`）。

#### Scenario: 查看电台节目
- **WHEN** 用户进入某电台
- **THEN** 系统调用 `dj_program` 展示节目列表，`dj_program_detail` 展示单集

### Requirement: 订阅与榜单
系统 SHALL 支持电台订阅（`dj_sub`、`dj_sublist`、`dj_subscriber`）、礼物（`dj_paygift`）与各类榜单（`dj_toplist`、`dj_toplist_hours`、`dj_toplist_newcomer`、`dj_toplist_pay`、`dj_toplist_popular`）。

#### Scenario: 订阅电台
- **WHEN** 用户点击订阅电台
- **THEN** 系统调用 `dj_sub` 并刷新订阅状态

### Requirement: 节目推荐与音频匹配
系统 SHALL 提供节目推荐（`program_recommend`）、AI 推荐（`aidj_content_rcmd`）与音频匹配（`audio_match`）。

#### Scenario: 推荐节目
- **WHEN** 用户查看推荐
- **THEN** 系统调用 `program_recommend` 展示推荐节目
