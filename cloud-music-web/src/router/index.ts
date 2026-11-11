import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

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

export default createRouter({
  history: createWebHistory(),
  routes,
});
