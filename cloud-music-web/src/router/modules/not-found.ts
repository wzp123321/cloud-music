import type { RouteRecordRaw } from 'vue-router';

/**
 * 404 通配：匹配所有未被其他路由命中的地址。
 * Vue Router 按路径权重排序，静态路由优先，因此不必依赖文件名字序来兜底。
 */
const notFoundRoutes: RouteRecordRaw[] = [
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    meta: { name: '页面不存在' },
    component: () => import('@/views/not-found/not-found.vue'),
  },
];

export default notFoundRoutes;
