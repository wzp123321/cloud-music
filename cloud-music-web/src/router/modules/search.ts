import type { RouteRecordRaw } from 'vue-router';

/** 搜索 */
const searchRoutes: RouteRecordRaw[] = [
  {
    path: '/search',
    meta: {
      name: 'search',
      // 列表页：离开时记忆滚动位置；关键参数 keyword 来自真实 query，换词即换 key 回顶
      // 注意：type 是 useSearch 组件内 ref，不是 URL query 字段，不可入 key（避免 KP-02 恒空片段）
      keepScroll: true,
      scrollParams: ['keyword'],
    },
    component: () => import('@/views/search/search.vue'),
  },
];

export default searchRoutes;
