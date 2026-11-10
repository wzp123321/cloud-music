import type { RouteRecordRaw } from 'vue-router';

/** 歌单相关：歌单详情、歌单分类、我的收藏 */
const playlistRoutes: RouteRecordRaw[] = [
  {
    path: '/playlist_detail',
    meta: {
      name: 'playlist_detail',
    },
    component: () => import('@/views/playlist/playlist-detail/playlist-detail.vue'),
  },
  {
    path: '/playlist',
    meta: {
      name: '歌单',
    },
    component: () => import('@/views/playlist/playlist.vue'),
  },
  {
    path: '/playlist/my',
    meta: {
      name: '我的收藏',
    },
    component: () => import('@/views/playlist/my-playlist.vue'),
  },
];

export default playlistRoutes;
