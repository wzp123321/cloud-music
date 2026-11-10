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
  // 新碟与数字专辑（P1 content-detail-enhancement）
  {
    path: '/album',
    meta: {
      name: '新碟',
    },
    component: () => import('@/pages/album-discovery/album-discovery.vue'),
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

  // MV 列表（P1 content-detail-enhancement）
  {
    path: '/mv',
    meta: {
      name: 'MV',
    },
    component: () => import('@/pages/mv/mv.vue'),
  },

  // mv
  {
    path: '/mvplay',
    meta: {
      name: 'MV播放',
    },
    component: () => import('@/pages/mvplay/mvplay.vue'),
  },

  // 能力中心：P0/P1/P2 全部已接入页面的统一入口
  {
    path: '/capabilities',
    meta: {
      name: '能力中心',
    },
    component: () => import('@/pages/capabilities/capabilities.vue'),
  },

  // 路由补齐：/album/detail、/artist/detail 两个独立详情接口
  {
    path: '/route-completion',
    meta: { name: '路由补齐' },
    component: () => import('@/pages/route-completion/route-completion.vue'),
  },

  //#region P1 剩余 capability
  {
    path: '/discovery',
    meta: { name: '个性化发现与风格分类' },
    component: () => import('@/pages/discovery/discovery.vue'),
  },
  {
    path: '/play-interaction',
    meta: { name: '歌曲互动与播放记录' },
    component: () => import('@/pages/play-interaction/play-interaction.vue'),
  },
  {
    path: '/message',
    meta: { name: '消息中心' },
    component: () => import('@/pages/message/message.vue'),
  },
  {
    path: '/feed',
    meta: { name: '动态与话题' },
    component: () => import('@/pages/feed/feed.vue'),
  },
  {
    path: '/user-supplement',
    meta: { name: '用户与歌单补充' },
    component: () => import('@/pages/user-supplement/user-supplement.vue'),
  },
  //#endregion

  //#region P2 长尾 capability
  {
    path: '/dj-radio',
    meta: { name: '电台' },
    component: () => import('@/pages/dj-radio/dj-radio.vue'),
  },
  {
    path: '/video-podcast',
    meta: { name: '视频与播客' },
    component: () => import('@/pages/video-podcast/video-podcast.vue'),
  },
  {
    path: '/yunbei-vip-musician',
    meta: { name: '云贝/会员/音乐人' },
    component: () => import('@/pages/yunbei-vip-musician/yunbei-vip-musician.vue'),
  },
  {
    path: '/ugc-listentogether',
    meta: { name: 'UGC 与一起听' },
    component: () => import('@/pages/ugc-listentogether/ugc-listentogether.vue'),
  },
  {
    path: '/fanscenter-digitalalbum',
    meta: { name: '粉丝中心与数字专辑' },
    component: () => import('@/pages/fanscenter-digitalalbum/fanscenter-digitalalbum.vue'),
  },
  {
    path: '/cloud-disk',
    meta: { name: '云盘' },
    component: () => import('@/pages/cloud-disk/cloud-disk.vue'),
  },
  {
    path: '/account-profile',
    meta: { name: '账号资料' },
    component: () => import('@/pages/account-profile/account-profile.vue'),
  },
  {
    path: '/misc-longtail',
    meta: { name: '杂项长尾' },
    component: () => import('@/pages/misc-longtail/misc-longtail.vue'),
  },
  //#endregion
];

export default routes;
