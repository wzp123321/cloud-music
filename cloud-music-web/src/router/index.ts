import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import message from '@/utils/message';

/**
 * 路由模块自动注册
 *
 * 约定：`router/modules/{moduleName}.ts` 默认导出 `RouteRecordRaw[]`。
 * 新增模块只需在同目录新建文件，无需改动本文件。
 * 注册顺序按文件名升序，保证多次构建结果稳定（各路由 path 均为静态字面量，顺序不影响匹配）。
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
});

// 全项目大量 router.push 未带 .catch，统一在此兜底：跳转异常提示一次并保留错误日志
router.onError((error) => {
  message.error('页面跳转失败，请重试');
  // eslint-disable-next-line no-console
  console.error('[router]', error);
});

export default router;
