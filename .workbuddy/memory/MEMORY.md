# 项目长期约定

## 品牌归属（重要，别再搞错）

- `cloud-music-web/src/assets/images/portal/portal-logo.png`（红色音符 +「酷你音乐」）和 `cloud-music-web/public/favicon.ico` 是**用户自定义品牌**，header 左上角展示，`linkToPortal` 点击回首页。**禁止删除、替换或改成空图标**。
- 用户要去掉的只是**「网易云」字样**：`index.html` 的 title「网抑云Music」、扫码登录提示「请使用网易云音乐 APP 扫码登录」、页面动态文案。根 README 简介 2026-11-15 已中性化为「本地可运行的音乐 Web 客户端」；上游包名、接口文档链接等技术栈描述保留。
- 2026-11-14 曾误把「酷你音乐」logo / favicon 当第三方品牌一并清掉，2026-11-15 已全部恢复。判断品牌归属前先问，不要凭图标风格推断。

## 工程约定

- `npm run build` 会自动往 `cloud-music-web/components.d.ts` 补组件声明（ElAvatar / ElRadio / ElRadioGroup / ElTag 等），属无关副产物，提交前需还原。vite dev server 常驻时也会自动写这个文件。
- 上游 `cloud-music-server/server.js:188` 对所有 200 响应做 2 分钟 apicache，缓存 key 含完整 URL；需要实时性的接口（二维码 key/create/check）必须带唯一参数 `t`。
- 工作区常有并行会话改动，动手前先看 `git status`，只改自己负责的文件，别覆盖别的改动。
- **前端路由不能以 `/api` 开头**：Vite 代理按前缀匹配 `/api`，`/api-coverage` 会被剥成 `/-coverage` 转发到 19830 并 404。全量接口页因此用 `/server-routes`。
- server 接口清单由 `cloud-music-web` 的 `npm run sync:routes` 生成（`scripts/sync-server-routes.mjs` → `src/apis/server-coverage/routes.ts`），**server 每次重新拉代码后都要重跑**；脚本幂等，扫描时会跳过生成目录自身，避免把上一版清单算成「已接入」。静态回归 `verify-navigation.mjs` 已排除该生成文件。

## 文档风格

- **README 只写功能和技术栈**（加启动方式、脚本、环境变量、目录约定即可），**不记录问题清单、修复记录、踩坑、已知限制、工程备忘**。2026-11-15 用户明确要求，已按要求精简根 `README.md` 与 `cloud-music-web/README.md`。这类内容放 `.workbuddy/memory/` 或 commit message，别写进 README。
