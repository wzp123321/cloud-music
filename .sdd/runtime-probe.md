# 运行时基线探测（路线 A）

日期：2026-11-09　目标：证伪「原仓库已停更 → 212 个未接接口大概率全废」这一前提。

## 结论

**前提证伪，可以继续逐步接入。** 19 个跨域抽样中 **17 个接口本身有效**，仅 2 个真实失效。

| 判定 | 数量 | 含义 |
|---|---|---|
| 匿名可用 | 12 | HTTP 200 + `code:200`，返回真实业务数据 |
| 需登录 | 4 | HTTP 301 / `code:301`「需要登录」，接口存在，缺 cookie |
| 上传类接口（需文件 + 登录） | 1 | `/cloud` 是文件上传接口，非匿名 GET，探测方式不适用 |
| **真实失效** | **2** | `/yunbei/info`（404）、`/top/list`（上游业务 400） |

覆盖率：17/19 ≈ 89%。eapi 加密与 `music.163.com` 连通性均正常。

## 环境

- server：`NeteaseCloudMusicApi 4.13.3`，端口 `10130`，前端 `.env` 的 `VITE_PROXY_URL` 已指向该端口。
- 有效安装命令（内网代理对 scoped 包 403，改公网源；devDeps 的 eslint peer 冲突，仅装运行时依赖）：
  ```
  npm install --omit=dev --legacy-peer-deps --no-package-lock \
              --registry=https://registry.npmjs.org --no-audit --no-fund
  ```
- 启动方式（绕过 `app.js` 的联网 `generateConfig` 与版本检查）：
  ```
  node -e "require('./server').serveNcmApi({port:10130})"
  ```
- 首次 `/banner` 探测：HTTP 200、`code:200`、6703 字节真实 banner 数据。

## 抽样明细（19 个，8 并发）

| 档 | 端点 | HTTP | code | 判定 | 备注 |
|---|---|---|---|---|---|
| P0 | `/banner?type=0` | 200 | 200 | 可用 | 真实数据 |
| P0 | `/toplist` | 200 | 200 | 可用 | 榜单列表 |
| P0 | `/search/hot` | 200 | 200 | 可用 | |
| P0 | `/playlist/catlist` | 200 | 200 | 可用 | |
| P0 | `/homepage/block/page?refresh=true` | 200 | 200 | 可用 | 匿名可用 |
| P0 | `/top/list` | 200 | 400 | **失效** | 见问题 ① |
| P1 | `/album/new?area=ALL&limit=5` | 200 | 200 | 可用 | |
| P1 | `/artist/list?limit=5` | 200 | 200 | 可用 | |
| P1 | `/mv/all?limit=5` | 200 | 200 | 可用 | |
| P1 | `/style/list` | 200 | 200 | 可用 | |
| P1 | `/record/recent/song?limit=5` | 200 | 200 | 可用 | 匿名可用 |
| P1 | `/msg/private?limit=5` | 301 | 301 | 需登录 | |
| P2 | `/dj/catelist` | 200 | — | 可用 | 返回分类数组 |
| P2 | `/video/group/list` | 200 | 200 | 可用 | `success` |
| P2 | `/vip/info` | 301 | 301 | 需登录 | |
| P2 | `/listentogether/status` | 301 | 301 | 需登录 | |
| P2 | `/fanscenter/overview/get` | 200 | 301 | 需登录 | |
| P2 | `/yunbei/info` | 404 | 404 | **失效** | 见问题 ② |
| P2 | `/cloud?limit=5` | 404 | — | 不适用 | 上传接口，见问题 ③ |

补充复核：`/yunbei`、`/yunbei/tasks` 均为 301 需登录 → 云贝域整体有效，仅 `info` 单点 404。

## 发现的问题

**① `/top/list` 上游已变（影响 P0 现网功能，运行时独有）**
- `module/top_list.js` 明确拒绝 `idx`，只接受 `id`，走 `https://interface3.music.163.com/api/playlist/v4/detail`。
- 前端 `portal-request.service.ts:189` 传的是 `id`，**调用写法正确**。
- 但用 `/toplist` 返回的真实 id（`19723756` 飙升榜）复测，仍返回 `{"code":400,"message":"请求参数错误"}`。
- 判断：上游 `playlist/v4/detail` 参数契约已变，非前端 bug。P0 排行榜详情页实际拿不到数据。
- 静态门禁（tsc / build / 端点对齐 / 交叉评审）全部查不出此类问题——路径对、封装非占位、契约吻合，错在上游。
- 修复需动 `cloud-music-server` 或改用 `/playlist/detail`，**超出本轮「server 零改动」边界**，标记待确认。

**② `/yunbei/info` 单点 404**：同域其他接口有效，属个别接口下线，接入时登记失效即可，不影响域整体。

**③ `/cloud` 是文件上传接口**（需 `songFile` FormData + 登录），GET 探测返回 404 属探测方式不适用，不是失效。

## 对「逐步做」路线的影响

1. 路线 B（按 capability 逐步接）的前提成立，可继续；无需因停更而改数据源。
2. 每批接入前增加「先探测该批接口匿名可用性」动作，把失效接口当场登记，不写进 UI 后再返工。
3. 约 1/4 抽样接口需登录态。P1/P2 的用户资产类功能（消息、云贝、会员、一起听、粉丝中心）必须配合登录 cookie 才能验收；本环境无账号，这部分只能静态验证。
4. P0 存在 1 个运行时功能缺口（排行榜详情），与已知 8 项 UI 缺口并列，需单独决策是否修。

## 待确认

- `/top/list` 是否授权修 server（改为可用上游）或前端改调 `/playlist/detail`。
- 是否需要对 P0 已接的 72 个接口做全量匿名探测（本轮按约定只做跨域抽样 19 个）。
- 登录态接口用真实账号验收需用户本地操作，本环境不具备。
