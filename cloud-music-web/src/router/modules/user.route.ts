import type { RouteRecordRaw } from 'vue-router';

/** 用户中心：用户主页、用户与歌单补充、账号资料 */
const userRoutes: RouteRecordRaw[] = [
  {
    path: '/user',
    meta: {
      name: '用户中心',
    },
    component: () => import('@/views/user/user.vue'),
  },
  {
    path: '/user-supplement',
    meta: { name: '用户与歌单补充' },
    component: () => import('@/views/user-supplement/user-supplement.vue'),
  },
  {
    path: '/account-profile',
    meta: { name: '账号资料' },
    component: () => import('@/views/account-profile/account-profile.vue'),
  },
];

export default userRoutes;
