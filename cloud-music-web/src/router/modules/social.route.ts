import type { RouteRecordRaw } from 'vue-router';

/** 社交与互动：消息、动态话题、一起听、播放互动 */
const socialRoutes: RouteRecordRaw[] = [
  {
    path: '/message',
    meta: { name: '消息中心' },
    component: () => import('@/views/message/message.vue'),
  },
  {
    path: '/feed',
    meta: { name: '动态与话题' },
    component: () => import('@/views/feed/feed.vue'),
  },
  {
    path: '/play-interaction',
    meta: { name: '歌曲互动与播放记录' },
    component: () => import('@/views/play-interaction/play-interaction.vue'),
  },
  {
    path: '/ugc-listentogether',
    meta: { name: 'UGC 与一起听' },
    component: () => import('@/views/ugc-listentogether/ugc-listentogether.vue'),
  },
];

export default socialRoutes;
