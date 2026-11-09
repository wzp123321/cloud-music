# cloud-music P0 交叉评审报告（卡点③ · 只读交叉评审员）

- **角色**：交叉评审员（只读，卡点③）。换视角独立复核，**不采信 integration-audit.md 的结论**，所有存在性判断均以本机 Grep/Read 事实为准。
- **约束遵守**：未修改任何源码，未跑构建，未安装依赖；本次仅新写本报告 `.sdd/cross-review.md`。核对范围限定在输入清单文件 + `module/*.js` 文件名 + `router/routes.ts`（页面路由存在性所需）；仅用 Grep 全 `src` 定位函数名/URL 字面量调用点，未漫游读取清单外业务文件正文。
- **输入产物**：`tasks.md`、5 份 `specs/*/spec.md`、`.sdd/integration-audit.md`、`.sdd/build-gate.md`、五模块交付物、`cloud-music-server/module/*.js` 文件名清单。
- **路由真源规则**：module 文件名下划线逐段转斜杠（`comment_hug_list.js` → `/comment/hug/list`）；BASE_URL(`/api/`) 由 `request.ts` 拼接，前端只写相对路径。
- **封装真源复核**：`src/services/request.ts` 独立 Grep 确认导出 `getRequest:63` / `postFormRequest:77` / `postRequest:91`，与审计报告一致，所有 api/service 封装调用的函数真实存在。

---

## 判定口径（三条强制检查项）

| 项 | 复核方法 | 通过标准 |
|---|---|---|
| ① 存在性 | Grep 精确确认 URL 字面量 / 导出函数 / 页面路由所在文件与行号；server 侧用 `ls module/*.js` 全量文件名对照 | 声称交付项均能在对应文件定位，且 server 有对应下划线文件 |
| ② 非占位 | Read 抽查 api 封装函数体、组件模板与 script | 真实 `getRequest`/`postRequest`/`postFormRequest` 调用、页面真实接数据；无 `return null`/空数组/`TODO`/写死常量/仅骨架 |
| ③ 契约吻合 | 前端 URL ↔ tasks.md/spec 接口名 ↔ server module 文件名三方对照 | 路径精确一致、无下划线残留 URL、无孤儿端点；偏离记 🔴/🟡 |

**契约吻合的可核对边界（如实声明）**：tasks.md / spec.md 只列出接口名与场景，**未给出 method 字面约束、未给出入参名字面约束**；用户给定真源仅为 `module/*.js` **文件名**，边界禁止读取 module 正文。因此 method 与入参名**无法逐字比对 server**，本报告按「路径精确一致 + 前端封装内部自洽 + 无 URL 偏离」判定，相关观察单列「待确认项」，不臆造偏离。

---

## 一、五模块逐项结论表

### 模块1 缺陷修复（`portal.service.ts`、`common-api.ts`、`pc.service.ts`）

| 检查项 | 证据 | 结论 |
|---|---|---|
| ① 存在性 | 3 文件均在；`Grep 'ablum'` 全 src **0 命中**；`/album_detail` 路由 path 在 `routes.ts:94`、`portal.service.ts:202`（banner 跳转）、`portal.service.ts:471`（linkToAlbum） | ✅ |
| ② 非占位 | `portal.service.ts` 为真实状态层（init/getter/query*/linkTo* 全接 `portalService`）；`common-api.ts` 为 5 个真实接口类型定义；`pc.service.ts` 2 个方法 `getLyricById`/`getSongDownloadUrl` 均真实 `getRequest`（L9-23） | ✅ |
| ③ 契约吻合 | 1.1 `ablum`→`album` 全局替换完成（0 命中，且与 `routes.ts` 的 `/album_detail` 一致，专辑详情可进入）；1.2 `Grep 'getSongUrlByIds'` 全 src **0 命中**，死代码已删，pc.service.ts 播放相关不受影响 | ✅ |

**模块1 结论：通过。**

### 模块2 首页推荐流（`portal-request.service.ts`、`portal.ts`、`portal.html`、`daily-recommend/**`、`rank/**`）

| 检查项 | 证据 | 结论 |
|---|---|---|
| ① 存在性 | 12 个契约接口 URL 字面量全在 `portal-request.service.ts`：L82 `/homepage/block/page`、L93 `/homepage/dragon/ball`、L105 `/personalized`、L114 `/personalized/newsong`、L152 `/recommend/resource`、L160 `/recommend/songs`、L169 `/recommend/songs/dislike`、L180 `/toplist`、L189 `/top/list`、L198 `/top/playlist/highquality`、L211 `/top/song`、L220 `/top/mv`；server 12 个 module 文件均在全量清单中；页面路由 `/`(`portal.vue`)、`/daily_recommend`、`/rank`、`/rank_detail` 在 `routes.ts:9/13/21/29` 注册 | ✅ |
| ② 非占位 | 上述 12 方法全部真实 `postRequest`/`getRequest`；`portal.service.ts` 新增状态层（L54-70 状态、L164-177 init、L302-454 取数）真实；`portal-block-page.ts/.html`、`daily-recommend.ts/.html`、`rank.ts/.html` 均 `v-for` 接数据渲染 | ✅ |
| ③ 契约吻合 | 12 条路径与「下划线→斜杠」精确一致，斜杠形式、无下划线残留 URL；额外接口 `/personalized/djprogram`、`/personalized/mv`、`/personalized/privatecontent`、`/top/artists`、`/top/album` 对应 server 文件亦存在 | ✅ |

**重点复核 · `portal-block-page.vue` 注册与挂载：属实 ✅**
- `portal.ts:15` `import PortalBlockPage from './portal-block-page/portal-block-page.vue'`；`portal.ts:24` `'portal-block-page': PortalBlockPage`（components 注册）；`portal.ts:29` `onMounted → portal.init()`。
- `portal.html:18` `<portal-block-page></portal-block-page>`（挂载）；`portal.html:15` 同时挂载 `<portal-dragon-ball>`。
- `portal.vue` 三文件外链（`<template src="./portal.html">`），`portal-block-page.vue` 同结构，其 `portal-block-page.ts` 真实读取 `blockPageList`/`blockPageError` 并按 `resourceType` 跳转（非空骨架）。
- 结论：**portal.ts 注册 + portal.html 挂载均成立**，非「只建文件不接」。

**模块2 结论：通过。**

### 模块3 歌单生态（`playlist-manage.api.ts`、`pages/playlist/**`）

| 检查项 | 证据 | 结论 |
|---|---|---|
| ① 存在性 | 18 个契约 URL 全在 `playlist-manage.api.ts`（3.1 L92/95/99/106、3.2 L115/119/123/130/137、3.3 L143/147/151/158/163/167、3.4 L173/177/184/188）；server 18 个 module 文件均在；6 个页面/组件文件存在 | ✅ |
| ② 非占位 | 全部真实 `getRequest`/`postRequest`；`updatePlaylistCover`(L154-159) 真实 `FormData` + `postFormRequest`；`playlist.vue`/`playlist-form-dialog.vue`/`playlist-detail.vue`/`my-playlist.vue`/`playlist-detail.service.ts` 均真实接数据 | ✅ |
| ③ 契约吻合 | 18 条路径精确一致（含 `/playlist/cover/update`、`/playlist/highquality/tags`、`/top/playlist/highquality`）；**🟡 5 个封装函数无 UI 入口 → 3.2/3.3 功能缺口**（见 §二） | ✅（附 🟡） |

**模块3 结论：通过（附 🟡 待补 UI，不判 🔴 阻断，端点与封装齐全）。**

### 模块4 用户中心（`user.api.ts`、`user.service.ts`、`pages/user/**`、`header-loginform/**`）

| 检查项 | 证据 | 结论 |
|---|---|---|
| ① 存在性 | 19 个契约 URL 全在 `EUserPath`（`user.api.ts:11-37`：4.1 L11-17、4.2 L20-22、4.3 L25-28、4.4 L31-33、4.5 L36-37）；server 19 个 module 文件均在（含 `user_bindingcellphone.js`、`avatar_upload.js`）；12 个 user 页面/组件 + 3 个 header-loginform 文件存在；路由 `/user` 在 `routes.ts:112/116` 注册 | ✅ |
| ② 非占位 | `user.service.ts` 19 个方法全部真实封装，`bindingCellphone`(L107-110) `postRequest`、`uploadAvatar`(L113-118) `FormData`+`postFormRequest`；`user.service.ts`(pages/user) 真实调用 10 个方法；`user.vue` 挂载 8 个子组件；`header-loginform.service.ts` 真实串联 `getQrKey`(L179)/`getQrCreate`(L185)/`checkQr`(L199)/`loginStatus`(L227)；`loginRefresh` 经 `header.ts:171` 调用（4.5 会话恢复成立） | ✅ |
| ③ 契约吻合 | 19 条路径精确一致（含 `/login/qr/key`、`/avatar/upload`、`/user/bindingcellphone`）；**独立复验：审计 🔴 2 项当前不成立**（见 §三）；但 `bindingCellphone`/`uploadAvatar`/`getUserBinding` 无 UI 调用点 → 4.3 功能缺口 🟡 | ✅（附 🟡） |

**模块4 结论：通过（审计 🔴 2 项降级；附 🟡 待补 UI）。**

### 模块5 搜索增强 + 评论互动（`search-enhance.api.ts`、`pages/search/**`、`cm-comment/**`、`cm-simi/**`）

| 检查项 | 证据 | 结论 |
|---|---|---|
| ① 存在性 | `search-enhance.api.ts` 4 URL：L90 `/search/hot`、L94 `/search/hot/detail`、L107 `/search/suggest`、L121 `/search/multimatch`；`cm-comment.api.ts` `CM_COMMENT_ROUTE`(L25-33) 7 路由 + L147 `/comment/new`、L160 `/comment/hot`、L177 `/comment/floor`、L196 `/comment/hug/list`、L209 `/comment/like`、L230 `/comment`；`cm-simi.api.ts` 5 URL：L43/49/53/57/63；server 对应 module 文件均在全量清单（`comment_hug_list.js`、`comment_new.js`、`simi_*.js` 等） | ✅ |
| ② 非占位 | 全部真实封装；`CM_COMMENT_ROUTE` 被 `getCommentList`(L133) 真实使用；`cm-simi` 5 个 `getSimiXxx` 经 `fetchSimi`(L66-84) 分发、`cm-simi.vue:85` 真实调用，非死代码；`search.vue`/`search.service.ts` 真实调用 `queryMultimatch`(L141)，`getSearchHot`/`getSearchHotDetail`/`getSearchSuggest` 经 `header.service.ts:92/93/118` 调用；`cm-comment.vue` 发评/点赞/楼层/赞列表/热评/最新均为真实逻辑 | ✅ |
| ③ 契约吻合 | 路径精确一致（含 `/comment/hug/list`、`/comment/like`、`/search/hot/detail`）；发评走 `/comment`（`comment.js`）、`comment_new` 用于列表刷新，与 server 语义自洽（spec 措辞偏差见待确认项） | ✅ |

**重点复核 · `cm-comment` 双模式兼容既有 `v-for :commentVO` 用法：兼容 ✅**
- props（`cm-comment.vue:108-129`）：`commentVO`(Object, **default undefined**)、`type`(默认 `'music'`)、`id`(Number/String, default undefined)、`threadId`。
- 模式判定（L132-134）：`isContainer = !props.commentVO && props.id != null && props.id !== ''`。传 `commentVO` ⇒ 单条模式；不传 `commentVO` 但传 `type+id` ⇒ 容器模式。
- 单条模式（L143-150、L162-168）：`singleList = [{ ...commentVO }]` → `renderList` 渲染 1 条；`loadComments()` 首行 `if (!isContainer.value) return;`（L172），容器数据请求不会在单条模式触发，`watch([type,id], loadComments)` 同样被 guard 拦截 ⇒ **既有页面不会重复拉列表、不会被容器 UI 覆盖**。
- 既有 `v-for :commentVO` 调用点（Grep 全 src 确认）：`mvplay.vue:21-35`、`playlist/playlist-detail/playlist-detail.vue:47-64` 均 `:commentVO="item"` + `type` + `:id`。
- 容器模式调用点：`album-detail.html:57`、`artist/artist-detail/artist-detail.html:102`、`music-detail/music-detail.vue:30`（仅 `type` + `:id`）。
- 结论：**两种模式均被实际使用，props 与判定逻辑同时兼容，既有 `v-for :commentVO` 用法未被破坏**。
- 观察（非偏离）：既有单条模式调用点同时传了 `type`/`id`，故 `canInteract=true`(L136-138)，单条评论上会额外显示「赞/查看楼层/赞过的人」按钮；属能力增强，点赞/楼层请求以该资源 `id` 发起，语义自洽。

**模块5 结论：通过。**

---

## 二、🟡 7 项「封装函数无人调用」复核结果

复核方法：对每项同时 Grep **函数名**与 **URL 字面量**全 `src`，并 Read 抽查相关 UI（`playlist-form-dialog.vue`、`my-playlist.vue`、`playlist-detail.vue`、`user-edit-dialog.vue`），区分「真死代码 / 审计漏检 / 既有老接口」。

| # | 函数 / URL | 文件:行号 | 函数名 Grep | URL 字面量 Grep | UI 复核 | 判定 |
|---|---|---|---|---|---|---|
| 1 | `deletePlaylist` / `/playlist/delete` | `playlist-manage.api.ts:118-119` | 仅定义行 | 仅定义行 | `my-playlist.vue` 仅「新建歌单」+列表，无删除按钮 | **真死代码 → 3.2 功能缺口 🟡 待补 UI** |
| 2 | `getPlaylistSubscribers` / `/playlist/subscribers` | `:126-130` | 仅定义行 | 仅定义行 | `playlist-detail.vue` 操作栏无「收藏者」入口 | **真死代码 → 3.2 功能缺口 🟡 待补 UI** |
| 3 | `updatePlaylistCover` / `/playlist/cover/update` | `:154-158` | 仅定义行 | 仅定义行 | `playlist-form-dialog.vue` 编辑字段仅名称/简介/标签，无封面 | **真死代码 → 3.3 功能缺口 🟡 待补 UI** |
| 4 | `updatePlaylistPrivacy` / `/playlist/privacy` | `:162-163` | 仅定义行 | 仅定义行 | 隐私单选仅在「创建」模式作为 `createPlaylist` 入参（`:18-23`），编辑模式无隐私修改 | **真死代码 → 3.3 功能缺口 🟡 待补 UI** |
| 5 | `updatePlaylistOrder` / `/playlist/order/update` | `:166-167` | 仅定义行 | 仅定义行 | `cm-table` 仅 `showRemove`/`@remove`，无拖拽排序 | **真死代码 → 3.3 功能缺口 🟡 待补 UI** |
| 6 | `getUserBinding` / `/user/binding` | `user.service.ts:101-104` | 仅定义行 | 仅定义行 | `user-edit-dialog.vue` 仅 `updateUser`(L76)，无绑定列表展示 | **真死代码 → 4.3 功能缺口 🟡 待补 UI** |
| 7 | `getNewDVDList` / `/top/album` | `portal-request.service.ts:60-64` | 仅定义行 | 仅定义行 | — | **真死代码，但属 tasks.md 标注「前端已接入」的既有老接口，非 P0 净新增**，仅记录备查，不判功能缺口 |

**结论汇总**
- **真死代码（封装 + URL 双重无调用点）**：7 项全部属实，**无一项为「审计漏检」**（不存在页面绕过封装直连 URL 的情况）。
- **P0 契约范围内的功能缺口（6 项）**：歌单 5 项（3.2 删除/收藏者、3.3 封面/隐私/顺序）+ 用户 1 项（4.3 绑定列表）。按用户口径，**端点与封装齐全、server module 齐全，判 🟡 待补 UI，不判 🔴 阻断**。
- **新增缺口（审计未列，本次独立发现，2 项）**：`bindingCellphone`、`uploadAvatar`（见 §三）端点已补齐但 UI 未接入，性质同上，亦记 🟡 待补 UI。
- **非死代码（反向抽查，确认审计未误判）**：`cm-simi` 5 个 `getSimiXxx` 经 `fetchSimi` 分发被调用；`search-enhance` 4 项经 `header.service.ts`/`search.service.ts` 调用；`loginRefresh` 经 `header.ts:171` 调用；`search` 多重匹配 UI 在 `search.vue:4-16` 真实渲染。

---

## 三、与 integration-audit.md 的独立复验差异（重要）

审计报告（`.sdd/integration-audit.md`）判定「🔴 阻断 = 2（`user_bindingcellphone`、`avatar_upload` 前端未接入），不予放行」，依据为「Grep `bindingcellphone|avatar_upload|avatar/upload` 在 `src` 下 0 命中」。

**以当前工作树独立 Grep 事实为准，该项结论已不成立：**

| 复核点 | 审计结论 | 当前事实（本机 Grep/Read） |
|---|---|---|
| `/user/bindingcellphone` 字面量 | 缺失 | `user.api.ts:27` `绑定手机 = '/user/bindingcellphone'` ✅ 存在 |
| `/avatar/upload` 字面量 | 缺失 | `user.api.ts:28` `上传头像 = '/avatar/upload'` ✅ 存在 |
| `user_bindingcellphone` 封装 | 缺失 | `user.service.ts:107-110` `bindingCellphone()` 真实 `postRequest` ✅ |
| `avatar_upload` 封装 | 缺失 | `user.service.ts:113-118` `uploadAvatar()` 真实 `FormData`+`postFormRequest` ✅ |
| server module | 存在 | `user_bindingcellphone.js`、`avatar_upload.js` 均在 `module/*.js` 清单 ✅ |
| 类型定义 | — | `user.api.ts:176-205` `UC_IBindingCellphone`/`UC_IAvatarUpload` 等齐备 ✅ |
| UI 调用点 | — | **无**（`user-edit-dialog.vue` 仅 `updateUser`）→ 性质转为 🟡 待补 UI |

- 判定：**🔴 2 项降级为 0；端点/封装/server 三方齐全，契约吻合项通过**。推测为集成审计之后实现者补齐了端点（本次不核验变更时点，见待确认项）。
- 与此同时，这两个新增封装函数本身「无人调用」，与歌单 5 项同类，应计入 🟡 待补 UI（4.3 契约功能缺口）。

---

## 四、server 路由真源核对

- 独立执行 `ls module/*.js | sed` 取得全量 **309** 个文件名（去扩展名），逐一对照五模块 68 个契约接口（下划线逐段转斜杠）：
  - 模块2 12/12、模块3 18/18、模块4 19/19、模块5 19/19 均能找到对应下划线文件。
  - 重点确认易漏文件：`homepage_block_page.js`、`login_qr_key.js`、`comment_like.js`、`comment_hug_list.js`、`playlist_cover_update.js`、`playlist_highquality_tags.js`、`search_hot_detail.js`、`user_bindingcellphone.js`、`avatar_upload.js`、`simi_user.js` 全部存在。
- **孤儿端点 = 0**（前端所有 URL 字面量反推的文件名均在清单中）；**路径斜杠化无下划线残留**；与审计报告「孤儿 0 / 路径不吻合 0」一致。

---

## 五、待确认项（不阻断本卡点）

1. **审计结论与当前代码不一致的时点**：`user_bindingcellphone`/`avatar_upload` 端点在审计后被补齐，建议与集成审计员/实现者同步变更时点，并据本报告更新 `integration-audit.md` 的 🔴 结论后重审归档。
2. **build 门阻断（范围外，本报告不判）**：`.sdd/build-gate.md` 记 `npm run build` 退出码 1（`vite.config.ts` 的 `rollupOptions.input` 引用不存在的 `pConfigurationPage.html`）。本卡点约束「不跑构建」，未复跑、未改 `vite.config.ts`；`vue-tsc --noEmit` 退出码 0 已由构建门报告确认。是否放行归档需由用户本地处理该入口后再定。
3. **契约 method / 入参名无法逐字比对**：`tasks.md`/`spec.md` 未给出 method、入参名字面约束，真源仅 module 文件名。观察到前端适配性入参差异（`cm-comment.api.ts:198` `getCommentHugList` 用 `sid` 而非 `id`；`cm-simi.api.ts:57` `getSimiMv` 用 `mvid`；`cm-comment.api.ts:14-22` `CM_COMMENT_TYPE_NUM` 数字映射），均为前端内部自洽写法，需联调阶段（任务 6.1）以真实响应验证，本卡点不判偏离。
4. **spec 措辞偏差**：`specs/comment-interaction/spec.md:17` 以 `comment_new` 指代「发评」，而 server `comment_new.js` 为新版评论列表；前端注释（`cm-comment.api.ts:218-221`）已说明发评走 `/comment`、`comment_new` 用于列表刷新，两端点均存在且 server 有 `comment.js`/`comment_new.js`，实现自洽，建议修订契约文本（与审计报告一致）。
5. **tasks.md 口径**：`:45`「规划点 68 / 扣除 5 个已用 / 净新增约 63」与按任务条目逐条计数 68 的口径差异，不影响端点判定（与审计报告一致）。
6. **既有遗留**：`playlist-detail.service.ts:69` 类型错误已由构建门报告确认修复为 `{ code: 0 }`（`vue-tsc` 通过），本卡点未复跑。

---

## 六、总判定

| 强制检查项 | 五模块结果 |
|---|---|
| ① 存在性 | 5/5 通过（68 契约端点 URL + 导出函数 + 页面路由均定位到文件；server 文件名齐全；孤儿端点 0） |
| ② 非占位 | 5/5 通过（api 封装全部真实请求；组件/页面真实接数据；两个重点组件均非空骨架） |
| ③ 契约吻合 | 5/5 通过（路径与下划线→斜杠精确一致，无残留 URL；🔴 偏离 0） |

- **🔴 阻断数 = 0**：integration-audit.md 的 2 项经独立复验已不成立（端点/封装/server 齐全）。
- **🟡 待补 UI（不阻断）**：P0 契约 3.2/3.3/4.3 共 **8 项**功能缺口（歌单 5 + 用户 3：`getUserBinding`/`bindingCellphone`/`uploadAvatar`），端点与封装齐全、仅缺 UI 入口；另有 1 项既有老接口 `getNewDVDList` 死代码仅记录。
- **两个重点复核**：`portal-block-page.vue` 已被 `portal.ts` 注册且 `portal.html` 挂载 ✅；`cm-comment` 双模式兼容既有 `v-for :commentVO` 用法 ✅。

### **总判定：通过（卡点③ 三条强制检查项全部通过；附 🟡 待补 UI 与待确认项，建议归档前同步修正审计 🔴 结论并处理 build 门范围外阻断）**
