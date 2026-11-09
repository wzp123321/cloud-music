# 逐步接入路线（309 接口全覆盖）

基线：`4804ddb 补齐 P0 核心功能`。当前前端已引用 97 / 309，未引用 212。
原则：技术债优先 → 小步闭环 → 每步独立验收 → 不越范围改 server。

## 分步路线

| Step | 内容 | 接口数 | 验收 |
|---|---|---|---|
| 0 · 已完成 | **运行时基线（路线 A）**：装依赖 → 启 server → 抽样 19 接口 → 归档 P0 | 19 抽样 | `.sdd/runtime-probe.md`；5 个持久 capability 已建 |
| 1 | **P0 收尾**：8 项已封装但无 UI 入口（歌单 5 + 用户 3） | 0 新增 | 每个函数都有 UI 调用点；`vue-tsc` + `npm run build` 退出码 0 |
| 2 | **P1-A 内容增强**：`content-detail-enhancement`（专辑/歌手/MV） + `discovery-personalized`（风格/mlog/榜单补充） | ~42 | 端点存在、非占位、路径与 server module 精确一致 |
| 3 | **P1-B 互动与社交**：`play-interaction` + `social-message` + `feed-topic` + `user-playlist-supplement` | ~54 | 同上 |
| 4 | **P2-A 电台视频**：`dj-radio` + `video-podcast` | ~41 | 同上 |
| 5 | **P2-B 增值长尾**：`yunbei-vip-musician` + `ugc-listentogether` + `fanscenter-digitalAlbum` + `cloud-disk` + `account-profile` + `misc-longtail` | ~75 | 同上 + 全量 309 覆盖复核 |

## 每步固定动作

1. 先探测该批接口匿名可用性（方法见 `.sdd/runtime-probe.md`），当场登记失效接口，不把已失效端点写进 UI；再派子 agent（fresh context，七段派活契约），仅改自己 slice 的文件。
2. 编排层 Grep 抽查关键端点/UI 调用点，确认非空壳（信任但验证）。
3. 交叉评审或集成审计（只读子 agent），🔴 0 阻断才放行。
4. 真实 `vue-tsc --noEmit` + `npm run build`，以退出码为准。
5. 更新 `state.json`，向用户汇报 ≤15 行，再进下一步。
6. 卡点④ 提交门：每步单独确认提交方式，**永不跳过、不自动 push**。

## 已知环境约束（跨步回归）

| 编号 | 现象 | 处理 |
|---|---|---|
| KP-01 | Glob 对该仓库绝对路径常返回空，但文件真实存在 | 一律用 Grep / Read / ls 定位 |
| KP-02 | 同消息并发派 3 路子 agent 易触发 429；失败路可能已部分落盘 | 同波 ≤2 路；重派前先查 mtime + Grep 判完成度，串行降级 |
| KP-03 | `openspec/changes/cloud-music-p1-enhancement|p2-longtail/**/*.md` 被亿赛通加密，Read/grep 拿密文返回空 | 已导出明文副本至 `C:/Users/wanzh/AppData/Local/Temp/cm-refs/`，子 agent 只读副本 |
| KP-04 | server 未启动；原仓库已停更，eapi 可用性未验证 | 编译通过 ≠ 接口可用；运行时联调单列，需用户本地启 server |
| KP-05 | 构建曾阻断于 `vite.config.ts` 不存在的 admin 入口，已修 | 复跑 build 时若再阻断，先看是否回归 |

## 契约明文副本

- P1 tasks + 6 个 spec：`C:/Users/wanzh/AppData/Local/Temp/cm-refs/p1-enhancement-*.md`
- P2 tasks + 8 个 spec：`C:/Users/wanzh/AppData/Local/Temp/cm-refs/p2-longtail-*.md`
- 交叉评审：`C:/Users/wanzh/AppData/Local/Temp/cm-refs/cross-review.md`

## 边界

- 仅改 `cloud-music-web` 前端；`cloud-music-server` 零改动。
- 不引入新依赖、新状态管理库；沿用 services + pages + components 分层。
- 每步提交前用户确认；push / 开 PR 单独再确认。
