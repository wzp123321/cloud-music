/*
 * @Description: 个性化发现与风格分类 · 接口清单页区块定义（纯数据）
 * 区块渲染交给 cm-api-block，请求编排交给 useApiConsole；本文件只描述接口与参数链路
 */
import type { ApiBlock } from '@/components/cm-api-block/api-block.types';

import discoveryService from './discovery.service';

/** 分组 tab：code 与区块的 tab 字段对应 */
export const tabs: { code: string; name: string }[] = [
  { code: '2.1', name: '2.1 个性化推荐' },
  { code: '2.2', name: '2.2 风格分类' },
  { code: '2.3', name: '2.3 歌单·榜单·搜索' },
  { code: '2.4', name: '2.4 mlog 与话题' },
];

// ---------- 21 个接口 → 21 个真实调用点区块 ----------
// 详情型接口参数来源：style_* 的 tagId ← style_list；sheet_preview 的 id ← sheet_list；
// mlog_url / mlog_to_video 的 id ← mlog_music_rcmd；cloudsearch 的 keywords ← 页面输入。

const tagInput = { label: 'tagId（默认取 style_list 选中项，可手动输入）', def: '' };
const tagParams = (s: Record<string, any>, v: string): Record<string, any> => ({
  tagId: Number(v) || s.tagId || 0,
  limit: 20,
});

export const blocks: ApiBlock[] = [
  // 2.1 个性化推荐（4）
  {
    module: 'personalized_djprogram', title: '个性化播客节目', desc: '推荐电台节目列表', tab: '2.1',
    kind: 'read', url: '/personalized/djprogram', auto: true,
    run: discoveryService.getPersonalizedDjprogram,
  },
  {
    module: 'personalized_mv', title: '个性化 MV', desc: '推荐 MV 列表', tab: '2.1',
    kind: 'read', url: '/personalized/mv', auto: true,
    run: discoveryService.getPersonalizedMv,
  },
  {
    module: 'personalized_privatecontent', title: '独家内容', desc: '独家放送内容', tab: '2.1',
    kind: 'read', url: '/personalized/privatecontent',
    run: discoveryService.getPersonalizedPrivatecontent,
  },
  {
    module: 'personalized_privatecontent_list', title: '独家内容列表', desc: '独家内容分页列表', tab: '2.1',
    kind: 'read', url: '/personalized/privatecontent/list',
    input: { label: '每页条数', def: '10' },
    params: (_s, v) => ({ limit: Number(v) || 10, offset: 0 }),
    run: discoveryService.getPersonalizedPrivatecontentList,
  },

  // 2.2 风格分类（7）
  {
    module: 'style_list', title: '风格标签列表', desc: '返回可用风格标签，点击列表项把 tagId 传给下游 5 个风格接口', tab: '2.2',
    kind: 'read', url: '/style/list', auto: true, provides: ['tagId'],
    run: discoveryService.getStyleList,
  },
  {
    module: 'style_detail', title: '风格详情', desc: 'tagId 来自 style_list', tab: '2.2',
    kind: 'read', url: '/style/detail', needs: 'tagId', source: 'style_list', input: tagInput,
    params: tagParams,
    run: discoveryService.getStyleDetail,
  },
  {
    module: 'style_album', title: '风格专辑', desc: 'tagId 来自 style_list', tab: '2.2',
    kind: 'read', url: '/style/album', needs: 'tagId', source: 'style_list', input: tagInput,
    params: tagParams,
    run: discoveryService.getStyleAlbum,
  },
  {
    module: 'style_artist', title: '风格歌手', desc: 'tagId 来自 style_list', tab: '2.2',
    kind: 'read', url: '/style/artist', needs: 'tagId', source: 'style_list', input: tagInput,
    params: tagParams,
    run: discoveryService.getStyleArtist,
  },
  {
    module: 'style_playlist', title: '风格歌单', desc: 'tagId 来自 style_list', tab: '2.2',
    kind: 'read', url: '/style/playlist', needs: 'tagId', source: 'style_list', input: tagInput,
    params: tagParams,
    run: discoveryService.getStylePlaylist,
  },
  {
    module: 'style_song', title: '风格歌曲', desc: 'tagId 来自 style_list', tab: '2.2',
    kind: 'read', url: '/style/song', needs: 'tagId', source: 'style_list', input: tagInput,
    params: tagParams,
    run: discoveryService.getStyleSong,
  },
  {
    module: 'style_preference', title: '风格偏好', desc: '用户风格偏好标签（可选带上 tagId）', tab: '2.2',
    kind: 'read', url: '/style/preference',
    params: (s) => (s.tagId ? { tagId: s.tagId } : {}),
    run: discoveryService.getStylePreference,
  },

  // 2.3 歌单页 / 榜单 / 云搜索（5）
  {
    module: 'sheet_list', title: '歌单页列表', desc: '歌单列表，点击列表项把 sheetId 传给 sheet_preview', tab: '2.3',
    kind: 'read', url: '/sheet/list', auto: true, provides: ['sheetId'],
    input: { label: '分类（可选，如「华语」）', def: '' },
    params: (_s, v) => ({ ...(v ? { cat: v } : {}), limit: 20, offset: 0 }),
    run: discoveryService.getSheetList,
  },
  {
    module: 'sheet_preview', title: '歌单预览', desc: 'id 来自 sheet_list', tab: '2.3',
    kind: 'read', url: '/sheet/preview', needs: 'sheetId', source: 'sheet_list',
    input: { label: '歌单 id（默认取 sheet_list 选中项，可手动输入）', def: '' },
    params: (s, v) => ({ id: Number(v) || s.sheetId || 0 }),
    run: discoveryService.getSheetPreview,
  },
  {
    module: 'toplist_artist', title: '歌手榜', desc: '歌手排行榜', tab: '2.3',
    kind: 'read', url: '/toplist/artist', auto: true,
    input: { label: '类型 1/2/3（可选）', def: '' },
    params: (_s, v) => (v ? { type: Number(v) } : {}),
    run: discoveryService.getToplistArtist,
  },
  {
    module: 'toplist_detail', title: '榜单详情', desc: '榜单详情（可输入榜单 id）', tab: '2.3',
    kind: 'read', url: '/toplist/detail',
    input: { label: '榜单 id（可选）', def: '' },
    params: (_s, v) => (v ? { id: Number(v) } : {}),
    run: discoveryService.getToplistDetail,
  },
  {
    module: 'cloudsearch', title: '云搜索', desc: 'keywords 来自页面输入框', tab: '2.3',
    kind: 'read', url: '/cloudsearch',
    input: { label: '搜索关键词', def: '周杰伦' },
    params: (_s, v) => ({ keywords: v || '周杰伦', type: 1, limit: 20 }),
    run: discoveryService.getCloudsearch,
  },

  // 2.4 mlog / 精选评论 / 热门话题（5）
  {
    module: 'mlog_music_rcmd', title: 'mlog 音乐推荐', desc: '点击列表项把 mlogId 传给 mlog_url / mlog_to_video', tab: '2.4',
    kind: 'read', url: '/mlog/music/rcmd', auto: true, provides: ['mlogId'],
    input: { label: '歌曲 id（可选）', def: '' },
    params: (_s, v) => (v ? { id: Number(v) } : {}),
    run: discoveryService.getMlogMusicRcmd,
  },
  {
    module: 'mlog_to_video', title: 'mlog 转视频', desc: 'id 来自 mlog_music_rcmd', tab: '2.4',
    kind: 'read', url: '/mlog/to/video', needs: 'mlogId', source: 'mlog_music_rcmd',
    input: { label: 'mlog id（默认取列表选中项，可手动输入）', def: '' },
    params: (s, v) => ({ id: Number(v) || s.mlogId || 0 }),
    run: discoveryService.getMlogToVideo,
  },
  {
    module: 'mlog_url', title: 'mlog 播放地址', desc: 'id 来自 mlog_music_rcmd', tab: '2.4',
    kind: 'read', url: '/mlog/url', needs: 'mlogId', source: 'mlog_music_rcmd',
    input: { label: 'mlog id（默认取列表选中项，可手动输入）', def: '' },
    params: (s, v) => ({ id: Number(v) || s.mlogId || 0 }),
    run: discoveryService.getMlogUrl,
  },
  {
    module: 'starpick_comments_summary', title: '精选评论摘要', desc: '精选评论摘要（可输入资源 id）', tab: '2.4',
    kind: 'read', url: '/starpick/comments/summary',
    input: { label: '资源 id（可选）', def: '' },
    params: (_s, v) => (v ? { id: Number(v) } : {}),
    run: discoveryService.getStarpickCommentsSummary,
  },
  {
    module: 'hot_topic', title: '热门话题', desc: '热门话题（需登录只读，未登录降级不发请求）', tab: '2.4',
    kind: 'loginRead', url: '/hot/topic',
    input: { label: '条数', def: '10' },
    params: (_s, v) => ({ limit: Number(v) || 10 }),
    run: discoveryService.getHotTopic,
  },
];
