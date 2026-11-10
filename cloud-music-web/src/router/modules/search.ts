import type { RouteRecordRaw } from 'vue-router';

/** 搜索 */
const searchRoutes: RouteRecordRaw[] = [
  {
    path: '/search',
    meta: {
      name: 'search',
    },
    component: () => import('@/views/search/search.vue'),
  },
];

export default searchRoutes;
