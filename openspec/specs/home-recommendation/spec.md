# home-recommendation Specification

## Purpose
为用户提供网易云风格的首页个性化内容入口，包括区块瀑布流、金刚区与多维度排行榜，使首页成为内容发现起点而非仅搜索入口。

## Requirements

### Requirement: 首页区块瀑布流
系统 SHALL 调用 `homepage_block_page` 渲染首页分区块内容流（Banner、推荐歌单、新歌、精选等），每个区块展示标题与可横向滚动的内容卡片。

#### Scenario: 加载首页
- **WHEN** 用户进入首页
- **THEN** 系统调用 `homepage_block_page` 并按区块顺序渲染卡片列表

#### Scenario: 区块接口失败
- **WHEN** `homepage_block_page` 返回错误
- **THEN** 该区块显示错误占位，其余区块正常渲染

### Requirement: 金刚区入口
系统 SHALL 通过 `homepage_dragon_ball` 展示首页快捷入口（如每日推荐、歌单、排行榜、电台等）。

#### Scenario: 渲染入口
- **WHEN** 首页加载完成
- **THEN** 金刚区按 `homepage_dragon_ball` 返回顺序展示图标入口

### Requirement: 个性化推荐
系统 SHALL 提供个性化推荐入口，调用 `personalized`（推荐歌单）、`personalized_newsong`（新歌）、`recommend_resource`（推荐资源）、`recommend_songs`（每日推荐），并对不感兴趣内容支持 `recommend_songs_dislike`。

#### Scenario: 查看每日推荐
- **WHEN** 用户点击"每日推荐"
- **THEN** 系统调用 `recommend_songs` 展示推荐歌曲列表

#### Scenario: 标记不感兴趣
- **WHEN** 用户对推荐歌曲点击"不感兴趣"
- **THEN** 系统调用 `recommend_songs_dislike` 并从列表移除

### Requirement: 多维排行榜
系统 SHALL 展示官方榜单（`toplist`、`top_list`）与分类热门（`top_playlist_highquality`、`top_song`、`top_mv`、`top_album`、`top_artists`），点击进入榜单详情。

#### Scenario: 查看排行榜列表
- **WHEN** 用户进入排行榜页
- **THEN** 系统调用 `toplist` 列出所有榜单，调用 `top_list` 获取具体榜单歌曲
