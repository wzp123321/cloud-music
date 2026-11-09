# Spec Delta

## Purpose

提供云盘上传与匹配能力，补全用户自有音频存储与匹配入库。

## ADDED Requirements

### Requirement: 云盘上传与匹配
系统 SHALL 提供云盘文件列表（`cloud`）与本地音频匹配（`cloud_match`）。

#### Scenario: 匹配本地音频
- **WHEN** 用户上传本地音频到云盘
- **THEN** 系统调用 `cloud_match` 匹配曲库并返回匹配结果
