import { getRequest, postFormRequest } from '@/apis/request';

/**
 * P1 6.x 用户与歌单补充（user-playlist-supplement）接口封装。
 *
 * URL 规则：module 文件名下划线转斜杠，完整清单见 api-inventory-plain.md「P1 用户与歌单补充」。
 * 一律走 getRequest；仅 playlist_cover_update 走 postFormRequest（multipart 上传）。
 *
 * 参数来源（design.md 编码硬约束）：
 * - user_cloud_detail / user_cloud_del 的 songId ← /user/cloud 云盘列表 data.list[].songId，或页面输入
 * - playlist_* 的 id ← /user/playlist 我的歌单列表 playlist[].id，或页面输入
 * - /user/cloud、/user/playlist 为已存在的 P0 上游列表接口（见 user.api.ts EUserPath），
 *   在本页仅作为 id 来源，不计入本 change 的 16 个接口。
 */

type Params = Record<string, any>;

const userSupplementService = {
  //#region 上游列表来源（用于取 id，不属本 change 16 个接口）
  /** 我的云盘：返回 data.list[].songId */
  getCloudList: (params: Params = {}): Promise<any> => getRequest('/user/cloud', { limit: 30, offset: 0, ...params }),
  /** 我的歌单：返回 playlist[].id */
  getMyPlaylists: (params: Params = {}): Promise<any> => getRequest('/user/playlist', { limit: 30, offset: 0, ...params }),
  //#endregion

  //#region 6.1 用户补充
  /** 账户信息（需登录只读） */
  getUserAccount: (params: Params = {}): Promise<any> => getRequest('/user/account', params),
  /** 音频足迹（需登录只读） */
  getUserAudio: (params: Params = {}): Promise<any> => getRequest('/user/audio', params),
  /** 电台足迹（需登录只读） */
  getUserDj: (params: Params = {}): Promise<any> => getRequest('/user/dj', params),
  /** 评论历史（需登录只读） */
  getUserCommentHistory: (params: Params = {}): Promise<any> => getRequest('/user/comment/history', params),
  /** 换绑手机（写操作） */
  replacePhone: (params: Params): Promise<any> => getRequest('/user/replacephone', params),
  //#endregion

  //#region 6.2 云盘
  /** 【上游已失效】/user/cloud/detail 实测 404：方法保留供手动核验，不进主流程自动请求 */
  getUserCloudDetail: (params: Params = {}): Promise<any> => getRequest('/user/cloud/detail', params),
  /** 删除云盘歌曲（写操作） */
  delUserCloud: (params: Params): Promise<any> => getRequest('/user/cloud/del', params),
  //#endregion

  //#region 6.3 歌单补充
  /** 更新歌单（写操作） */
  updatePlaylist: (params: Params): Promise<any> => getRequest('/playlist/update', params),
  /** 歌单歌曲增删（写操作） */
  getPlaylistTracks: (params: Params): Promise<any> => getRequest('/playlist/tracks', params),
  /** 更新歌单播放量（写操作） */
  updatePlaylistPlaycount: (params: Params): Promise<any> => getRequest('/playlist/update/playcount', params),
  /** 最近播放视频歌单（只读） */
  getPlaylistVideoRecent: (params: Params = {}): Promise<any> => getRequest('/playlist/video/recent', params),
  /** 更新歌单封面（写操作，multipart 上传） */
  updatePlaylistCover: (id: number, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('id', String(id));
    formData.append('imgFile', file);
    return postFormRequest('/playlist/cover/update', formData);
  },
  /** 更新歌单描述（写操作） */
  updatePlaylistDesc: (params: Params): Promise<any> => getRequest('/playlist/desc/update', params),
  /** 更新歌单标签（写操作） */
  updatePlaylistTags: (params: Params): Promise<any> => getRequest('/playlist/tags/update', params),
  /** 调整歌单顺序（写操作） */
  updatePlaylistOrder: (params: Params): Promise<any> => getRequest('/playlist/order/update', params),
  /** 设置歌单隐私（写操作） */
  updatePlaylistPrivacy: (params: Params): Promise<any> => getRequest('/playlist/privacy', params),
  //#endregion
};

export default userSupplementService;
