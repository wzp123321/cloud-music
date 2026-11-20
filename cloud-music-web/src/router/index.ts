import { createRouter, createWebHistory } from 'vue-router';
import type {
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  RouteRecordRaw,
} from 'vue-router';
import message from '@/utils/message';

/**
 * 列表页滚动位置记忆与恢复（navigation-scroll-restore / D4）
 *
 * - 真实滚动容器为布局根 div.home（非 window）；Vue Router 的 scrollBehavior 只滚 window，
 *   故恢复/回顶必须由容器侧完成：本文件 setContainerTop + 异步页 applyRestore 二次校正。
 * - 位置按「路由身份 key」存入 sessionStorage：key = meta.name + meta.scrollParams 对应的真实 query/params 值。
 * - 离开 keepScroll 页时在 beforeEach 记录 from 位置（此时旧页 DOM 仍在）。
 * - popstate 返回导航优先用 sessionStorage 记录的容器位置：window 的 savedPosition 恒为 0，不可作容器恢复目标。
 * - scrollBehavior 命中恢复时登记 pendingRestore，供异步数据页在数据就绪后二次校正。
 */
const SCROLL_KEY_PREFIX = 'cloud-scroll:';
type ScrollRoute = RouteLocationNormalized | RouteLocationNormalizedLoaded;

/** 滚动 key：meta.name + 关键参数；换参数即换 key，保证换参数回顶 */
export function getScrollKey(route: ScrollRoute): string {
  const name = typeof route.meta.name === 'string' ? route.meta.name : route.path;
  const rawParams = route.meta.scrollParams;
  const scrollParams: string[] = Array.isArray(rawParams) ? (rawParams as string[]) : [];
  const normalize = (v: unknown): string => {
    if (v == null) return '';
    if (Array.isArray(v)) return v.map(String).join(',');
    return String(v);
  };
  const parts = scrollParams.map((p) => {
    const raw = route.query[p] ?? route.params[p];
    return `${p}=${encodeURIComponent(normalize(raw))}`;
  });
  return `${SCROLL_KEY_PREFIX}${name}${parts.length ? `|${parts.join('&')}` : ''}`;
}

/** 读取已存滚动位置；非法值（NaN/负数）按未命中处理，回顶 */
function readStoredScroll(key: string): number | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

/**
 * 真实滚动容器：布局根 div.home（见 views/home/home.vue）。
 * Vue Router 的 scrollBehavior 只滚动 window，对内部容器无效，故读写都针对该元素。
 * 稳定选择器；容器未渲染返回 null，调用方据此跳过，不报错。
 */
function getScrollContainer(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector<HTMLElement>('.home');
}

/** 记录当前真实容器滚动位置，clamp ≥ 0；容器未渲染返回 null 表示跳过记录 */
function currentScrollTop(): number | null {
  const el = getScrollContainer();
  if (!el) return null;
  return Math.max(0, el.scrollTop || 0);
}

/** 容器侧回顶 / 恢复：容器未渲染时静默跳过 */
function setContainerTop(top: number): void {
  const el = getScrollContainer();
  if (el) el.scrollTop = Math.max(0, top);
}

/**
 * 浏览器后退/前进会触发 popstate；用于区分「刷新后后退」与「新导航到同 key 页」。
 * 不用固定时间窗（慢网络下组件懒加载可能让 scrollBehavior 晚于窗口），改由 scrollBehavior 消费标志。
 */
let popPending = false;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => { popPending = true; }, { passive: true });
}

/**
 * 最近一次 scrollBehavior 决定的恢复目标，供异步页二次校正。
 * 每次新导航开始清空，避免上一次的恢复意图被后续页面误用。
 */
let pendingRestore: { key: string; top: number; id: number } | null = null;
let restoreId = 0;

/** 读取本次导航的恢复目标（不消费，重复读取幂等）；key 不匹配返回 null */
export function getPendingRestore(key: string): { top: number; id: number } | null {
  return pendingRestore && pendingRestore.key === key
    ? { top: pendingRestore.top, id: pendingRestore.id }
    : null;
}

/**
 * 恢复稳定性保护：异步页数据分批渲染，scrollBehavior / 首次写入发生时
 * .home 可能还是 loading 骨架（scrollHeight≈clientHeight），浏览器会把 scrollTop clamp 到 0；
 * 后续内容增高又会产生漂移。故在有限窗口（5s）内持续把容器拉回恢复目标，
 * 仅在内容高度足以容纳目标时才写入，避免写入被 clamp 成 0。
 * 用户主动滚动（wheel/touchstart）或新导航清空 pendingRestore 时立即停止，避免长期对抗。
 */
let activeRestoreKeeper: (() => void) | null = null;

export function stopRestoreKeeper(): void {
  const stop = activeRestoreKeeper;
  activeRestoreKeeper = null;
  if (stop) stop();
}

export function keepRestore(key: string): void {
  stopRestoreKeeper();
  const el = getScrollContainer();
  if (!el) return;
  let interrupted = false;
  const onUserScroll = () => { interrupted = true; };
  el.addEventListener('wheel', onUserScroll, { passive: true });
  el.addEventListener('touchstart', onUserScroll, { passive: true });

  const tick = () => {
    const pending = getPendingRestore(key);
    if (interrupted || !pending) return stopRestoreKeeper();
    const target = Math.max(0, pending.top);
    const enough = target === 0 || el.scrollHeight >= target + el.clientHeight;
    if (enough && el.scrollTop !== target) el.scrollTop = target;
  };

  const timer = window.setInterval(tick, 100);
  const guard = window.setTimeout(stopRestoreKeeper, 5000);
  activeRestoreKeeper = () => {
    window.clearInterval(timer);
    window.clearTimeout(guard);
    el.removeEventListener('wheel', onUserScroll);
    el.removeEventListener('touchstart', onUserScroll);
  };
  tick();
}

/**
 * scrollBehavior 命中恢复、异步页 loading 转 false 时均调用本函数。
 * 旧实现是一次性条件写入并在成功后清理 pendingRestore；但内容分批渲染会在写入后继续
 * 改变 .home 高度，引发 clamp 到 0 / 漂移（见 diag-b2c 时间线）。
 * 现统一委托给 keepRestore：不清理 pendingRestore，在有限窗口内持续校正直到稳定。
 */
export function applyPendingRestore(key: string): void {
  keepRestore(key);
}

/**
 * 路由模块自动注册
 *
 * 约定：`router/modules/{moduleName}.ts` 默认导出 `RouteRecordRaw[]`。
 * 新增模块只需在同目录新建文件，无需改动本文件。
 * 注册顺序按文件名升序，保证多次构建结果稳定（通配路由由 Vue Router 按权重降级匹配，顺序不影响结果）。
 */
const modules = import.meta.glob<{ default: RouteRecordRaw[] }>('./modules/*.ts', {
  eager: true,
});

const routes: RouteRecordRaw[] = Object.keys(modules)
  .sort()
  .flatMap((key) => modules[key]?.default ?? []);

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    // 本次导航是否为 popstate（后退/前进）；无条件消费，避免影响后续导航判定
    const popped = popPending;
    popPending = false;

    // 非记忆页：新导航一律回顶
    if (!to.meta?.keepScroll) {
      setContainerTop(0);
      return { top: 0, left: 0 };
    }

    const key = getScrollKey(to);

    // 返回导航（popstate）：优先用 beforeEach 记录的真实容器位置。
    // window 的 savedPosition 在本项目恒为 0（window 从不滚动），不能作为容器恢复目标。
    const stored = popped ? readStoredScroll(key) : null;
    if (stored !== null) {
      pendingRestore = { key, top: stored, id: ++restoreId };
      setContainerTop(stored);
      // 容器此时可能仍未渲染出内容，启动条件等待在数据到位后真正写入
      applyPendingRestore(key);
      return { top: stored, left: 0 };
    }

    // savedPosition 仅作后备（理论上 window 有滚动时才有效）
    if (savedPosition) {
      const top = Math.max(0, savedPosition.top ?? 0);
      pendingRestore = { key, top, id: ++restoreId };
      setContainerTop(top);
      applyPendingRestore(key);
      return { top, left: 0 };
    }

    // 新导航 / 同路由换参数：容器回顶
    setContainerTop(0);
    return { top: 0, left: 0 };
  },
});

// 离开 keepScroll 页时记录 from 位置：此时旧页 DOM 仍在，读取可靠（afterEach 读到的是新页）
router.beforeEach((_to, from) => {
  // 新导航开始，清除上一次导航登记的恢复意图，并停掉可能仍在跑的校正循环
  pendingRestore = null;
  stopRestoreKeeper();
  if (from.meta?.keepScroll) {
    const top = currentScrollTop();
    // .home 未渲染（如布局切换中）跳过记录，避免记 0 覆盖有效位置
    if (top !== null) {
      try {
        sessionStorage.setItem(getScrollKey(from), String(top));
      } catch {
        // sessionStorage 不可用（隐私模式等）静默降级，不影响导航
      }
    }
  }
});

// 全项目大量 router.push 未带 .catch，统一在此兜底：跳转异常提示一次并保留错误日志
router.onError((error) => {
  message.error('页面跳转失败，请重试');
  // eslint-disable-next-line no-console
  console.error('[router]', error);
});

export default router;
