import type { RouteRecordRaw } from 'vue-router';

/**
 * 路由模块自动注册
 *
 * 约定：`router/modules/{moduleName}.ts` 默认导出 `RouteRecordRaw[]`。
 * 新增模块只需新建同目录文件，无需改动本文件。
 * 注册顺序按文件名升序，保证多次构建结果稳定（各路由 path 均为静态字面量，顺序不影响匹配）。
 *
 * 注意：本文件自身也在 glob 匹配范围内，必须显式排除，否则会循环引用自己。
 */
const modules = import.meta.glob<{ default: RouteRecordRaw[] }>(['./*.ts', '!./index.ts'], {
  eager: true,
});

const routes: RouteRecordRaw[] = Object.keys(modules)
  .sort()
  .flatMap((key) => modules[key]?.default ?? []);

export default routes;
