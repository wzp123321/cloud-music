# Proposal

## Why

cloud-music 已有可用的深色模式（三档切换、持久化、首屏防闪），但底层走的是自管 14 个 `--el-*` 暗色映射 + 全量 `!important` + 私有 `data-theme` 选择器，与 Element Plus 官方 `html.dark` 暗色机制双轨并存。映射靠手工维护、变量靠特异性博弈，样式扩展易引发难定位的覆盖问题；EP 升级也不会自动带来暗色修复。本次在行为契约不变的前提下重做主题底层架构，消除双轨与 `!important`。

## What Changes

- 引入 Element Plus 官方 `theme-chalk/dark/css-vars.css`，移除手写 `--el-*` 暗色映射
- 统一选择器为 `html.dark`；`data-theme` 保留供业务与首屏判断使用
- 品牌红在官方暗色文件之后重映射，避免 dark 下主色回退为 EP 默认蓝
- `theme.css` 删除全部 `!important`，改为三层令牌：L1 色板 / L2 语义 / L3 EP 映射；令牌名保持不变，消费点零改动
- 收口 4 处硬编码白底与 `el-message.less` 深色下的黑字
- 清理 store 中零消费的 `isDark`（或保留为后续深色黑胶分支）
- 首屏防闪脚本同步写 `html.dark`，避免深色用户首帧白闪
- **BREAKING**: 无，对外行为契约不变

## Capabilities

### New Capabilities
无

### Modified Capabilities
无

本次为纯内部架构重构：主题三档切换、localStorage 持久化、系统主题跟随、首屏防闪等行为契约均不变，无 spec 级行为变化，故在 `.openspec.yaml` 设置 `skip_specs: true`，不虚构需求。

## Impact

- 样式入口：`main.ts`、`assets/style/theme.css`、`assets/style/index.css`、`assets/css/index.less`
- 硬编码收口：`views/api-coverage/api-coverage.vue`、`views/header/header-loginform/header-loginform.vue`、`views/new-capabilities/new-capabilities.vue`、`assets/css/reset-elementplus/el-message.less`
- 状态层：`store/setting.ts`、`main.ts`
- 依赖：element-plus 2.9，`node_modules/element-plus/theme-chalk/dark/css-vars.css` 已存在
- 验证：3 档 × 核心页截图比对；EP 组件清单 dialog / message / loading / table / pagination / input / slider / tag
