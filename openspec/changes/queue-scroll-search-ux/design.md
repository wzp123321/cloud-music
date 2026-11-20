# Design

## D1 队列重排不新增依赖

`cm-playlist-table` 的行用原生 HTML5 drag 事件（`draggable` + `dragstart` / `dragover` / `drop`）实现重排，不引入 sortable/draggable 类库。理由：只需相邻/任意位置移动，原生事件足够；项目当前无拖拽依赖，避免为单一交互增加体积。

## D2 索引跟随歌曲而非固定位置

`player.currentIndex` 是指向 `playlist.musicList` 的数字索引。重排后数组顺序变化，若索引不动会导致"播放项跳到别的歌"。解法：store 新增 `reorderMusic(from, to)`，重排后按当前播放歌曲的 `id` 重新计算 `currentIndex`；当前播放歌曲的 id 由 `player` 提供。重排不改播放状态、不重新请求 url。

持久化沿用 `playlist` store 已有的 `persist`（`pick: ['musicList']`），顺序随队列一起落盘，无需新 key。

## D3 随机模式语义

重排只影响队列展示顺序与顺序模式下的下一首选择。`onEnded` 的随机分支继续用 `Math.random` 选索引，不改。

## D4 滚动恢复按路由身份记忆

`router` 新增 `scrollBehavior`：

- 列表页路由（歌单详情、搜索结果等需记忆的页）在 `meta` 标记 `keepScroll: true`，以 `route.name + 关键参数` 为 key，把 `scrollTop` 存入 `sessionStorage`。
- 离开这类页时（router `afterEach` 或组件 `onBeforeUnmount`）记录位置；`scrollBehavior` 命中同一 key 且为返回导航时返回该位置。
- 新导航、同路由换参数（tab 切换、换关键词）不命中 key，返回 `{ top: 0 }`。
- 数据异步渲染的页面在位置恢复后可能需要二次校正；由页面在数据就绪后触发一次恢复，避免空列表时滚动失效。

选 `sessionStorage` 而非内存：刷新后返回仍能恢复，且关闭标签页即清除，不跨会话残留。

## D5 搜索历史独立本地存储

新增 `utils/searchHistory.ts`，键 `cloud-search-history`，值为关键词数组，上限 20 条、去重、最近置顶。读写做空值/非数组容错，与 `setting` store 的存储风格一致但独立，避免污染设置结构。

- 头部搜索入口负责展示历史与点击回填；搜索页提交时统一调用记录函数。
- 未登录可用，不接 `withSession`，不触发任何接口。
- 清空用现有确认弹窗二次确认；删除单条即时生效。

## D6 归档是独立不可逆操作

5 个在途 change 的归档视为流程维护，与功能实现解耦：

- 归档前逐项核对代码现状（多数实现已合入），确认无未提交改动需要保留。
- 归档动作在执行前单独向用户确认一次；不因本 change 通过校验而自动执行。
- 不回滚、不改任何业务代码；只移动 OpenSpec 变更目录。
