import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    meta: {
      name: '首页',
    },
    component: () => import('@/pages/portal/portal.vue'),
  },
  {
    path: '/artists',
    meta: {
      name: '歌手',
    },
    component: () => import('@/pages/artist/artist.vue'),
  },
  {
    path: '/artist_detail',
    meta: {
      name: '歌手详情',
    },
    component: () => import('@/pages/artist-detail/artist-detail.vue'),
  },
];

export default routes;
