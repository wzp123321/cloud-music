# Design

## Context

8 个组合式函数当前有 47 个 `_` 前缀状态，分三种返回形态：

| 形态 | hook | 状态数 | 对外呈递方式 |
|---|---|---|---|
| getter/setter 普通对象 | `useHeader`、`useLogin`、`useUserCenter`、`useAlbumDetail`、`useDjRadioDetail`、`usePlayListDetail` | 27 | `get x() { return _x.value }` |
| `reactive({...})` | `useSearch`、`useMvPlayer` | 5 | 由 reactive 代理自动解包 |
| `computed` + 普通对象 | 上述 hook 的派生值 | 15 | `const x = computed(() => _x.value)` |

约束：项目无 SSR；调用方全部是 `.vue` 组件与少量编排 hook（`useHeaderView`、`useMvplayView`、`usePlaylistDetailView`）；Vue 3.5，模板对**顶层** ref 自动解包、对嵌套普通对象内的 ref 不解包。

## Goals / Non-Goals

**Goals:**

- 消除 `_` 前缀，状态变量名即对外名。
- 消除 getter/setter 与 `computed` 解包样板（约 90 行），改一个字段只动一处。
- 统一为单一返回形态，新增状态无需选择范式。

**Non-Goals:**

- 不改任何业务逻辑、请求时机、模板结构。
- 不调整 hook 的职责边界（如把 `useHeader` 拆分）。
- 不改 `$` 后缀字段的命名与语义。
- 不动 62 个类型名的模块前缀（属另一变更）。

## Decisions

### D1 成员直出 ref

一个状态一个 `ref`，变量名即对外名，返回值是普通对象（非 `reactive`）：

```ts
// 改前
const _keyword = ref('');
return {
  get keyword() { return _keyword.value; },
  set keyword(value) { _keyword.value = value; },
};

// 改后
const keyword = ref('');
return { keyword };
```

**为什么不用 `reactive({...})` 收敛**：它会把 `loginResult$` 这类 `$` 字段解包成值，丧失「`watch` 整体替换」的能力；`hotList` / `songs` 这类大数组会被深代理，每次深层访问多一层拦截；且等于在项目里固化第三种范式。`reactive` 只应存在于「明确需要一个响应式对象承载多字段表单」的场景，不应用于对外状态暴露。

### D2 调用方必须解构

返回成员从「值」变成「Ref」，因此消费方不能整对象访问：

```ts
// 必须：解构出的成员是 setup 顶层 ref，模板自动解包、赋值写回 .value
const { keyword, hotList, clearSuggest } = useHeader();

// 不可：整对象访问拿到的是 Ref 对象
const header = useHeader();
```

**实测证据**（Vue 3.5 + 本项目依赖版本，非推断）：

| 验证项 | 结果 |
|---|---|
| 模板 `{{ header.keyword }}` 编译产物 | `_toDisplayString(header.keyword)`，无 `_unref` 包裹 |
| 模板 `v-model="header.keyword"` 编译产物 | `header.keyword = $event`，直接对属性赋值 |
| 运行时赋值后 | `isRef(header.keyword)` → `false`；副作用仅执行 1 次；下游 `header.keyword.value` → `undefined` |

即：不解构时 `v-model` 会把整个 Ref 对象替换成字符串，响应式无声中断，且不抛错、不告警。

解构后则完全成立：

| 验证项 | 结果 |
|---|---|
| `compileScript` 的 `bindingMetadata` | `{ keyword: 'setup-maybe-ref' }` |
| 模板产物 | `$event => (($setup.keyword) = $event)` |
| 运行时代理写入 | `proxyRefs` 写回 `.value`，底层 `isRef` 仍为 `true`，`watch` 在 `nextTick` 后触发 1 次 |

**写法差异**：模板里 `keyword` 当值用；脚本里读写要 `keyword.value`。`vue-tsc` 能拦住绝大多数遗漏——把 `Ref<string>` 当 `string` 用会直接报类型错。

### D3 `$` 后缀保留

`loginResult$`、`loadingResult$`、`userDetail$`、`mvDetailResult$` 等字段解构后仍是顶层 ref，`watch(loginResult$)` 依然能捕获整体替换。命名与语义均不变。

### D4 静态数据不包 ref

`menus`（模块常量 `menuTabs`）不是状态，直接返回原值，解构后模板照常渲染。判据：模块加载后不会变化的数据不进 `ref`。

### D5 重复状态：合并，而非别名

解构会与页面已有局部变量重名，实测 2 处：

| 文件 | 冲突成员 | 性质 |
|---|---|---|
| `search.vue` | `keyword` | 页面 `computed(() => getQueryParam('keyword'))`，`useSearch` 内部同样用 `getQueryParam('keyword')` 初始化——同一数据两份写法 |
| `user.vue` | `uid`、`recordType` | 页面各有本地 `ref`，且存在 `uid.value = userCenterService.uid` 的回写——同语义两份状态 |

规则：重名时先判定是否为重复状态，**重复的合并到 hook、删除页面副本**；确属不同语义才用解构别名（`const { keyword: searchKeyword } = useSearch()`）。两处都不机械改名，因为机械别名会把重复状态固化下来。

**合并的连带影响**：

- `search.vue` 的 `watch(() => keyword.value)` 承担换词重查，改为监听 hook 的 ref 后，触发时机需实测（原实现基于路由参数，hook 内基于内部 ref）。
- `user.vue` 的 `uid` 由「页面 ref + 从 hook 回写」改为直接使用 hook 值，需确认路由切换时 `watch` 链仍然生效。

### D6 迁移顺序：先闭合一个，再铺开

改造一个 hook 涉及三方同时变更（hook 定义、编排层、模板），单独改任一侧都会让页面白屏。因此以「hook 的完整闭环」为单位推进：

1. `useAlbumDetail`（15 处、单文件）作为试点，跑通「hook 改造 → 调用方解构 → 模板验证 → `vue-tsc` / 构建」全链路。
2. 试点通过后按访问点从少到多推进：`useMvPlayer` → `usePlayListDetail` → `useSearch` → `useUserCenter` → `useLogin` → `useDjRadioDetail` → `useHeader`。
3. `useHeader` 放最后：它经 `useHeaderView` 中转，且 `header.vue` 一次性解构 9 个状态。

### D7 中间层透传

`useHeaderView` 不再返回 `header` 对象，而是把解构出的 refs 直接并入自己的返回值，`header.vue` 由 `header.keyword` 改为 `keyword`。中间层不重新包装、不复制值。

## 调用点清单（实测）

| hook | 成员访问点 | 消费文件 |
|---|---|---|
| `useHeader` | 32 | `header.vue`、`useHeaderView.ts` |
| `useDjRadioDetail` | 26 | `dj-radio-detail.vue` |
| `useLogin` | 21 | `header-loginform.vue`、`useHeaderView.ts`、`user.vue` |
| `useUserCenter` | 20 | `user.vue` + 3 个子组件 |
| `useSearch` | 18 | `search.vue` |
| `useAlbumDetail` | 15 | `album-detail.vue` |
| `usePlayListDetail` | 10 | `usePlaylistDetailView.ts` |
| `useMvPlayer` | 3 | `useMvplayView.ts` |
| **合计** | **145** | **12** |

## Risks / Trade-offs

| 风险 | 缓解 |
|---|---|
| 解构后脚本内漏写 `.value` | `vue-tsc` 报「`Ref<T>` 不能赋给 `T`」；模板侧误写 `.value` 同样被类型检查拦住 |
| 模板与脚本写法不一致（模板不加 `.value`）造成误改 | 试点阶段在 `useAlbumDetail` 固化范式，其余照抄 |
| 合并重复状态改变行为（`search.vue` 换词重查、`user.vue` 的 `uid` 回写链） | 这两处单独提交、单独冒烟，不与机械改名混在一起 |
| 改造期间新代码按整对象访问接入 | 每个 hook 的闭环在一个 commit 内完成，避免跨 commit 的半成品状态 |
| 单测缺失，回归只能靠人工 | 逐页冒烟清单：首页头部搜索、用户中心 4 页、搜索页换词、MV 播放、专辑/电台详情、歌单详情 |

## Migration Plan

- 每个 hook 一个 commit，commit 内同时包含 hook 定义、编排层、模板三侧改动；任一 commit 可独立 revert。
- 顺序见 D6。`useAlbumDetail` 试点若发现范式问题，先改设计再继续，不带着问题铺开。
- **验证口径**：`vue-tsc --noEmit` + `eslint` + `vite build`；每页冒烟上述清单；`v-model` 输入框（头部搜索框、用户资料表单）逐个手动输入确认双向绑定。
