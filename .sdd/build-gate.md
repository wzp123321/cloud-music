# 构建门结果报告（build-gate）

- 项目：`cloud-music-web`（`D:/workspace/private/collect/cloud-music/cloud-music-web`）
- 角色：构建阻断修复者
- 目标：修复 `src/pages/playlist/playlist-detail/playlist-detail.service.ts:69` 类型错误，并真实执行 typecheck 与 build
- 判定原则：一切以命令退出码为准，不凭主观判断

## 1. 环境信息

- node `v22.22.2` / npm `10.9.7`
- npm registry：`http://192.168.20.200:7049/repository/npm-public`（内网源，本次可用，未出现 403）
- `typescript` 4.7.3 / `vue-tsc` 0.34.17（`package.json` 声明 `^0.34.7`）
- vue-tsc 0.34.17 对 TS 4.7.3 会输出 `Please update to v0.35.0 or higher for TypeScript version: 4.7.3`，为版本兼容提示，非错误、不影响退出码
- 初始状态：`node_modules/vue-tsc/` 存在，但 `node_modules/.bin/vue-tsc` shim 缺失 → `npx vue-tsc` 无法调用

## 2. 类型错误根因（基线错误原文）

```
src/pages/playlist/playlist-detail/playlist-detail.service.ts(69,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'PM_IDynamicRes'.
  Property 'code' is missing in type '{}' but required in type 'PM_IDynamicRes'.
```

- `playlist-detail.service.ts:69` 原为 `new BehaviorSubject<PM_IDynamicRes>({})`，用空对象初始化。
- `PM_IDynamicRes`（`src/services/playlist-manage.api.ts:71-79`）中 `code: number` 为**必填**字段，其余字段可选 + `[key: string]: any`。
- `{}` 缺少 `code` → TS2345。`getPlaylistDetailDynamic` 返回 `Promise<PM_IDynamicRes>` 与 `queryDynamic()` 中 `this._dynamic$.next(res)` 类型一致，无其它不匹配；全量 typecheck 仅此一处报错。

## 3. 修复内容（最小修正）

- 仅改 `playlist-detail.service.ts:69`：`{}` → `{ code: 0 }`（1 行）。用合法占位初始值满足必填 `code`，不删功能、不 `any` 兜底、不 `@ts-ignore`，行为与原先空对象初始态一致（其余字段仍为 undefined）。
- `playlist-manage.api.ts` **未改**：`code: number` 是合理的接口响应契约，非根因，放宽为可选会掩盖契约。
- 未改其它任何源文件。注：`git status` 显示工作树内有大量其它 agent 的既有 `M` 改动及未跟踪目录，均非本次所改，未触碰。
- `npm install` 属构建环境补齐操作（步骤 4 授权），副作用限于 `node_modules/` 与 `package-lock.json`，非源码改动。

## 4. 执行命令与退出码（全部真实执行）

| # | 命令 | 阶段 | 退出码 | 说明 |
|---|------|------|--------|------|
| 1 | `npx vue-tsc --noEmit` | 修复前基线（标准命令） | **1** | `'vue-tsc' 不是内部或外部命令`（`.bin` shim 缺失），根本未进入类型检查 |
| 2 | `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit` | 修复前基线（等价 typecheck） | **2** | 复现真实类型错误 TS2345（第 69 行），见 §2 |
| 3 | `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit` | 修复后（与 #2 同命令对比） | **0** | TS2345 消失，仅剩版本提示 |
| 4 | `npm install --no-audit --no-fund` | 补齐依赖 | **0** | `added 2 packages, changed 18 packages`；输出多处 `npm warn cleanup Failed to remove some directories`（沙箱 safe-delete 守卫对临时目录的清理警告），不影响退出码 |
| 5 | `npx vue-tsc --noEmit` | 修复后标准命令 | **0** | `.bin` shim 补齐后标准命令可用且类型检查通过 |
| 6 | `npm run build` | 构建门 | **1** | 阻断，见 §5–§6 |

- 有效对比（同命令 #2 → #3）：**2 → 0**，目标类型错误消失。
- 标准命令对比（#1 → #5）：**1（命令不可用）→ 0（可用且通过）**。

## 5. build 错误输出摘要（`npm run build`，退出码 1）

`package.json` 的 build 脚本：`vue-tsc --noEmit && vite build --mode production`

```
> cloud-music-web@0.0.0 build
> vue-tsc --noEmit && vite build --mode production

Please update to v0.35.0 or higher for TypeScript version: 4.7.3
vite v2.9.15 building for production...
✓ 0 modules transformed.
Could not resolve entry module (pConfigurationPage.html).
error during build:
Error: Could not resolve entry module (pConfigurationPage.html).
    at error (D:\workspace\private\collect\cloud-music\cloud-music-web\node_modules\rollup\dist\shared\rollup.js:198:30)
    at ModuleLoader.loadEntryModule (D:\workspace\private\collect\cloud-music\cloud-music-web\node_modules\rollup\dist\shared\rollup.js:22631:20)
    at async Promise.all (index 1)
===BUILD_EXIT_CODE=1===
```

- `vue-tsc --noEmit` 阶段：通过（无类型错误输出；因 `&&` 短路，若此处失败则不会进入 vite build）。
- `vite build --mode production` 阶段：失败，退出码 1。

## 6. build 阻断根因（只读诊断，未改范围外文件）

- `vite.config.ts:51-54` 的 `rollupOptions.input` 配置了两个入口：
  `index: resolve(__dirname, './index.html')` 与 `admin: resolve(__dirname, './pConfigurationPage.html')`。
- 项目根目录仅有 `index.html`（Glob 确认），**`pConfigurationPage.html` 不存在** → `Could not resolve entry module (pConfigurationPage.html)`。
- 与任务预告的「缺 anymatch / chokidar 导致 vite.config.ts 加载失败」不同：`npm install` 成功后 vite.config.ts 已能正常加载、vite 正常启动并执行 build（已打印 `vite v2.9.15 building for production...`），失败点是 rollup 入口解析，属 **vite 配置 / 入口文件缺失**，既非本次类型错误，也非依赖缺失。
- 边界约束禁止修改 `vite.config.ts`、禁止新建 html 入口文件、禁止引入新依赖，故未擅自修复，也未用任何手段绕过。

## 7. 结论

- 类型错误：**已修复**，`vue-tsc --noEmit` 退出码 0（标准命令与等价命令均验证）。
- 构建门 `npm run build`：**阻断**（退出码 1）。
- 整体：**不判定为「通过」**（build 退出码非 0）。

## 8. blocking handoff：需用户本地验证

标记：**是**。build 门因范围外的 vite 入口配置问题阻断，需用户本地确认/处理后再复跑。

待确认项：
1. `pConfigurationPage.html` 是否本应存在于项目根目录（可能被 `.gitignore` 忽略或未提交）？若是，需补齐该文件。
2. 若该入口已废弃，是否应从 `vite.config.ts` 的 `rollupOptions.input` 移除 `admin` 项（范围外改动，需用户授权）。
3. `vite.config.ts:56` 为 `minify: 'terser'`，但 `package.json` 未声明 `terser`；修入口后 build 可能仍在该阶段受阻——本次在入口解析即失败，未触及该阶段，未验证，仅提示。
4. 工作树含大量其它 agent 未提交改动，建议用户本地基于干净/完整环境复跑 `npm run build` 复核。
5. vue-tsc 0.34.17 与 TS 4.7.3 的版本兼容提示非阻断，如需消除可评估升级（范围外）。

## 9. 阻断修复后复跑（本轮，真实执行）

- 角色：构建配置修复者；用户明确授权修 `vite.config.ts` 既有构建配置问题。
- 目标：`cd D:/workspace/private/collect/cloud-music/cloud-music-web && npm run build` 以退出码 0 结束。

### 9.1 修复内容（最小改动，仅 `vite.config.ts`）

| 位置 | 修复前 | 修复后 | 理由 |
|------|--------|--------|------|
| `rollupOptions.input` | `index` + `admin: ./pConfigurationPage.html` | 仅 `index` | `pConfigurationPage.html` 不存在、无对应源码、非本轮功能，删除该 input 项是最小且正确做法 |
| `build.minify` | `'terser'` | `'esbuild'` | `package.json` 未声明 `terser`；改用 vite 内置 esbuild，零新增依赖 |

- 取舍：优先选「零新增依赖」方案，未采用「补 `terser` 到 devDependencies + `npm install`」。esbuild 为 vite 内置压缩器，build 实测可用。
- 保留 `build.terserOptions` 块原样（未删）：vite 在非 terser 模式下忽略它，删它属范围外额外改动；由此产生一条非阻断警告，见 §9.3。
- 未改 `src/**`、未改 `index.html`、未改 `package.json`、未改 `cloud-music-server`、未改其它 .sdd/OpenSpec 文件；未触碰 manualChunks / alias / proxy 等其它 vite 配置。

### 9.2 执行命令与退出码（全部真实执行）

| # | 命令 | 阶段 | 退出码 | 错误摘要 |
|---|------|------|--------|----------|
| B1 | `cd .../cloud-music-web && npm run build` | 修复前基线（本轮复现） | **1** | `Could not resolve entry module (pConfigurationPage.html)`（rollup 入口解析失败，`✓ 2 modules transformed` 后中断） |
| B2 | `cd .../cloud-music-web && npm run build` | 修复后 | **0** | 无；`vite v2.9.15 building for production...` → `✓ 1821 modules transformed` → 产出 `dist/ems-admin/`（index.html + assets/*） |

- 对比：**1 → 0**。判定以真实命令退出码为准（命令用 `echo ===BUILD_EXIT_CODE=$?===` 打印并 `exit $code` 透传，工具返回 `Exit Code: 0`）。
- 前置 `vue-tsc --noEmit &&` 两次均通过（`&&` 未短路），类型检查无错误。

### 9.3 仍存在的非阻断告警（不影响退出码）

- `Please update to v0.35.0 or higher for TypeScript version: 4.7.3`：vue-tsc 0.34.17 与 TS 4.7.3 版本兼容提示，沿用 §1，非错误。
- `build.terserOptions is specified but build.minify is not set to use Terser...`：因 `minify` 改为 `esbuild` 但保留 `terserOptions` 块所致；vite 明确提示该块被忽略，非错误（本轮新增，见 §9.1 取舍说明）。
- 多条 `Generated an empty chunk: "@floating-ui" / "escape-html" / "lodash-unified" / "memoize-one" / "normalize-wheel-es" / "vue" / "vue-demi"`：既有 `manualChunks` 拆分产生的空 chunk 提示，范围外，未改。

### 9.4 最终结论

- 构建门 `npm run build`：**已跑通，退出码 0**（真实执行，非主观判断）。
- 整体：判定为「通过」。

### 9.5 待确认项（范围外，需用户确认，本轮未处理）

1. 若需恢复生产构建 `drop_console` / `drop_debugger` 语义：可评估改用 esbuild 的 `drop` 选项，或补 `terser` 依赖并把 `minify` 改回 `'terser'`（均超出本轮零新增依赖方案，需授权）。
2. 若需消除 §9.3 的 `terserOptions` 警告：删除 `build.terserOptions` 块即可（范围外改动，需授权）。
3. `pConfigurationPage.html` / `admin` 入口若确为本应存在的功能页，需补齐入口文件与源码后再评估恢复双入口（本轮按「无源码、非本轮功能」移除）。
4. 工作树含其它 agent 未提交改动，建议基于干净/完整环境复核。
