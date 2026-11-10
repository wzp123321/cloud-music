import { getRequest } from '@/services/request';

/**
 * P1 3.x「歌曲互动与播放记录」接口封装（共 23 个）。
 *
 * URL 规则：module 文件名下划线转斜杠；完整清单见 api-inventory-plain.md，禁止凭记忆猜 URL。
 * 特殊路由例外（SHARED-RULES）：
 *   personal_fm -> /personal_fm （不是 /personal/fm）
 *   fm_trash     -> /fm_trash     （不是 /fm/trash）
 *
 * 统一约定：
 * - 一律 getRequest(url, params)；
 * - 每个请求 try/catch，失败返回空对象 {}，避免未捕获异常；
 * - 返回体保持原始结构，由页面 normalize() 兼容 res.data / res.result / res.xxx；
 * - 写操作（like / resource_like / fm_trash / song_order_update / scrobble）是否发出请求
 *   由页面根据 hasLogin() + window.confirm 控制，service 只负责封装，不自动触发。
 */

/** 统一安全请求：失败给空值 */
async function call(url: string, params: Record<string, any> = {}): Promise<any> {
  try {
    const res = await getRequest(url, params);
    return res ?? {};
  } catch {
    return {};
  }
}

const playInteractionService = {
  //#region 3.1 红心与喜欢列表（3）
  /** 红心/取消红心歌曲（写操作）：id ← 歌曲列表/页面输入 */
  setLike: (p: Record<string, any> = {}) => call('/like', p),
  /** 我喜欢的歌曲列表（需登录只读） */
  getLikelist: (p: Record<string, any> = {}) => call('/likelist', p),
  /** 资源点赞/取消（写操作）：id ← 资源列表/页面输入 */
  setResourceLike: (p: Record<string, any> = {}) => call('/resource/like', p),
  //#endregion

  //#region 3.2 私人 FM（2，特殊路由）
  /** 私人 FM 推荐歌曲（特殊路由 /personal_fm） */
  getPersonalFm: (p: Record<string, any> = {}) => call('/personal_fm', p),
  /** 把歌曲移出 FM 推荐（写操作，特殊路由 /fm_trash）：id ← FM 歌曲列表 */
  setFmTrash: (p: Record<string, any> = {}) => call('/fm_trash', p),
  //#endregion

  //#region 3.3 智能播放与排序（3）
  /** 智能播放列表（点击列表项可提供歌曲 id） */
  getPlaymodeIntelligenceList: (p: Record<string, any> = {}) => call('/playmode/intelligence/list', p),
  /** 歌曲向量：id ← 歌曲列表/页面输入 */
  getPlaymodeSongVector: (p: Record<string, any> = {}) => call('/playmode/song/vector', p),
  /** 手动更新歌曲顺序（写操作）：ids ← 页面输入 */
  setSongOrderUpdate: (p: Record<string, any> = {}) => call('/song/order/update', p),
  //#endregion

  //#region 3.4 歌曲信息与可用性校验（7）
  /** 歌曲播放地址 v1：id ← 歌曲列表/页面输入 */
  getSongUrlV1: (p: Record<string, any> = {}) => call('/song/url/v1', p),
  /** 已购歌曲列表（需登录只读） */
  getSongPurchased: (p: Record<string, any> = {}) => call('/song/purchased', p),
  /** 歌曲百科摘要：id ← 歌曲列表/页面输入 */
  getSongWikiSummary: (p: Record<string, any> = {}) => call('/song/wiki/summary', p),
  /** 校验歌曲可用性：id ← 歌曲列表/页面输入 */
  getCheckMusic: (p: Record<string, any> = {}) => call('/check/music', p),
  /** 新版歌词：id ← 歌曲列表/页面输入 */
  getLyricNew: (p: Record<string, any> = {}) => call('/lyric/new', p),
  /** 首次收听信息：id ← 歌曲列表/页面输入 */
  getMusicFirstListenInfo: (p: Record<string, any> = {}) => call('/music/first/listen/info', p),
  /** 播放记录上报（写操作）：id ← 歌曲列表/页面输入 */
  setScrobble: (p: Record<string, any> = {}) => call('/scrobble', p),
  //#endregion

  //#region 3.5 播放记录与历史推荐（8）
  /** 最近播放歌曲（需登录只读，点击列表项可提供歌曲 id） */
  getRecordRecentSong: (p: Record<string, any> = {}) => call('/record/recent/song', p),
  /** 最近播放专辑（需登录只读） */
  getRecordRecentAlbum: (p: Record<string, any> = {}) => call('/record/recent/album', p),
  /** 最近播放歌单（需登录只读） */
  getRecordRecentPlaylist: (p: Record<string, any> = {}) => call('/record/recent/playlist', p),
  /** 最近播放视频（需登录只读） */
  getRecordRecentVideo: (p: Record<string, any> = {}) => call('/record/recent/video', p),
  /** 最近播放电台（需登录只读） */
  getRecordRecentDj: (p: Record<string, any> = {}) => call('/record/recent/dj', p),
  /** 最近播放声音（需登录只读） */
  getRecordRecentVoice: (p: Record<string, any> = {}) => call('/record/recent/voice', p),
  /** 历史推荐歌曲（需登录只读；detail 的 id 来源） */
  getHistoryRecommendSongs: (p: Record<string, any> = {}) => call('/history/recommend/songs', p),
  /** 历史推荐歌曲详情（需登录只读）：id ← history_recommend_songs */
  getHistoryRecommendSongsDetail: (p: Record<string, any> = {}) => call('/history/recommend/songs/detail', p),
  //#endregion
};

export default playInteractionService;
