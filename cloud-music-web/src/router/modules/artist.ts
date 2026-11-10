import type { RouteRecordRaw } from 'vue-router';

/** 歌手相关：歌手列表、歌手详情 */
const artistRoutes: RouteRecordRaw[] = [
  {
    path: '/artists',
    meta: {
      name: '歌手',
    },
    component: () => import('@/views/artist/artist.vue'),
  },
  {
    path: '/artist_detail',
    meta: {
      name: '歌手详情',
    },
    component: () => import('@/views/artist/artist-detail/artist-detail.vue'),
  },
];

export default artistRoutes;
