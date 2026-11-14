# 项目长期约定

## 品牌归属（重要，别再搞错）

- `cloud-music-web/src/assets/images/portal/portal-logo.png`（红色音符 +「酷你音乐」）和 `cloud-music-web/public/favicon.ico` 是**用户自定义品牌**，header 左上角展示，`linkToPortal` 点击回首页。**禁止删除、替换或改成空图标**。
- 用户要去掉的只是**「网易云」字样**：`index.html` 的 title「网抑云Music」、扫码登录提示「请使用网易云音乐 APP 扫码登录」。根 README 中「网易云音乐 Web 客户端」是技术栈描述（上游 NeteaseCloudMusicApi），保留。
- 2026-11-14 曾误把「酷你音乐」logo / favicon 当第三方品牌一并清掉，2026-11-15 已全部恢复。判断品牌归属前先问，不要凭图标风格推断。

## 工程约定

- `npm run build` 会自动往 `cloud-music-web/components.d.ts` 补组件声明（ElAvatar / ElRadio / ElRadioGroup / ElTag 等），属无关副产物，提交前需还原。vite dev server 常驻时也会自动写这个文件。
- 上游 `cloud-music-server/server.js:188` 对所有 200 响应做 2 分钟 apicache，缓存 key 含完整 URL；需要实时性的接口（二维码 key/create/check）必须带唯一参数 `t`。
- 工作区常有并行会话改动，动手前先看 `git status`，只改自己负责的文件，别覆盖别的改动。
