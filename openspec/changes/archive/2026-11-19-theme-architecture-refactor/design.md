# Design

## Context

动机见 `proposal.md` - Why。当前主题实现的关键事实：

- EP 2.9.0，`main.ts` 仅引入 `element-plus/dist/index.css`；官方暗色文件 `theme-chalk/dark/css-vars.css` 已存在于依赖但未被引入，其选择器为 `html.dark`，并会把 `--el-color-primary` 重置为 `#409eff`
- 主题状态在 `store/setting.ts`：`ThemeMode = light | dark | system`，`applyTheme()` 写 `document.documentElement.dataset.theme`，`main.ts` 在挂载前读 `localStorage['cloud-setting']` 先写一次以防白闪
- `assets/style/theme.css`：`:root` 定义约 34 个令牌全部带 `!important`，`:root[data-theme='dark']` 手写 14 个 `--el-*` 暗色映射并同带 `!important`，靠更高特异性取胜
- 70+ 文件消费 `var(--color-*)`，令牌名是既有契约
- `isDark` 在 store 中导出但零组件消费
- 硬编码白底 4 处；`el-message.less` 有 `color: rgba(0,0,0,0.65) !important`

## Goals / Non-Goals

**Goals:**

- 消除项目自管暗色映射与 EP 官方机制的双轨
- 去掉 `!important`，让覆盖关系由层叠顺序决定而非特异性博弈
- 令牌分三层，令牌名不变，消费点零改动
- 深色首帧不白闪

**Non-Goals:**

- 不改变三档切换、持久化、系统跟随的行为契约
- 不新增主题档位、不引入主题编辑器或自定义配色
- 不改动图片/封面资源本身（封面是照片，不做反色）
- 不做逐组件重写，仅在硬编码处收口

## Decisions

### D1：选择器统一到 `html.dark`，保留 `data-theme`

- 决策：`applyTheme()` 同时写 `document.documentElement.classList.toggle('dark', dark)` 与原有 `dataset.theme`。
- 理由：EP 官方暗色文件只认 `html.dark`；保留 `data-theme` 避免动到已有判断与首屏脚本的语义，且便于调试时一眼看到主题态。
- 备选：仅用 `data-theme` 并继续手写 `--el-*` 映射 —— 否决，双轨与手工维护正是本次要消除的问题。改用 `class` 完全替换 `data-theme` —— 否决，收益为零、改动面更大。

### D2：引入官方 dark css-vars.css，并在其后重映射品牌红

- 决策：`main.ts` 引入顺序为 `element-plus/dist/index.css` → `element-plus/theme-chalk/dark/css-vars.css` → `@/assets/css/index.less`。项目令牌表置于最后，覆盖 `--el-color-primary` 系列为品牌红。
- 理由：官方文件负责全量 EP 暗色令牌，项目只负责品牌差异；顺序保证项目覆盖生效。
- 备选：继续手写 14 个映射 —— 否决，EP 升级新增令牌时不会跟进，暗色组件会漏。

### D3：删除 `!important`，靠加载顺序解决覆盖

- 决策：`theme.css` 的 `:root` 与 `[data-theme='dark']` 全部去掉 `!important`。项目样式入口在 EP 之后引入，同特异性后者胜。
- 理由：`!important` 使任何下游覆盖都要再加 `!important`，是特异性军备竞赛的根源。
- 备选：保留 `!important`、只统一选择器 —— 否决，未解决核心问题。
- 约束：`el-message.less` 等 EP 覆盖样式中的 `!important` 单独评估，能去则去，去后须验证消息框仍正确。

### D4：令牌分三层，令牌名不变

- 决策：`theme.css` 结构改为 L1 基础色板（仅 `:root`，不随主题变）→ L2 语义令牌（`:root` 浅色值，`html.dark` 深色值）→ L3 EP 映射（`--el-*` 引用 L2）。
- 理由：70+ 消费点只认 `--color-*`，改名会造成大范围改动且无行为收益；分层后主题切换只需改 L2。
- 备选：全量重命名令牌为 `--surface-*` / `--fg-*` 等 —— 否决，超出本次范围。

### D5：`isDark` 保留但标注用途

- 决策：暂不删除，加注释说明供需要区分明暗的组件（如深色黑胶）使用；本 change 不新增消费点。
- 理由：删除是净收益很小的清理，若后续黑胶分支需要又要加回；保留不产生运行时成本。

### D6：不做主题切换过渡

- 决策：不添加任何主题切换动画，原 tasks 3.3 取消。
- 理由：`assets/css/reset.less` 明确约定「主题切换时不做整页过渡，避免大面积闪烁；需要过渡的组件各自声明」。给根元素加 `transition` 会违背该约定并触发大面积闪烁；逐组件加过渡超出本 change 范围。
- 备选：View Transitions API 做一次性快照渐变 —— 否决，引入新机制，超出范围。

## Risks / Trade-offs

- [删 `!important` 后 EP 内部样式反向覆盖项目样式] → 全量视觉回归：3 档 × 核心页截图比对，重点 EP 组件清单
- [官方暗色文件把主色重置为 `#409eff`] → 项目令牌表在官方文件之后加载，并明确重映射 `--el-color-primary` 系列；验证 dark 下按钮/链接仍为品牌红
- [首屏防闪脚本只写 `data-theme`] → 同步写 `html.dark`，并与 store 的 `applyTheme()` 逻辑保持一致（抽公共判断或直接对齐两处）
- [系统主题切换监听泄漏] → 保持现有 `addEventListener('change')`，本次不改生命周期
- [4 处硬编码白底收口后仍可能遗漏] → 以全局搜索 `background.*(#fff|white)` 归零为验收条件之一

## Migration Plan

1. 基础设施：改 `main.ts` 引入顺序 + 官方暗色文件；首屏脚本与 `applyTheme()` 双写 `class="dark"`
2. 令牌层：重写 `theme.css` 为三层结构、去掉全部 `!important`、重映射品牌红
3. 收口：4 处硬编码白底、`el-message.less` 黑字、`el-message.less` 的 `!important`
4. 回归：3 档 × 核心页（首页 / 歌单详情 / 搜索 / 用户中心 / 能力中心）× EP 组件清单，深浅截图比对
5. 回滚：单 commit 完成，出问题 `git revert`；令牌名未变，回滚不涉及其它文件

## Open Questions

无。品牌红在 dark 下的具体色值沿用现有 `--color-primary: #c20c0c`，不做视觉重新设计。
