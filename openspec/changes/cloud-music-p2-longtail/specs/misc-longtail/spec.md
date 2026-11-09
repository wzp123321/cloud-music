# Spec Delta

## Purpose

收口内部/年度/统计类杂项接口，使 server 端 309 接口在前端规划层面全部有归属。

## ADDED Requirements

### Requirement: 杂项与统计
系统 SHALL 集成内部版本（`inner_version`）、Web 日志（`weblog`）、阈值详情（`threshold_detail_get`）、年度总结（`summary_annual`）、创作者认证（`creator_authinfo_get`）、计数（`pl_count`）、批量（`batch`）、用户 ID 查询（`get_userids`）、日历（`calendar`）。

#### Scenario: 查看年度总结
- **WHEN** 用户进入年度总结
- **THEN** 系统调用 `summary_annual` 展示年度听歌数据

#### Scenario: 检查内部版本
- **WHEN** 应用启动自检
- **THEN** 系统调用 `inner_version` 校验前端与接口版本兼容
