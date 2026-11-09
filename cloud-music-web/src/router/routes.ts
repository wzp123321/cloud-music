import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    meta: {
      name: '首页',
    },
    component: () => import('@/pages/portal/portal.vue'),
  },
  // 每日推荐
  {
    path: '/daily_recommend',
    meta: {
      name: '每日推荐',
    },
    component: () => import('@/pages/daily-recommend/daily-recommend.vue'),
  },
  // 排行榜（含榜单详情）
  {
    path: '/rank',
    meta: {
      name: '排行榜',
    },
    component: () => import('@/pages/rank/rank.vue'),
  },
  // 榜单详情（复用排行榜页，按 id 预选）
  {
    path: '/rank_detail',
    meta: {
      name: '榜单详情',
    },
    component: () => import('@/pages/rank/rank.vue'),
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
  // 歌单分类 / 精品浏览
  {
    path: '/playlist',
    meta: {
      name: '歌单',
    },
    component: () => import('@/pages/playlist/playlist.vue'),
  },
  // 我的收藏歌单
  {
    path: '/playlist/my',
    meta: {
      name: '我的收藏',
    },
    component: () => import('@/pages/playlist/my-playlist.vue'),
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

  // 歌曲详情
  {
    path: '/music_detail',
    meta: {
      name: '歌曲详情',
    },
    component: () => import('@/pages/music-detail/music-detail.vue'),
  },

  // 用户中心
  {
    path: '/user',
    meta: {
      name: '用户中心',
    },
    component: () => import('@/pages/user/user.vue'),
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
