# user-center Specification

## Purpose
提供用户个人中心与增强的登录能力，使用户可查看与管理个人资料、歌单、关注关系、等级、听歌记录与云盘，并支持二维码登录与登录状态保持。

## Requirements

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

系统 SHALL 通过 `login_refresh` 刷新登录态、`login_status` 查询当前登录状态，在启动时恢复会话；凭证失效时 SHALL 降级为未登录态，而非继续以游客数据渲染已登录界面。

#### Scenario: 启动恢复会话

- **WHEN** 应用启动
- **THEN** 系统调用 `login_status` 判断已登录则恢复用户态

#### Scenario: 启动时仅有凭证无快照

- **WHEN** 应用启动、本地无资料快照但持有持久化凭证
- **THEN** 系统仍发起一次会话恢复，成功后回填快照与用户态

### Requirement: 登录凭证本地持久化

系统 SHALL 在登录成功后把后端下发的会话凭证持久化到浏览器本地存储，并在后续请求中携带，使登录态不依赖浏览器会话 cookie 的存活。

#### Scenario: 登录后刷新保持登录

- **WHEN** 用户完成登录后刷新页面
- **THEN** 头部继续显示头像与昵称，不出现登录按钮

#### Scenario: 关闭浏览器后重开保持登录

- **WHEN** 用户关闭浏览器后重新打开站点
- **THEN** 系统依据本地凭证恢复登录态，无需重新登录

#### Scenario: 需登录接口携带凭证

- **WHEN** 已登录用户触发任一需登录接口，包括无请求体的 POST
- **THEN** 请求携带本地凭证，后端返回该用户的数据而非游客数据

### Requirement: 会话失效自动降级

系统 SHALL 在需登录接口返回游客身份时先尝试续期一次，续期后仍为游客则清除本地凭证并回到未登录态，不得停留在「显示已登录、数据为空」的状态。

#### Scenario: 凭证过期

- **WHEN** 需登录接口返回游客身份
- **THEN** 系统触发一次续期；续期成功则维持登录，失败则清除凭证并显示未登录

#### Scenario: 退出登录

- **WHEN** 用户点击退出并确认
- **THEN** 本地凭证与首屏快照均被清除，头部回到未登录态

### Requirement: 首屏登录态快照

系统 SHALL 保存一份用户资料快照用于首屏渲染以消除登录按钮闪烁，该快照 SHALL NOT 作为身份凭证参与登录判定。

#### Scenario: 首屏无闪烁

- **WHEN** 已登录用户刷新页面
- **THEN** 首屏直接渲染头像与昵称，不出现登录按钮闪现

#### Scenario: 快照与真实状态不一致

- **WHEN** 快照存在但凭证已失效
- **THEN** 系统以真实登录状态为准，清除快照并显示未登录
