# Spec Delta

## Purpose

提供粉丝中心与数字专辑能力，补全创作者粉丝运营与数字唱片形态。

## ADDED Requirements

### Requirement: 粉丝中心
系统 SHALL 展示粉丝概览（`fanscenter_overview_get`）、画像（`fanscenter_basicinfo_age_get`、`fanscenter_basicinfo_gender_get`、`fanscenter_basicinfo_province_get`）与趋势（`fanscenter_trend_list`）。

#### Scenario: 查看粉丝概览
- **WHEN** 用户进入粉丝中心
- **THEN** 系统调用 `fanscenter_overview_get` 展示粉丝总数与趋势

### Requirement: 数字专辑
系统 SHALL 展示数字专辑详情（`digitalAlbum_detail`）、销量（`digitalAlbum_sales`）、下单（`digitalAlbum_ordering`）与已购（`digitalAlbum_purchased`）。

#### Scenario: 查看数字专辑
- **WHEN** 用户进入数字专辑详情
- **THEN** 系统调用 `digitalAlbum_detail` 展示专辑信息与销量
