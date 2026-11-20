# Tasks

## 1. 试点：useAlbumDetail（15 处、单文件）

- [ ] 1.1 `useAlbumDetail` 的 15 个 `_` 前缀状态改为同名 `ref`，删除 getter/setter 层；验证：文件内不再出现 `_` 前缀标识符
- [ ] 1.2 `album-detail.vue` 由整对象访问改为解构，脚本内读写补 `.value`；验证：`vue-tsc --noEmit` 无报错
- [ ] 1.3 冒烟专辑详情页：数据渲染、tab 切换、收藏交互；验证：与改造前表现一致
- [ ] 1.4 固化范式并记录：解构位置、`.value` 边界、模板写法差异；验证：后续 7 个 hook 照此执行

## 2. 逐 hook 推进（按访问点从少到多）

- [ ] 2.1 `useMvPlayer`（3 处，`useMvplayView.ts`）；验证：MV 播放页可播放、评论加载
- [ ] 2.2 `usePlayListDetail`（10 处，`usePlaylistDetailView.ts`）；验证：歌单详情渲染与分页
- [ ] 2.3 `useSearch`（18 处，`search.vue`）；验证：换关键词重查、类型 tab 切换
- [ ] 2.4 `useUserCenter`（20 处，`user.vue` + 3 个子组件）；验证：个人中心 4 个 tab 与关注操作
- [ ] 2.5 `useLogin`（21 处，`header-loginform.vue`、`useHeaderView.ts`、`user.vue`）；验证：手机/邮箱/二维码三种登录、表单双向绑定
- [ ] 2.6 `useDjRadioDetail`（26 处，`dj-radio-detail.vue`）；验证：电台详情渲染与订阅
- [ ] 2.7 `useHeader`（32 处，`header.vue`、`useHeaderView.ts`）；验证：搜索建议、热搜面板、导航高亮

## 3. 中间层与重复状态

- [ ] 3.1 `useHeaderView` 不再返回 `header` 对象，改为透传解构出的 refs；`header.vue` 同步改为直接访问；验证：头部 9 个状态全部正常，无 `header.` 残留
- [ ] 3.2 `search.vue` 的 `keyword` 重复状态合并到 `useSearch`，删除页面 `computed`；验证：换词重查触发时机与改造前一致
- [ ] 3.3 `user.vue` 的 `uid` / `recordType` 重复状态合并到 `useUserCenter`，删除页面本地 `ref` 与回写；验证：路由切换时用户主页正确刷新

## 4. 验收

- [ ] 4.1 全局检索确认 `_` 前缀状态为 0，`reactive({` 在 hook 返回中为 0
- [ ] 4.2 `vue-tsc --noEmit`、`eslint`、`vite build` 全部通过
- [ ] 4.3 冒烟清单逐项通过：首页头部搜索、用户中心 4 页、搜索页换词、MV 播放、专辑详情、电台详情、歌单详情
- [ ] 4.4 `v-model` 双向绑定逐个手动输入验证：头部搜索框、登录表单、用户资料表单
- [ ] 4.5 `openspec validate hook-state-normalization` 通过
