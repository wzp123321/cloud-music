import type { RouteRecordRaw } from 'vue-router';

/** 发现与榜单：每日推荐、新碟、排行榜、个性化发现 */
const discoverRoutes: RouteRecordRaw[] = [
  {
    path: '/daily_recommend',
    meta: {
      name: '每日推荐',
    },
    component: () => import('@/views/daily-recommend/daily-recommend.vue'),
  },
  // 新碟与数字专辑（P1 content-detail-enhancement）
  {
    path: '/album',
    meta: {
      name: '新碟',
    },
    component: () => import('@/views/album-discovery/album-discovery.vue'),
  },
  {
    path: '/rank',
    meta: {
      name: '排行榜',
    },
    component: () => import('@/views/rank/rank.vue'),
  },
  // 榜单详情（复用排行榜页，按 id 预选）
  {
    path: '/rank_detail',
    meta: {
      name: '榜单详情',
    },
    component: () => import('@/views/rank/rank.vue'),
  },
  {
    path: '/discovery',
    meta: { name: '个性化发现与风格分类' },
    component: () => import('@/views/discovery/discovery.vue'),
  },
];

export default discoverRoutes;
