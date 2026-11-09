import { getRequest } from '../../services/request';

/**
 * 相似推荐接口封装（simi_*）
 * 路由名 = server module 文件名下划线转斜杠，统一走 request.ts 封装。
 * @see cloud-music-server/module/simi_*.js
 */

export type CM_SimiType = 'song' | 'playlist' | 'artist' | 'mv' | 'user';

/** 相似推荐默认标题 */
export const SIMI_TITLE: Record<CM_SimiType, string> = {
  song: '相似歌曲',
  playlist: '相似歌单',
  artist: '相似歌手',
  mv: '相似MV',
  user: '相似用户',
};

/** 归一化后的相似推荐项 */
export interface CM_ISimiItem {
  id: number | string;
  name: string;
  cover?: string;
  subtitle?: string;
}

/** 各 simi 接口原始响应 */
export interface CM_ISimiRes {
  code?: number;
  songs?: any[];
  playlists?: any[];
  artists?: any[];
  mvs?: any[];
  userprofiles?: any[];
  [key: string]: any;
}

/** 相似歌曲（simi_song，入参 songid） */
export const getSimiSong = (
  id: number | string,
  params: { limit?: number; offset?: number } = {},
): Promise<CM_ISimiRes> => getRequest('/simi/song', { id, ...params });

/** 相似歌单（simi_playlist，入参 songid） */
export const getSimiPlaylist = (
  id: number | string,
  params: { limit?: number; offset?: number } = {},
): Promise<CM_ISimiRes> => getRequest('/simi/playlist', { id, ...params });

/** 相似歌手（simi_artist，入参 artistid） */
export const getSimiArtist = (id: number | string): Promise<CM_ISimiRes> =>
  getRequest('/simi/artist', { id });

/** 相似MV（simi_mv，入参 mvid） */
export const getSimiMv = (mvid: number | string): Promise<CM_ISimiRes> =>
  getRequest('/simi/mv', { mvid });

/** 相似用户（simi_user，入参 songid） */
export const getSimiUser = (
  id: number | string,
  params: { limit?: number; offset?: number } = {},
): Promise<CM_ISimiRes> => getRequest('/simi/user', { id, ...params });

/** 按类型分发到对应接口 */
export async function fetchSimi(
  type: CM_SimiType,
  id: number | string,
): Promise<CM_ISimiRes> {
  switch (type) {
    case 'song':
      return getSimiSong(id);
    case 'playlist':
      return getSimiPlaylist(id);
    case 'artist':
      return getSimiArtist(id);
    case 'mv':
      return getSimiMv(id);
    case 'user':
      return getSimiUser(id);
    default:
      return {};
  }
}

/** 将各接口响应归一化为统一列表项 */
export function normalizeSimi(type: CM_SimiType, res: CM_ISimiRes): CM_ISimiItem[] {
  switch (type) {
    case 'song':
      return (res?.songs ?? []).map((s: any) => ({
        id: s?.id,
        name: s?.name ?? '',
        cover: s?.album?.picUrl ?? s?.album?.blurPicUrl,
        subtitle: (s?.artists ?? s?.ar ?? [])
          .map((a: any) => a?.name)
          .filter(Boolean)
          .join(' / '),
      }));
    case 'playlist':
      return (res?.playlists ?? []).map((p: any) => ({
        id: p?.id,
        name: p?.name ?? '',
        cover: p?.coverImgUrl,
        subtitle: p?.creator?.nickname,
      }));
    case 'artist':
      return (res?.artists ?? []).map((a: any) => ({
        id: a?.id,
        name: a?.name ?? '',
        cover: a?.picUrl ?? a?.img1v1Url,
        subtitle: '',
      }));
    case 'mv':
      return (res?.mvs ?? []).map((m: any) => ({
        id: m?.id,
        name: m?.name ?? '',
        cover: m?.cover ?? m?.picUrl ?? m?.imgurl16v9,
        subtitle: m?.artistName,
      }));
    case 'user':
      return (res?.userprofiles ?? []).map((u: any) => ({
        id: u?.userId,
        name: u?.nickname ?? '',
        cover: u?.avatarUrl,
        subtitle: u?.signature,
      }));
    default:
      return [];
  }
}
