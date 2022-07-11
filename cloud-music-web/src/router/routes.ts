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
];

export default routes;
