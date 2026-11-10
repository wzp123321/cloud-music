import type { RouteRecordRaw } from 'vue-router';

/** 首页与能力入口：门户首页、能力中心、路由补齐调试页 */
const homeRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    meta: {
      name: '首页',
    },
    component: () => import('@/views/portal/portal.vue'),
  },
  // 能力中心：P0/P1/P2 全部已接入页面的统一入口
  {
    path: '/capabilities',
    meta: {
      name: '能力中心',
    },
    component: () => import('@/views/capabilities/capabilities.vue'),
  },
  // 路由补齐：/album/detail、/artist/detail 两个独立详情接口
  {
    path: '/route-completion',
    meta: { name: '路由补齐' },
    component: () => import('@/views/route-completion/route-completion.vue'),
  },
];

export default homeRoutes;
