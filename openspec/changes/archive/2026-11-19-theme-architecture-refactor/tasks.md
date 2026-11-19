# Tasks

## 1. 基础设施：官方暗色与选择器

- [x] 1.1 `main.ts` 样式引入顺序改为 `element-plus/dist/index.css` → `element-plus/theme-chalk/dark/css-vars.css` → `@/assets/css/index.less`；验证 dev 启动无样式加载报错，且 `curl` 页面 HTML 首帧含正确 `class="dark"`（深色档）
- [x] 1.2 首屏防闪脚本在写 `dataset.theme` 的同时写 `document.documentElement.classList.toggle('dark', dark)`；验证 localStorage 为 `theme: 'dark'` 时首帧 DOM 同时有 `data-theme="dark"` 与 `class="dark"`，无白闪
- [x] 1.3 `store/setting.ts` 的 `applyTheme()` 同步写 `class="dark"`，与首屏逻辑对齐；验证三档切换后 `<html>` 的 `data-theme` 与 `class` 始终一致，跟随系统档在系统切换时同步响应

## 2. 令牌层：三层结构与去 !important

- [x] 2.1 重写 `theme.css` 为 L1 色板（仅 `:root`，不随主题变）/ L2 语义令牌（`:root` 浅、`html.dark` 深）/ L3 EP 映射（`--el-*` 引用 L2）；验证令牌名集合与改造前一致，70+ 消费点无需改动
- [x] 2.2 删除 `theme.css` 中 `:root` 与 `html.dark` 的全部 `!important`；验证全局搜索该文件 `!important` 结果为零，且 dev 下浅色档页面配色与改造前截图一致
- [x] 2.3 在 L3 将 `--el-color-primary` 系列重映射为品牌红（覆盖官方暗色文件的 `#409eff`）；验证 dark 档下 EP 按钮、链接、分页高亮均为品牌红而非默认蓝
- [x] 2.4 `isDark` 加用途注释，保持零消费点不变；验证 store 类型检查通过、无新增引用

## 3. 硬编码与 EP 覆盖收口

- [x] 3.1 `views/api-coverage/api-coverage.vue:619`、`views/header/header-loginform/header-loginform.vue:200,261`、`views/new-capabilities/new-capabilities.vue:393` 的白底改为 `var(--color-default)`；验证全局搜索 `background.*(#fff|white)` 在这四个文件中结果为零，dark 档下无白块
- [x] 3.2 `assets/css/reset-elementplus/el-message.less` 的 `color: rgba(0,0,0,0.65) !important` 改为语义令牌并评估 `!important` 是否可去；验证 light / dark 两档 message 文字对比度正常，消息框样式未被 EP 覆盖

## 4. 集成回归

- [x] 4.1 三档切换回归：light / dark / system 逐档切换并刷新，验证持久化生效、system 档跟随系统变化、首帧无白闪
- [x] 4.2 核心页深浅截图比对：首页 / 歌单详情 / 搜索 / 用户中心 / 能力中心，验证无白块、无黑字、无对比度异常
- [x] 4.3 EP 组件清单验证：dialog / message / loading / table / pagination / input / slider / tag，验证 dark 档下背景、文字、边框均走暗色令牌，品牌红正确
- [x] 4.4 跑通 `npm run build`（项目实际包管理器）与类型检查，验证无编译错误、无样式丢失

## Workflow follow-up

- 上述回归通过且经 review 后，由 `/openspec-archive-change` 归档本 change。
