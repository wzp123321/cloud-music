 
/**
 * 歌单生态接口封装（playlist-management）
 * 路由名 = server module 文件名下划线转斜杠，统一走 request.ts 封装
 * @see cloud-music-server/module/playlist_*.js
 */
import { getRequest, postRequest, postFormRequest } from './request';
import type { CS_ISongDetailRes } from './common.models';

//#region 类型定义
/** 歌单基础 VO（与 portal PlayListVO 字段对齐，复用展示） */
export interface PM_IPlaylistVO {
  id: number;
  name: string;
  coverImgUrl: string;
  playCount: number;
  trackCount: number;
  subscribedCount: number;
  creator?: { userId: number; nickname: string; avatarUrl: string };
  tags?: string[];
  description?: string;
  [key: string]: unknown;
}

/** 全部歌单分类响应 */
export interface PM_ICatlistRes {
  code: number;
  categories: { [key: string]: string };
  sub: Array<{ name: string; category: number; [key: string]: unknown }>;
}

/** 热门歌单分类响应 */
export interface PM_IHotTagsRes {
  code: number;
  tags?: Array<{ name: string; [key: string]: unknown }>;
  data?: Array<{ name: string; [key: string]: unknown }>;
}

/** 精品歌单标签响应 */
export interface PM_IHqTagsRes {
  code: number;
  tags?: Array<{ name: string; [key: string]: unknown }>;
}

/** 精品歌单列表响应 */
export interface PM_IHqPlaylistRes {
  code: number;
  playlists: PM_IPlaylistVO[];
  total: number;
  more: boolean;
  lasttime: number;
}

/** 收藏者响应 */
export interface PM_ISubscribersRes {
  code: number;
  subscribers: Array<{ userId: number; nickname: string; avatarUrl: string; [key: string]: unknown }>;
  total: number;
  more: boolean;
}

/** 我的收藏（mlog 歌单）响应，结构较宽松 */
export interface PM_IMylikeRes {
  code: number;
  hasMore?: boolean;
  playlistList?: PM_IPlaylistVO[];
  data?: { playlistList?: PM_IPlaylistVO[] };
  [key: string]: unknown;
}

/** 歌单动态数据响应 */
export interface PM_IDynamicRes {
  code: number;
  playCount?: number;
  bookCount?: number; // 收藏数
  subscribedCount?: number;
  commentCount?: number;
  shareCount?: number;
  [key: string]: unknown;
}

/** 写操作通用响应（删除/订阅/编辑/增删歌曲等，业务层只判 code） */
export interface PM_IWriteRes {
  code?: number;
  message?: string;
  status?: number;
  [key: string]: unknown;
}

/** 创建歌单响应 */
export interface PM_ICreateRes {
  code: number;
  id?: number;
  playlist?: PM_IPlaylistVO;
  [key: string]: unknown;
}
//#endregion

//#region 3.1 分类与精品浏览
/** 全部歌单分类 */
export const getPlaylistCatlist = (): Promise<PM_ICatlistRes> => getRequest('/playlist/catlist');

/** 热门歌单分类 */
export const getPlaylistHot = (): Promise<PM_IHotTagsRes> => getRequest('/playlist/hot');

/** 精品歌单标签 */
export const getHighqualityTags = (): Promise<PM_IHqTagsRes> =>
  getRequest('/playlist/highquality/tags');

/** 精品歌单列表（按分类） */
export const getTopPlaylistHighquality = (params: {
  cat?: string;
  limit?: number;
  before?: number;
}): Promise<PM_IHqPlaylistRes> => getRequest('/top/playlist/highquality', params);
//#endregion

//#region 3.2 创建/删除/订阅/收藏者/我的收藏
/** 创建歌单 */
export const createPlaylist = (params: {
  name: string;
  privacy?: number; // 0 普通，10 隐私
  type?: string; // NORMAL|VIDEO|SHARED
}): Promise<PM_ICreateRes> => postRequest('/playlist/create', params);

/** 删除歌单 */
export const deletePlaylist = (id: number): Promise<PM_IWriteRes> =>
  postRequest('/playlist/delete', { id });

/** 收藏/取消收藏歌单（t=1 收藏，t=2 取消） */
export const subscribePlaylist = (params: { id: number; t: number }): Promise<PM_IWriteRes> =>
  postRequest('/playlist/subscribe', params);

/** 歌单收藏者 */
export const getPlaylistSubscribers = (params: {
  id: number;
  limit?: number;
  offset?: number;
}): Promise<PM_ISubscribersRes> => getRequest('/playlist/subscribers', params);

/** 我的收藏歌单 */
export const getPlaylistMylike = (params: {
  time?: string;
  limit?: string;
} = {}): Promise<PM_IMylikeRes> =>
  getRequest('/playlist/mylike', { time: params.time ?? '-1', limit: params.limit ?? '12' });
//#endregion

//#region 3.3 编辑
/** 修改歌单名 */
export const updatePlaylistName = (params: { id: number; name: string }): Promise<PM_IWriteRes> =>
  postRequest('/playlist/name/update', params);

/** 修改歌单描述 */
export const updatePlaylistDesc = (params: { id: number; desc: string }): Promise<PM_IWriteRes> =>
  postRequest('/playlist/desc/update', params);

/** 修改歌单标签（逗号分隔） */
export const updatePlaylistTags = (params: { id: number; tags: string }): Promise<PM_IWriteRes> =>
  postRequest('/playlist/tags/update', params);

/** 修改歌单封面（文件上传） */
export const updatePlaylistCover = (params: { id: number; imgFile: File }): Promise<PM_IWriteRes> => {
  const formData = new FormData();
  formData.append('id', String(params.id));
  formData.append('imgFile', params.imgFile);
  return postFormRequest('/playlist/cover/update', formData);
};

/** 公开隐私歌单 */
export const updatePlaylistPrivacy = (params: { id: number; privacy?: number }): Promise<PM_IWriteRes> =>
  postRequest('/playlist/privacy', params);

/** 调整歌单顺序（ids 逗号分隔） */
export const updatePlaylistOrder = (params: { ids: string }): Promise<PM_IWriteRes> =>
  postRequest('/playlist/order/update', params);
//#endregion

//#region 3.4 歌曲增删与动态
/** 向歌单添加歌曲（pid 歌单id，ids 歌曲id逗号分隔） */
export const addTrackToPlaylist = (params: { pid: number; ids: string }): Promise<PM_IWriteRes> =>
  postRequest('/playlist/track/add', params);

/** 从歌单删除歌曲（id 歌单id，ids 歌曲id逗号分隔） */
export const deleteTrackFromPlaylist = (params: { id: number; ids: string }): Promise<PM_IWriteRes> =>
  postRequest('/playlist/track/delete', params);

/** 获取歌单全部歌曲 */
export const getPlaylistTrackAll = (params: {
  id: number;
  limit?: number;
  offset?: number;
}): Promise<CS_ISongDetailRes> => getRequest('/playlist/track/all', params);

/** 歌单动态数据（播放量/收藏数等） */
export const getPlaylistDetailDynamic = (params: { id: number; s?: number }): Promise<PM_IDynamicRes> =>
  getRequest('/playlist/detail/dynamic', params);
//#endregion
