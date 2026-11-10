import type { RouteRecordRaw } from 'vue-router';

/** 专辑相关：专辑详情、歌曲详情 */
const albumRoutes: RouteRecordRaw[] = [
  {
    path: '/album_detail',
    meta: {
      name: '专辑详情',
    },
    component: () => import('@/views/album-detail/album-detail.vue'),
  },
  {
    path: '/music_detail',
    meta: {
      name: '歌曲详情',
    },
    component: () => import('@/views/music-detail/music-detail.vue'),
  },
];

export default albumRoutes;
