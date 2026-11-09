# Spec Delta

## Purpose

增强搜索体验，提供热搜榜、搜索建议与多重匹配结果，使搜索从"关键词列表"升级为完整的发现入口。

## ADDED Requirements

### Requirement: 热搜榜
系统 SHALL 展示热搜列表（`search_hot`）与热搜详情（`search_hot_detail`）。

#### Scenario: 展示热搜
- **WHEN** 用户聚焦搜索框
- **THEN** 系统调用 `search_hot` 显示热搜榜

### Requirement: 搜索建议
系统 SHALL 在输入时调用 `search_suggest` 提供实时补全建议。

#### Scenario: 输入联想
- **WHEN** 用户输入关键词
- **THEN** 系统调用 `search_suggest` 显示下拉建议

### Requirement: 多重匹配
系统 SHALL 调用 `search_multimatch` 在搜索结果页展示歌手/歌单/专辑/歌曲等多类型匹配概览。

#### Scenario: 搜索多类型
- **WHEN** 用户执行搜索
- **THEN** 系统调用 `search_multimatch` 展示各类型匹配数量入口
