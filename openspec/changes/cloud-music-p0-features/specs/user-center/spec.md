# Spec Delta

## Purpose

提供用户个人中心与增强的登录能力，使用户可查看与管理个人资料、歌单、关注关系、等级、听歌记录与云盘，并支持二维码登录与登录状态保持。

## ADDED Requirements

### Requirement: 用户资料与资产
系统 SHALL 展示用户详情（`user_detail`）、等级（`user_level`）、订阅数（`user_subcount`）、我的歌单（`user_playlist`）、云盘（`user_cloud`）、听歌排行（`user_record`）、动态（`user_event`）。

#### Scenario: 查看个人主页
- **WHEN** 用户进入个人中心
- **THEN** 系统调用 `user_detail` 与 `user_playlist` 展示资料与歌单

### Requirement: 关注关系
系统 SHALL 展示关注列表（`user_follows`）与粉丝列表（`user_followeds`），并支持关注/取关（`follow`）。

#### Scenario: 查看粉丝
- **WHEN** 用户点击"粉丝"
- **THEN** 系统调用 `user_followeds` 列出粉丝

### Requirement: 资料编辑
系统 SHALL 允许更新用户资料（`user_update`）、绑定手机（`user_binding`/`user_bindingcellphone`）、上传头像（`avatar_upload`）。

#### Scenario: 修改昵称
- **WHEN** 用户修改昵称并提交
- **THEN** 系统调用 `user_update` 并刷新显示

### Requirement: 二维码登录
系统 SHALL 支持二维码登录流程：`login_qr_key` 生成 key、`login_qr_create` 生成二维码、`login_qr_check` 轮询扫码状态。

#### Scenario: 扫码登录
- **WHEN** 用户在登录框选择二维码
- **THEN** 系统展示 `login_qr_create` 生成的二维码并轮询 `login_qr_check` 直至登录成功

### Requirement: 登录状态保持
系统 SHALL 通过 `login_refresh` 刷新登录态、`login_status` 查询当前登录状态，并在启动时恢复会话。

#### Scenario: 启动恢复会话
- **WHEN** 应用启动
- **THEN** 系统调用 `login_status` 判断已登录则恢复用户态
