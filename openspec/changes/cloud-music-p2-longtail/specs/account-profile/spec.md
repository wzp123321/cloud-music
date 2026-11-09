# Spec Delta

## Purpose

提供账号注册、验证、绑定、资料与签到能力，补全账号体系（注意：注册/换绑/验证码类接口涉及账号安全，实现时需谨慎，避免误触发真实注册/绑定流程）。

## ADDED Requirements

### Requirement: 验证与注册前置
系统 SHALL 提供二维码验证（`verify_getQr`、`verify_qrcodestatus`）、验证码（`captcha_sent`、`captcha_verify`）、国家区号（`countries_code_list`）、手机号存在性检查（`cellphone_existence_check`）。

#### Scenario: 发送验证码
- **WHEN** 用户注册/换绑时获取验证码
- **THEN** 系统调用 `captcha_sent` 发送，`captcha_verify` 校验（仅本地/测试环境触发，避免真实下发）

### Requirement: 账号资料与签到
系统 SHALL 提供匿名/手机注册（`register_anonimous`、`register_cellphone`）、换绑（`rebind`）、昵称检测（`nickname_check`）、初始化资料（`activate_init_profile`）、签到信息（`sign_happy_info`、`signin_progress`）、设置（`setting`）与每日签到（`daily_signin`）。

#### Scenario: 每日签到
- **WHEN** 用户点击每日签到
- **THEN** 系统调用 `daily_signin` 完成签到并返回奖励
