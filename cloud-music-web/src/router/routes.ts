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
    path: '/demo',
    meta: {
      name: 'demo',
    },
    component: () => import('@/views/demo.vue'),
  },
  {
    path: '/search',
    meta: {
      name: 'search',
    },
    component: () => import('@/pages/search/search.vue'),
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
  {
    path: '/album_detail',
    meta: {
      name: '专辑详情',
    },
    component: () => import('@/pages/album-detail/album-detail.vue'),
  },
  {
    path: '/mvplay',
    meta: {
      name: 'MV播放',
    },
    component: () => import('@/pages/mvplay/mvplay.vue'),
  },
];

export default routes;
