# Tasks

## 1. 依赖升级与工程化地基（D4 + D9 + D10 + D11）

- [x] 1.1 升级 `package.json` 依赖：`vite`→5.x、`@vitejs/plugin-vue`→5.x、`vue`→3.5.x、`vue-router`→4.4+、`element-plus`→2.9.x、`typescript`→5.x、`vue-tsc`→2.x、`less`→4.2+、`unplugin-auto-import`→0.18+、`unplugin-vue-components`→0.27+、`axios`→1.x；移除 `vuex`+`rxjs`；新增 `pinia`、`pinia-plugin-persistedstate`、`eslint`、`@eslint/js`、`typescript-eslint`、`eslint-plugin-vue`、`eslint-config-prettier`。验证：`npm install` 成功，版本符合目标。
- [x] 1.2 新增 `eslint.config.js`（flat config：`@eslint/js` + `typescript-eslint` + `eslint-plugin-vue` 的 `vue3-recommended` + `eslint-config-prettier` 关闭风格规则）；`package.json` 加 `lint`/`lint:fix` scripts。验证：`npm run lint` 能跑出报告（首跑允许报错）。
- [x] 1.3 `tsconfig.json` 在 `strict: true` 基础上补 `noUnusedLocals` / `noUnusedParameters` / `noImplicitReturns` / `noFallthroughCasesInSwitch`。验证：开启后 `vue-tsc --noEmit` 能报出未用项（与 1.6 一并清理）。
- [x] 1.4 为 `src/services/request.ts` 增加 axios 拦截器：请求拦截注入 cookie token（复用 `core/token` 的 `FGetCookie`），响应拦截做错误归一；保留 `src/config/request.ts`（网关配置）与 `pages/portal/services/portal-request.service.ts`（业务 service，归 D6 改造）不删。验证：全项目请求经统一实例、token 自动注入、`npm run build` 无未解析模块。
- [x] 1.5 审计并优化 `vite.config.ts`（vite 2→5）：修正废弃选项；`build.rollupOptions.output.manualChunks` 做 vendor 分包（vue / vue-router / element-plus / pinia 各自成块）；`build.minify='terser'` + `drop_console`（保留 warn/error）；`css.preprocessorOptions.less.javascriptEnabled=true`；`build.sourcemap` 按环境变量；调高 `chunkSizeWarningLimit`。验证：`npm run build` 成功且产物含 vendor 分包 chunk。
- [x] 1.6 跑 `npm run build`（含 `vue-tsc --noEmit`）+ `npm run lint`，修复全部类型/未用变量/风格报错，确保双绿。验证：build 与 lint 均无 error 退出。（已清 47 个 lint error：四件套 props 冗余 toRef 转发、3 处 prop default 工厂、env.d.ts / user.api.ts 空类型、空 catch、async Promise executor、`.native`、保留组件名 `Header`、v-for key；`vue-tsc` 0 error，`npm run lint` 0 error）

## 2. 去 RxJS（D3）

- [x] 2.1 替换 6 个 service 的 `BehaviorSubject`→`ref`、`.next(v)`→直接赋值（含 `play-controller.service.ts` 的 `musicDetail$` 等），删除 rxjs 引用。验证：`grep -rln rxjs src` 仅剩组件部分（2.2 处理）。
- [x] 2.2 替换 8 个组件的 `Subject + takeUntil`：改用 `watch(ref)` / `storeToRefs` 直读响应式 state，确需订阅处用 `watch` + `onUnmounted` 兜底。验证：`grep -rln "takeUntil\|from 'rxjs'\|from \"rxjs\"" src` 全项目为 0；build+lint 绿。
- [x] 2.3 删除 `src/views/demo.vue`（及路由表引用）。验证：路由表与 import 无 demo 残留，build 通过。

## 3. Pinia 状态层重写（D1 + D2 + D5）

- [x] 3.1 创建 `src/stores/playlist.ts`（`usePlaylistStore`）：`musicList: PL_IPlayVO[]` 为队列唯一真相源，合并原 `Player._musicList` 与 `PlayListService._musicList`；actions `addMusic` / `removeMusic` / `queryMusicUrl` / `loadFromStorage`；`pinia-plugin-persistedstate` 接 `localStorage['cloud-music-list']`。验证：组件 `usePlaylistStore()` 可读写，旧 localStorage 数据能被加载。
- [x] 3.2 创建 `src/stores/player.ts`（`usePlayerStore`）：`audioEl: shallowRef<HTMLAudioElement|null>` + `bindAudio(el)`；state `musicVO/currentIndex/isPlaying/playTypeIndex/playTimestamp/progress/dragging/errorList[]`；getters `playTypes` / `currentMusic`；actions `play/switchMusic/switchPlayType/switchPlayStatus/switchIsMute/setVolume/onTimeUpdate/seek/onEnded/onError/getSongLyric/downloadMusic`。验证：`bindAudio` 后 `play()` 能驱动 `<audio>` 播放，Vue DevTools 可观测状态。
- [x] 3.3 创建 `src/stores/lyric.ts`（`useLyricStore`）：`lrcList` / `lrcPanel`、getter `showLyc`、actions `parse` / `reset`。验证：`getSongLyric` 后 `lrcList` 被正确解析。
- [x] 3.4 创建 `src/stores/user.ts`（`useUserStore`）：`token` / `profile` / `isLogin`，迁移 `UserService` + `core/token` 的 cookie 逻辑；actions `login` / `logout` / `fetchProfile`（按当前设计 user 不持久化，Open Question 留待后续）。验证：登录后 `isLogin=true` 且 `profile` 可读取。
- [x] 3.5 `main.ts` 挂载 pinia（含 persistedstate 插件）；删除 `src/store/index.ts`（空 vuex）与 `play-controller.service.ts` / `play-list.service.ts` 两个旧单例；`Player` / `PlayListService` 调用方（play-controller、play-list.vue、cm-table）全部改为 store，登录态收敛到 `useUserStore`。验证：`grep -rln "new Player()\|PlayListService\|UserService" src` 为 0（或仅保留已迁入口），build 通过。
- [x] 3.6 迁移杂项：`formatDuration` 统一用 `core/utils`（删 Player 内重复实现）；`PLAY_TYPE` / `playTypes` 降为模块级常量；persistedstate 沿用 `cloud-music-list` / `cloud-play-index` 旧 key。验证：用旧版本写入的 localStorage 在新构建下仍能被加载还原，老用户播放列表与索引不丢。

## 4. service → hooks 改造（D6）

- [x] 4.1 抽取通用 composables（`src/composables/`）：`useRequest`（基于 1.4 统一 request，封装 loading/error）、`usePagination` / `useInfiniteList`、`usePlayer`（包 player store）、`useAuth`（包 user store）、`useLyric`（包 lyric store）。验证：至少两个页面引用 `useRequest` / `usePagination`，功能正常、loading 态可控。
- [x] 4.2 页面级 `*.service.ts`（约 28 个 class 状态层）改写为 `use*` composables：原私有 `ref` 字段 + getter → `setup` 内 `ref` / `computed`，方法 → `const` 箭头函数；调用方 `new Xxx()` → `useXxx()`。验证：`grep -rln "new .*Service()" src` 为 0（保留纯 api/service 工具调用）；build+lint 绿。
- [x] 4.3 保留纯 `*.api.ts` 与无状态工具模块（`common.service.ts`、`file-download-upload.service/*` 等）不作 hook 化，仅随去 RxJS / 合并做必要清理。验证：这些文件仍可正常被 import，无重复逻辑。

## 5. 组件合并与页面拆分（D7 + 拆分 + D8）

- [x] 5.1 四件套组件（`.vue` + `.html` + `.ts` + `.less` + `register.ts`）合并为单文件 `.vue`（`<template>` / `<script>` / `<style lang="less" scoped>`），原 `register.ts` 全局注册改为 `import.meta.glob` 按目录自动注册。验证：18 组四件套已合并、54 个旧文件 `git rm`，`vue-tsc --noEmit` 0 error，`npm run lint` 0 error（181 warning），`vite build` 通过。（合并后模板从运行时编译变为编译期类型检查，暴露并修复 18 处历史类型错：`AlbumVO.artist` 扁平结构、`AlbumSongVO.al/ar`、`ArtistVO.artist.musicSize/albumSize`、`MvVO.imgurl16v9`、`BannerVO.url`、`PlayListVO.tracks.ar`、`cm-mv-card` duration 改 Number、`cm-playlist-card` id 改 number、`album-detail` 补 `onPlay`）
- [x] 5.2 拆分单体页面为展示型子组件（单文件 `.vue`），逻辑抽入 hooks。验证：拆分后交互行为不变，build 通过。
  - `user-supplement` 844 → 页面 60 行 + `components/supplement-{read,cloud,playlist}-panel.vue` + `use-supplement.ts`（卡片归一 / 登录与写操作守卫 / 写操作执行器）
  - `play-interaction` 775 / `account-profile` 766 / `ugc-listentogether` 751 / `cloud-disk` 653 / `discovery` 729 / `fanscenter-digitalalbum` 698 / `misc-longtail` 699 共 7 个「接口清单」页结构同构，抽出共用件后每页只剩骨架（约 60–90 行）：
    - `src/components/cm-api-block/cm-api-block.vue` 区块渲染（头信息 / 输入 / 文件 / 按钮 / 卡片 / 原始返回）
    - `api-block.types.ts`（`ApiBlock` / `BlockState` / `BlockCard`）、`api-block.util.ts`（列表归一 `normalize`、`pretty`、`captureProvided`）、`use-api-console.ts`（参数池 + 每区块请求态 + 登录降级 + 写操作二次确认 + 分组自动加载）
    - 每页仅保留 `<page>.blocks.ts`（纯数据：tabs + 接口定义 + 参数链路）
    - 三页重复的 `pg--` 骨架样式合并到 `src/assets/css/api-console.less`，由 `assets/css/index.less` 引入一次（原先三份 scoped 样式各 90 行、四页各含 ~120 行 `pblock` 样式）
- [x] 5.3 统一代码风格（D8）：函数一律 `const` 箭头声明，关键逻辑补中文注释；全量 `npm run lint:fix` + 人工复核。验证：`npm run lint` 0 error 0 warning；`grep "^\s*function "` 为 0。
  - 58 处 `function` 声明全部改为 `const` 箭头
  - 85 处「catch 变量未使用」改为可选 catch 绑定（`} catch {`）
  - 3 处 `defualt`（拼写错误导致 prop 默认值失效）改为 `default`
  - `cm-navbar` 补 `emits: ['update:selectedCode', 'change']`
  - 6 处富文本 `v-html`（评论 / 歌手简介 / 歌词）补 `eslint-disable-next-line` 并注明来源

## 6. 集成验证

- [ ] 6.1 全量 `npm run build` + `npm run lint` 绿；本地 `npm run preview` 验证登录链路、播放/暂停/切歌、歌词解析、进度、队列持久化（刷新不丢）、路由跳转资源加载（`manualChunks` 不破首屏）。验证：上述交互逐项手测通过，控制台无报错。

## Workflow follow-up

- 待 `p1`(24/25)、`p2`(19/20) 归档后再启动本 change 实施（或按你的决定）。
- 实施完成后执行 `openspec archive` 归档本 change。
