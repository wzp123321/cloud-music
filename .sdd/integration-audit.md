# cloud-music P0 集成审计报告（只读静态比对）

- **角色**：集成审计员（只读）。未修改任何源码，未安装依赖，未跑构建，未读取输入清单外的业务实现文件（仅对 `src/` 做函数名/URL 字面量的 Grep 定位）。
- **范围**：`openspec/changes/cloud-music-p0-features/tasks.md` 任务 2.x/3.x/4.x/5.x 列出的接口 × `cloud-music-web/src/` 输入清单 7 个 api/service 文件 × `cloud-music-server/module/*.js` 文件名。
- **路由规则**：module 文件名下划线转斜杠（`comment_like.js` → `/comment/like`），前端 URL 统一由 `services/request.ts` 拼 `BASE_URL(/api/)`。
- **请求封装真源**：`src/services/request.ts` → `getRequest`:63、`postRequest`:91、`postFormRequest`:77（封面上传 FormData 场景）。
- **契约基准**：以 tasks.md 任务条目**显式列出**的接口为准，共 **68** 个（12+18+19+19，见矩阵）；另交叉核对 5 份 `specs/*/spec.md`。
- **放行结论（审计时点）**：🔴 总阻断数 = 2（非 0），不予放行。
- **返工后复核（卡点③交叉评审独立确认）**：2 个阻断已由返工补齐 —— `user_bindingcellphone` → `/user/bindingcellphone`、`avatar_upload` → `/avatar/upload`，端点与封装位于 `user.api.ts:27-28`、`user.service.ts:107-118`，server module 均存在。端点覆盖 68/68，**🔴 降级为 0，孤儿端点 0，予以放行**。详见 `.sdd/cross-review.md`。

---

## 审计项逐项结论（不深读业务实现）

**1. 端点存在性**：66/68 通过。tasks.md 逐条接口均能在前端 `user.api.ts` / `playlist-manage.api.ts` / `search-enhance.api.ts` / `portal-request.service.ts` / `cm-comment.api.ts` / `cm-simi.api.ts` 找到对应 URL 字面量（Read 全文 + Grep 定位），且能在 server/module 找到下划线文件名。**缺 2 个**：`user_bindingcellphone`、`avatar_upload`（4.3），见 🔴。

**2. 非占位**：全部通过。7 个 api 文件所有 URL 封装函数均为真实 `getRequest` / `postRequest` / `postFormRequest` 调用，无 `return null` / 空数组 / TODO / 写死常量返回值。说明：`fetchSimi` 的 `default: return {}`（cm-simi.api.ts:82）与 `normalizeSimi` 的 `default: return []`（:128）是分发/归一化兜底，非 URL 封装占位；`CM_COMMENT_ROUTE`（cm-comment.api.ts:25）是路由映射常量，其值均被 `getCommentList` 真实请求使用。

**3. 路径吻合**：全部通过，三个重点均为斜杠形式且精确一致，未发现下划线残留 URL。

| 契约接口 | server 文件 | 前端 URL 字面量 | 文件:行号 | 结论 |
|---|---|---|---|---|
| `login_qr_key` | `login_qr_key.js` | `/login/qr/key` | `src/services/user.api.ts:29` | ✅ |
| `comment_like` | `comment_like.js` | `/comment/like` | `src/components/cm-comment/cm-comment.api.ts:209` | ✅ |
| `homepage_block_page` | `homepage_block_page.js` | `/homepage/block/page` | `src/pages/portal/services/portal-request.service.ts:82` | ✅ |

（Grep 全 `src` 仅命中上述斜杠字面量；`homepage_block_page`、`login_qr_key`、`comment_like` 仅出现在注释中，无下划线形式的 URL。）

**4. 孤儿端点（🔴 判据）**：**0**。逐一核对前端全部 URL 字面量（含 `EUserPath` 枚举 17 项、`CM_COMMENT_ROUTE` 7 项、`playlist-manage` 19 项、`search-enhance` 4 项、`portal-request` 20 项、`cm-simi` 5 项等），下划线反推的文件名均在 `module/*.js` 枚举结果中存在，无「前端有调用但 server 无 module」。

**5. 契约吻合**：所有 api 模块均被页面/组件 import（Grep 命中 cm-comment.vue / cm-simi.vue / user.vue 及各子页 / playlist.vue / search.service.ts / header.service.ts / portal.service.ts 等），无「整模块死代码」。函数级存在 **7 处「封装了但无人调用」**（🟡，见下）。`cm-simi.api.ts` 的 5 个 `getSimiXxx` 虽无外部直接调用，但经 `fetchSimi`（:66-84）按 type 分发，存在调用路径，不计死代码。

**6. 已知遗留**：`src/pages/playlist/playlist-detail/playlist-detail.service.ts:69` 类型错误（`_dynamic$` BehaviorSubject 初值），另一 agent 修复中，**仅记录，不判本审计阻断**。

---

## ① 对齐矩阵

> 「前端已接数」口径 = 有 URL 字面量（Read/Grep 确认）且 server/module 有对应下划线文件名的接口数；「仅封装但无人调用」不在此扣减，单列 🟡。

| 模块（spec / tasks） | 契约接口数 | 前端已接数 | 结论 |
|---|:---:|:---:|---|
| 首页推荐流 `home-recommendation`（2.1–2.3） | 12 | 12 | ✅ 全对齐（含 `/homepage/block/page`、`/recommend/songs/dislike`） |
| 歌单生态 `playlist-management`（3.1–3.4） | 18 | 18 | ✅ 端点齐；🟡 5 个封装函数无人调用 |
| 用户中心/登录 `user-center`（4.1–4.5） | 19 | 17 | 🔴 缺 2 端点；🟡 1 个封装函数无人调用 |
| 搜索增强 `search-enhancement`（5.1） | 4 | 4 | ✅ 全对齐 |
| 评论互动+相似 `comment-interaction`（5.2–5.4） | 15 | 15 | ✅ 全对齐（7 类 comment 路由 + 5 simi） |
| **合计** | **68** | **66** | **🔴 2 / 🟡 7，不放行** |

---

## ② 阻断清单

### 🔴 必须修（2 项，均属 user-center 4.3 资料编辑）

契约要求「绑定手机（`user_binding`/`user_bindingcellphone`）、上传头像（`avatar_upload`）」，`specs/user-center/spec.md:24`、`tasks.md:25` 均明确列出；server 侧 `module/user_bindingcellphone.js`、`module/avatar_upload.js` 存在，但前端全无对应 URL 字面量或封装 —— 属「契约/server 有、前端未接入」的端点存在性失败。Grep `bindingcellphone|avatar_upload|avatar/upload` 在 `cloud-music-web/src` 下 **0 命中**。

1. **`user_bindingcellphone`**（`/user/bindingcellphone`）缺失。
   - 缺字面量：`src/services/user.api.ts:9-36`（`EUserPath` 枚举，资料编辑区仅 `更新资料='/user/update'`、`用户绑定='/user/binding'`）。
   - 缺封装：`src/services/user.service.ts:89-101`（`UserService` 资料编辑区仅 `updateUser`/`getUserBinding`）。
   - 契约：`tasks.md:25`（4.3）、`specs/user-center/spec.md:24`；server：`module/user_bindingcellphone.js`。
2. **`avatar_upload`**（`/avatar/upload`）缺失。
   - 缺字面量：`src/services/user.api.ts:9-36`；缺封装：`src/services/user.service.ts:89-101`（亦未使用 `postFormRequest` 上传头像）。
   - 契约：`tasks.md:25`（4.3）、`specs/user-center/spec.md:24`；server：`module/avatar_upload.js`。

### 🟡 建议修（7 项：封装函数「封装了但无人调用」死代码）

> 判定依据：Grep 函数名全 `src`，命中仅出现在 api 定义文件自身的 `export const` 行，无任何页面/组件/service 调用点。端点本身存在（URL 字面量 + server module 齐全），故不升级为 🔴，但这些契约功能（删除歌单、收藏者、封面/隐私/顺序编辑、绑定列表）疑似页面未落地，建议复核。

| # | 文件:行号 | 函数 / URL | 对应契约 | 说明 |
|---|---|---|---|---|
| 1 | `src/services/playlist-manage.api.ts:118` | `deletePlaylist` / `/playlist/delete` | 3.2 `playlist_delete` | 无调用点 |
| 2 | `src/services/playlist-manage.api.ts:126` | `getPlaylistSubscribers` / `/playlist/subscribers` | 3.2 `playlist_subscribers` | 无调用点 |
| 3 | `src/services/playlist-manage.api.ts:154` | `updatePlaylistCover` / `/playlist/cover/update` | 3.3 `playlist_cover_update` | 无调用点（`postFormRequest` 已备好） |
| 4 | `src/services/playlist-manage.api.ts:162` | `updatePlaylistPrivacy` / `/playlist/privacy` | 3.3 `playlist_privacy` | 无调用点 |
| 5 | `src/services/playlist-manage.api.ts:166` | `updatePlaylistOrder` / `/playlist/order/update` | 3.3 `playlist_order_update` | 无调用点 |
| 6 | `src/services/user.service.ts:97` | `getUserBinding` / `/user/binding` | 4.3 `user_binding` | 无调用点 |
| 7 | `src/pages/portal/services/portal-request.service.ts:60` | `getNewDVDList` / `/top/album` | 非 P0 新增（tasks.md 标注前端已接入的既有接口） | 既有老接口，记录备查 |

（前 6 项落在 P0 契约范围；第 7 项为既有代码。所有 7 项端点均有 server module，非孤儿。）

### 待确认 / 仅记录（不判阻断）

- **契约语义偏差**：`specs/comment-interaction/spec.md:17` 以 `comment_new` 指代「发评」，但 server `comment_new.js` 实为新版评论列表；`cm-comment.api.ts:218-221` 注释已说明「发评走 `/comment`（comment.js），`comment_new` 用于列表刷新」。前端 `sendComment→/comment`、`getCommentNew→/comment/new` 两端点均存在且 server 有 `comment.js`/`comment_new.js`，实现自洽，但 spec 措辞与 server 语义不一致，建议修订契约文本。
- **文档口径**：`tasks.md:45` 记「规划点 68 / 扣除 5 个已用 / 净新增约 63」，与按任务条目逐条计数 **68**（已用 5 个仅在注释中说明、未计入接入清单）存在口径差异，待文档作者确认，不影响本次端点判定。
- **已知遗留**：`src/pages/playlist/playlist-detail/playlist-detail.service.ts:69` 类型错误（另一 agent 修复中），仅记录。

---

## ③ 总阻断数

- **🔴 阻断 = 2**（`user_bindingcellphone`、`avatar_upload` 前端未接入）
- 🟡 建议 = 7（死代码）
- 孤儿端点 = 0，路径不吻合 = 0，占位封装 = 0
- **结论：总阻断数 ≠ 0，P0 集成不予放行。** 需补齐 4.3 两个端点并复验后重审。
