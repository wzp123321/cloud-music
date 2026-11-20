# Proposal

## Why

8 个组合式函数里有 47 个 `_` 前缀状态。前缀本身不是风格问题，而是语法补丁：内部 `ref` 与对外同名成员必须区分，才不出现 `const keyword = computed(() => keyword.value)` 的自引用。为了让调用方拿到「值」而不是 `Ref`，又各写了一套 getter/setter 解包层。

代价有三个：

- 命名不合规范，`_` 前缀没有语义信息，只能靠读 getter 才知道它是什么。
- 同一件事有三种写法：getter/setter 对象（6 个 hook、27 个状态）、`reactive({...})`（2 个 hook、5 个状态）、`computed` + 普通对象（15 个状态）。新增状态时无从判断该跟哪一种。
- 解包样板约 90 行，改一个字段要动两处（`_x` 与 `x`），漏改一处就静默失效。

## What Changes

- 47 个 `_` 前缀状态改为同名 `ref`（`_keyword` → `keyword`），删除 getter/setter 解包层。
- 8 个 hook 的返回值由「值对象」改为「Ref 对象」，调用方改为解构（`const { keyword, clearSuggest } = useHeader()`）。
- 2 个使用 `reactive({...})` 的 hook 改为返回普通对象内含 refs，消除第三种范式。
- `loginResult$` / `loadingResult$` 等 `$` 后缀字段保持 Ref 语义不变。
- **BREAKING**：所有消费方由整对象访问改为解构，脚本内读写需补 `.value`；模板内不变。实测 12 个文件、145 处成员访问。

## Capabilities

### New Capabilities

无。本变更为纯结构重构，不改变任何对外可观察行为。

### Modified Capabilities

无。

## Impact

**代码**：8 个 hook（`useHeader`、`useLogin`、`useUserCenter`、`useSearch`、`useMvPlayer`、`useAlbumDetail`、`useDjRadioDetail`、`usePlayListDetail`）及其 12 个消费文件。

**行为**：不变。改造后模板渲染、事件响应、请求时机与改造前一致。

**风险面**：解构暴露了两处重复状态（`search.vue` 的 `keyword`、`user.vue` 的 `uid` / `recordType`），合并会改变触发时机，需单独验证。
