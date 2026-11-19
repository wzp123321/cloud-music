# known-patterns（跨波回归共享）

| 编号 | 类别 | 现象 | 根因 | 波及波次 | 处理方式 |
|---|---|---|---|---|---|
| KP-01 | 契约伪代码 | 详设用 `service.song.*` / `service.playlist.*` 指代调用，实际导出名为具名 `highValueService` | 设计文档未核对真实导出名，照抄会在 build 时报未定义 | Wave 1 / Wave 2 | 派活契约给精确锚点（导出名 + 行号）；已修正详设 §4；集成审计核对 import 与调用名 |
| KP-02 | 字段别名靠猜 | 四条接口三条归一化别名与真实响应不符（`blocks` / `userId` / `recPlaylist` 嵌套），build 与静态评审均过但区块运行时恒空 | 上游响应结构未纳入输入产物，别名由设计文档推定 | Wave 1 / 集成验收 | 所有响应归一化实现前必须 curl 真实接口取字段样本；集成验收强制字段探针，静态审计不能替代 |
| KP-03 | 主题选择器 | 用 `document.documentElement.setAttribute('data-theme','dark')` 切主题失效，取色仍是浅色值 | 深色主题选择器是 `html.dark`，`theme.css` 无 `data-theme` 分支 | 视觉验收 | 深色验收统一 `classList.add('dark')`；`v-show` 隐藏元素 computed 值仍可读，隐藏态取色会误判，取色前必须先让面板可见 |
| KP-04 | 视觉验收时序 | 截图早于异步列表返回，页面显示「歌单里还没有歌曲」，被误判成曲目加载回归 | 只等首个新增区块出现就截图，245 首曲目尚未渲染 | 视觉验收 | 断言前等目标列表行数 > 0；对「空态」结论必须二次确认再上报 |
| KP-05 | 组件样式透传 | `:deep(img)` 选头像不生效，头像按 1502px 原图渲染，撑出 6301px 高区块 | `cm-image` 根元素就是 `<img>`，class 直接落在 img 上，不存在「带 class 元素内部的 img」 | Wave 2 样式 | 给 `cm-image` 定尺寸直接写 class，不用 `:deep`；`object-fit` / `border-radius` 直接生效 |
