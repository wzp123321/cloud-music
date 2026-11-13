import { getRequest } from '@/apis/request';

/**
 * P1 2.x「个性化发现与风格分类」接口封装（共 21 个）。
 *
 * URL 规则：module 文件名下划线转斜杠；完整清单见 api-inventory-plain.md，禁止凭记忆猜 URL。
 * 本批无特殊路由例外（personal_fm / fm_trash / daily_signin 属 3.x / 账号类，不在此文件）。
 *
 * 统一约定：
 * - 一律 getRequest(url, params)；
 * - 每个请求 try/catch，失败返回空对象 {}，避免未捕获异常（对应 SHARED-RULES 硬约束 6）；
 * - 返回体保持原始结构，由页面 normalize() 兼容 res.data / res.result / res.xxx。
 */

/** 统一安全请求：失败给空值 */
const call = async (url: string, params: Record<string, unknown> = {}): Promise<any> => {
  try {
    const res = await getRequest(url, params);
    return res ?? {};
  } catch {
    // 上游异常，降级为空对象，避免未捕获异常打断页面（响应拦截器统一提示，此处不重复 message.error）
    return {};
  }
}

const discoveryService = {
  //#region 2.1 个性化推荐入口（4）
  /** 个性化播客节目 */
  getPersonalizedDjprogram: (p: Record<string, any> = {}) => call('/personalized/djprogram', p),
  /** 个性化 MV */
  getPersonalizedMv: (p: Record<string, any> = {}) => call('/personalized/mv', p),
  /** 独家内容（独家放送） */
  getPersonalizedPrivatecontent: (p: Record<string, any> = {}) => call('/personalized/privatecontent', p),
  /** 独家内容列表（分页） */
  getPersonalizedPrivatecontentList: (p: Record<string, any> = {}) => call('/personalized/privatecontent/list', p),
  //#endregion

  //#region 2.2 风格分类浏览（7）
  /** 风格专辑：tagId ← style_list */
  getStyleAlbum: (p: Record<string, any> = {}) => call('/style/album', p),
  /** 风格歌手：tagId ← style_list */
  getStyleArtist: (p: Record<string, any> = {}) => call('/style/artist', p),
  /** 风格歌单：tagId ← style_list */
  getStylePlaylist: (p: Record<string, any> = {}) => call('/style/playlist', p),
  /** 风格歌曲：tagId ← style_list */
  getStyleSong: (p: Record<string, any> = {}) => call('/style/song', p),
  /** 风格标签列表（下游 5 个风格接口的 tagId 来源） */
  getStyleList: (p: Record<string, any> = {}) => call('/style/list', p),
  /** 风格详情：tagId ← style_list */
  getStyleDetail: (p: Record<string, any> = {}) => call('/style/detail', p),
  /** 风格偏好（可选 tagId） */
  getStylePreference: (p: Record<string, any> = {}) => call('/style/preference', p),
  //#endregion

  //#region 2.3 歌单页 / 榜单 / 云搜索（5）
  /** 歌单页列表（sheet_preview 的 id 来源） */
  getSheetList: (p: Record<string, any> = {}) => call('/sheet/list', p),
  /** 歌单预览：id ← sheet_list */
  getSheetPreview: (p: Record<string, any> = {}) => call('/sheet/preview', p),
  /** 歌手榜 */
  getToplistArtist: (p: Record<string, any> = {}) => call('/toplist/artist', p),
  /** 榜单详情（可带页面输入的榜单 id） */
  getToplistDetail: (p: Record<string, any> = {}) => call('/toplist/detail', p),
  /** 云搜索：keywords ← 页面输入框 */
  getCloudsearch: (p: Record<string, any> = {}) => call('/cloudsearch', p),
  //#endregion

  //#region 2.4 mlog / 精选评论 / 热门话题（5）
  /** mlog 音乐推荐（mlog_url / mlog_to_video 的 id 来源） */
  getMlogMusicRcmd: (p: Record<string, any> = {}) => call('/mlog/music/rcmd', p),
  /** mlog 转视频：id ← mlog_music_rcmd */
  getMlogToVideo: (p: Record<string, any> = {}) => call('/mlog/to/video', p),
  /** mlog 播放地址：id ← mlog_music_rcmd */
  getMlogUrl: (p: Record<string, any> = {}) => call('/mlog/url', p),
  /** 精选评论摘要 */
  getStarpickCommentsSummary: (p: Record<string, any> = {}) => call('/starpick/comments/summary', p),
  /** 热门话题（需登录只读，未登录由页面降级不发请求） */
  getHotTopic: (p: Record<string, any> = {}) => call('/hot/topic', p),
  //#endregion
};

export default discoveryService;
