# Tasks

## 1. 凭证所有权收口

- [x] 1.1 在 `src/core/session.ts` 把三个游离函数收敛为 `SessionManager` 单例，暴露 `establish` / `renew` / `revoke` / `snapshot` / `isAlive`；验证：五个方法各有单一职责，`establish` 后 `snapshot()` 返回规范化 cookie 串
- [x] 1.2 `SessionManager` 模块初始化时读一次 `localStorage['cloud-session']`，之后仅由建立/续期/吊销写盘；验证：DevTools 中请求期间不再出现逐次 `localStorage` 读取
- [x] 1.3 监听 `storage` 事件，键匹配时刷新内存值；验证：两个标签页中一个登录，另一个刷新后登录态同步
- [x] 1.4 提供 `resetForTest()`，仅测试环境可用；验证：不导出到生产入口

## 2. 请求层显式注入

- [x] 2.1 在 `src/apis/request.ts` 新增 `withSession(payload)`，由 `publicReq` 组装前调用，删除 axios 拦截器中的 `instanceof FormData` / `typeof === 'object'` / `undefined` 三路嗅探；验证：GET、普通 POST、无 body POST、FormData 四类请求均携带凭证
- [x] 2.2 `getBlobResponse` 等直接使用 axios 实例的出口统一改经 `publicReq` 或显式调用 `withSession`；验证：全局检索不再存在绕过注入的请求出口
- [x] 2.3 手工核对 `/login/refresh`、`/logout` 这类无 body 的 POST 确实带上凭证；验证：DevTools 请求体含 `cookie` 字段

## 3. 首屏快照与登录态判定

- [x] 3.1 `src/core/token.ts` 收窄职责：`cloud-token` 只作首屏快照、30 天有效期、空值即删除；验证：cookie jar 中到期时间为写入后 30 天
- [x] 3.2 `src/store/user.ts` 改为订阅 `SessionManager`，`setLogin` / `logout` / `restoreSession` 不再各自读写存储；验证：退出后 `localStorage['cloud-session']` 与 `cloud-token` 均为空
- [x] 3.3 `src/apis/content-enhance/content-enhance.service.ts` 的 `hasLogin()` 合并为 `isAlive()`，删除旧快照兼容分支；验证：全局检索无残留调用
- [x] 3.4 在明确的需登录接口响应上增加游客态探测：`account.anonimousUser === true` 且 `isAlive()` 为真时触发一次 `renew()`，仍为游客则 `revoke()`；验证：手动清空后端凭证后发起需登录操作，界面回到未登录而非空数据

## 4. 常量命名统一

- [ ] 4.1 全仓 31 处模块常量由 `SCREAMING_SNAKE_CASE` 改为 `camelCase`，同步约 60 处引用；`TIME_OUT` 顺带修正为 `timeout`；验证：`vue-tsc --noEmit` 通过，全局检索无旧名称残留
- [ ] 4.2 修正 `artistDetail.is_error` 为 `isError`；验证：类型检查通过
- [ ] 4.3 确认 `cloud-music-p1-enhancement`、`cloud-music-p2-longtail`、`cloud-music-modernize` 三个在途 change 已归档或已接受 rebase 成本后再执行 4.1；验证：`git status` 无冲突文件

## 5. 验收

- [x] 5.1 `vue-tsc --noEmit`、`eslint`、`vite build` 全部通过
- [ ] 5.2 真实账号：登录 → 刷新 → 关浏览器重开，三阶段均保持头像与歌单
- [ ] 5.3 DevTools 删除 `cloud-token` 后重新打开站点，仍能自愈为登录态
- [ ] 5.4 退出登录后刷新，保持未登录态
- [x] 5.5 `openspec validate login-session-hardening` 通过
