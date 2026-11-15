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
  // 服务端接口总览：按 server module 自动生成的全量清单与调用台
  // 注意：路由不能以 /api 开头，会被 Vite 的 /api 代理按前缀拦截转发到后端
  {
    path: '/server-routes',
    meta: { name: '服务端接口总览' },
    component: () => import('@/views/api-coverage/api-coverage.vue'),
  },
];

export default homeRoutes;
