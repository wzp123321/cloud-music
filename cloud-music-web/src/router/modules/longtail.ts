import type { RouteRecordRaw } from 'vue-router';

/** P2 长尾能力：电台、视频播客、云贝会员、粉丝中心、云盘、杂项 */
const longtailRoutes: RouteRecordRaw[] = [
  {
    path: '/dj-radio',
    meta: { name: '电台' },
    component: () => import('@/views/dj-radio/dj-radio.vue'),
  },
  {
    path: '/dj-radio-detail',
    meta: { name: '电台详情' },
    component: () => import('@/views/dj-radio-detail/dj-radio-detail.vue'),
  },
  {
    path: '/dj-program-detail',
    meta: { name: '节目详情' },
    component: () => import('@/views/dj-program-detail/dj-program-detail.vue'),
  },
  {
    path: '/video-podcast',
    meta: { name: '视频与播客' },
    component: () => import('@/views/video-podcast/video-podcast.vue'),
  },
  {
    path: '/yunbei-vip-musician',
    meta: { name: '云贝/会员/音乐人' },
    component: () => import('@/views/yunbei-vip-musician/yunbei-vip-musician.vue'),
  },
  {
    path: '/fanscenter-digitalalbum',
    meta: { name: '粉丝中心与数字专辑' },
    component: () => import('@/views/fanscenter-digitalalbum/fanscenter-digitalalbum.vue'),
  },
  {
    path: '/cloud-disk',
    meta: { name: '云盘' },
    component: () => import('@/views/cloud-disk/cloud-disk.vue'),
  },
  {
    path: '/misc-longtail',
    meta: { name: '杂项长尾' },
    component: () => import('@/views/misc-longtail/misc-longtail.vue'),
  },
];

export default longtailRoutes;
