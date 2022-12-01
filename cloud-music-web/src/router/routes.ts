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
  // 歌单详情
  {
    path: '/playlist_detail',
    meta: {
      name: 'playlist_detail',
    },
    component: () => import('@/pages/playlist/playlist-detail/playlist-detail.vue'),
  },
  // 搜索
  {
    path: '/search',
    meta: {
      name: 'search',
    },
    component: () => import('@/pages/search/search.vue'),
  },
  // 歌手列表
  {
    path: '/artists',
    meta: {
      name: '歌手',
    },
    component: () => import('@/pages/artist/artist.vue'),
  },
  // 歌手详情
  {
    path: '/artist_detail',
    meta: {
      name: '歌手详情',
    },
    component: () => import('@/pages/artist/artist-detail/artist-detail.vue'),
  },
  // 专辑详情
  {
    path: '/album_detail',
    meta: {
      name: '专辑详情',
    },
    component: () => import('@/pages/album-detail/album-detail.vue'),
  },
  // mv
  {
    path: '/mvplay',
    meta: {
      name: 'MV播放',
    },
    component: () => import('@/pages/mvplay/mvplay.vue'),
  },
];

export default routes;
