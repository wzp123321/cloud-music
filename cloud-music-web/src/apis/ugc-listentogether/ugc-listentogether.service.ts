import { getRequest } from '@/apis/request';

/**
 * P2 4.x「UGC 与一起听」接口封装（共 15 个）。
 *
 * URL 规则：module 文件名下划线转斜杠；完整清单见 api-inventory-plain.md，禁止凭记忆猜 URL。
 * 统一约定：
 * - 一律 getRequest(url, params)；
 * - 每个请求 try/catch，失败返回空对象 {}，避免未捕获异常；
 * - 返回体保持原始结构，由页面 normalize() 兼容 res.data / res.result / res.xxx；
 * - 写操作（devoteUgcUser / createListenRoom / *_command / heatbeat / endListenRoom）是否发出
 *   请求由页面根据 hasLogin() + window.confirm 控制，service 只负责封装，不自动触发。
 */
async function call(url: string, params: Record<string, any> = {}): Promise<any> {
  try {
    const res = await getRequest(url, params);
    return res ?? {};
  } catch {
    return {};
  }
}

const ugcListentogetherService = {
  //#region 4.1 UGC 内容查看（7）
  /** UGC 专辑详情：id ← ugc_artist_search 结果 / 页面输入 */
  getUgcAlbum: (p: Record<string, any> = {}) => call('/ugc/album/get', p),
  /** UGC 歌手详情：id ← ugc_artist_search 结果 / 页面输入 */
  getUgcArtist: (p: Record<string, any> = {}) => call('/ugc/artist/get', p),
  /** UGC 歌手搜索（入口，提供 ugcId）：keyword ← 页面输入 */
  searchUgcArtist: (p: Record<string, any> = {}) => call('/ugc/artist/search', p),
  /** UGC 详情（需登录只读）：id ← ugc_artist_search 结果 / 页面输入 */
  getUgcDetail: (p: Record<string, any> = {}) => call('/ugc/detail', p),
  /** UGC MV 详情：id ← ugc_artist_search 结果 / 页面输入 */
  getUgcMv: (p: Record<string, any> = {}) => call('/ugc/mv/get', p),
  /** UGC 歌曲详情：id ← ugc_artist_search 结果 / 页面输入 */
  getUgcSong: (p: Record<string, any> = {}) => call('/ugc/song/get', p),
  /** 用户 UGC 贡献（写操作）：需登录 + 二次确认 */
  devoteUgcUser: (p: Record<string, any> = {}) => call('/ugc/user/devote', p),
  //#endregion

  //#region 4.2 一起听房间（8）
  /** 创建一起听房间（写操作），返回 roomId 供下游接口带参 */
  createListenRoom: (p: Record<string, any> = {}) => call('/listentogether/room/create', p),
  /** 检查房间：roomId ← room_create 返回 / 页面输入 */
  checkListenRoom: (p: Record<string, any> = {}) => call('/listentogether/room/check', p),
  /** 一起听状态（需登录只读）：roomId ← room_create 返回 / 页面输入 */
  getListenStatus: (p: Record<string, any> = {}) => call('/listentogether/status', p),
  /** 播放指令（写操作）：roomId ← room_create 返回 / 页面输入 */
  sendListenPlayCommand: (p: Record<string, any> = {}) => call('/listentogether/play/command', p),
  /** 心跳（写操作）：roomId ← room_create 返回 / 页面输入 */
  sendListenHeatbeat: (p: Record<string, any> = {}) => call('/listentogether/heatbeat', p),
  /** 同步歌单获取：roomId ← room_create 返回 / 页面输入 */
  getListenSyncPlaylist: (p: Record<string, any> = {}) => call('/listentogether/sync/playlist/get', p),
  /** 同步列表指令（写操作）：roomId ← room_create 返回 / 页面输入 */
  sendListenSyncListCommand: (p: Record<string, any> = {}) => call('/listentogether/sync/list/command', p),
  /** 结束房间（写操作）：roomId ← room_create 返回 / 页面输入 */
  endListenRoom: (p: Record<string, any> = {}) => call('/listentogether/end', p),
  //#endregion
};

export default ugcListentogetherService;
