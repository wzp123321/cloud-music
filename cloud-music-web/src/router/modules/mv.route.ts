import type { RouteRecordRaw } from 'vue-router';

/** MV 相关：MV 列表、MV 播放 */
const mvRoutes: RouteRecordRaw[] = [
  // MV 列表（P1 content-detail-enhancement）
  {
    path: '/mv',
    meta: {
      name: 'MV',
    },
    component: () => import('@/views/mv/mv.vue'),
  },
  {
    path: '/mvplay',
    meta: {
      name: 'MV播放',
    },
    component: () => import('@/views/mvplay/mvplay.vue'),
  },
];

export default mvRoutes;
