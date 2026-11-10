import { getRequest } from '@/services/request';
import { FGetCookie } from '@/core/token';
import {
  AlbumNewRes,
  AlbumNewestRes,
  AlbumListRes,
  AlbumListStyleRes,
  AlbumSongsaleboardRes,
  AlbumDetailDynamicRes,
  AlbumSublistRes,
  ArtistListRes,
  ArtistTopSongRes,
  ArtistSongsRes,
  ArtistNewSongRes,
  ArtistNewMvRes,
  ArtistVideoRes,
  ArtistFansRes,
  ArtistFollowCountRes,
  ArtistSublistRes,
  MvListRes,
  MvDetailInfoRes,
  MvSublistRes,
  ContentSubRes,
} from './content-enhance.api';

/**
 * P1 content-detail-enhancement 接口封装。
 *
 * 路由规则：module 文件名下划线转斜杠（server.js parseRoute）。
 * 本批无 special 例外路由（personal_fm / fm_trash / daily_signin 属 P1 3.x，不在此文件）。
 *
 * 参数来源（design.md「编码硬约束」）：
 * - album_detail_dynamic / album_sub 的 id ← album_new / album_newest 的 albums[].id
 * - artist_* 详情型接口的 id ← artist_list 的 artists[].id，或路由 query.id
 * - mv_detail_info / mv_sub 的 mvid ← mv_all / mv_first / mv_exclusive_rcmd 的 data[].id
 * - 订阅列表型接口（*_sublist）只需分页参数，需登录态，未登录时页面降级展示
 */

/** 是否已有登录态（用于写操作/需登录接口的 UI 降级） */
export function hasLogin(): boolean {
  return !!FGetCookie('cloud-userInfo');
}

const contentEnhanceService = {
  //#region 1.1 新碟 / 榜单 / 风格浏览（匿名可用）
  /** 全部新碟：area ALL/ZH/EA/KR/JP */
  async getAlbumNew(params: { area?: string; limit?: number; offset?: number } = {}): Promise<AlbumNewRes> {
    return await getRequest('/album/new', {
      area: params.area || 'ALL',
      limit: params.limit || 30,
      offset: params.offset || 0,
    });
  },
  /** 最新专辑 */
  async getAlbumNewest(): Promise<AlbumNewestRes> {
    return await getRequest('/album/newest', {});
  },
  /** 数字专辑-新碟上架：area ALL/ZH/EA/KR/JP */
  async getAlbumList(params: { area?: string; limit?: number; offset?: number; type?: string } = {}): Promise<AlbumListRes> {
    return await getRequest('/album/list', {
      area: params.area || 'ALL',
      limit: params.limit || 30,
      offset: params.offset || 0,
      ...(params.type ? { type: params.type } : {}),
    });
  },
  /** 数字专辑-语种风格馆：area Z_H/E_A/KR/JP */
  async getAlbumListStyle(params: { area?: string; limit?: number; offset?: number } = {}): Promise<AlbumListStyleRes> {
    return await getRequest('/album/list/style', {
      area: params.area || 'Z_H',
      limit: params.limit || 10,
      offset: params.offset || 0,
    });
  },
  /** 数字专辑销量榜：type daily/week/year/total */
  async getAlbumSongsaleboard(params: { type?: string; albumType?: number; year?: number } = {}): Promise<AlbumSongsaleboardRes> {
    return await getRequest('/album/songsaleboard', {
      type: params.type || 'daily',
      albumType: params.albumType ?? 0,
      ...(params.year ? { year: params.year } : {}),
    });
  },
  //#endregion

  //#region 1.2 专辑详情动态 / 订阅
  /** 专辑动态信息：id ← 新碟列表 albums[].id 或 /album_detail?id= */
  async getAlbumDetailDynamic(params: { id: number }): Promise<AlbumDetailDynamicRes> {
    return await getRequest('/album/detail/dynamic', { id: params.id });
  },
  /** 收藏/取消收藏专辑：id ← 专辑详情路由；t=1 订阅，t=0 取消（需登录） */
  async setAlbumSub(params: { id: number; t: 1 | 0 }): Promise<ContentSubRes> {
    return await getRequest('/album/sub', { id: params.id, t: params.t });
  },
  /** 已收藏专辑列表（需登录） */
  async getAlbumSublist(params: { limit?: number; offset?: number } = {}): Promise<AlbumSublistRes> {
    return await getRequest('/album/sublist', { limit: params.limit || 25, offset: params.offset || 0 });
  },
  //#endregion

  //#region 1.3 歌手列表 / 歌曲 / 视频
  /** 歌手分类：type 1男/2女/3乐队，area -1/7/96/8/16/0，initial 首字母 */
  async getArtistList(
    params: { type?: string; area?: number | string; initial?: string; limit?: number; offset?: number } = {},
  ): Promise<ArtistListRes> {
    return await getRequest('/artist/list', {
      type: params.type || '1',
      area: params.area ?? -1,
      limit: params.limit || 30,
      offset: params.offset || 0,
      ...(params.initial ? { initial: params.initial } : {}),
    });
  },
  /** 歌手热门 50 首：id ← 歌手列表 artists[].id 或 /artist_detail?id= */
  async getArtistTopSong(params: { id: number }): Promise<ArtistTopSongRes> {
    return await getRequest('/artist/top/song', { id: params.id });
  },
  /** 歌手全部歌曲：order hot/time，支持分页 */
  async getArtistSongs(params: { id: number; order?: string; limit?: number; offset?: number }): Promise<ArtistSongsRes> {
    return await getRequest('/artist/songs', {
      id: params.id,
      order: params.order || 'hot',
      limit: params.limit || 30,
      offset: params.offset || 0,
    });
  },
  /** 关注歌手的新歌（需登录，未登录 UI 降级） */
  async getArtistNewSong(params: { limit?: number; before?: number } = {}): Promise<ArtistNewSongRes> {
    return await getRequest('/artist/new/song', { limit: params.limit || 20, ...(params.before ? { before: params.before } : {}) });
  },
  /** 关注歌手的新 MV（需登录，未登录 UI 降级） */
  async getArtistNewMv(params: { limit?: number; before?: number } = {}): Promise<ArtistNewMvRes> {
    return await getRequest('/artist/new/mv', { limit: params.limit || 20, ...(params.before ? { before: params.before } : {}) });
  },
  /** 歌手相关视频：id ← 歌手列表/详情的歌手 id */
  async getArtistVideo(params: { id: number; size?: number; cursor?: number; order?: number }): Promise<ArtistVideoRes> {
    return await getRequest('/artist/video', {
      id: params.id,
      size: params.size || 10,
      cursor: params.cursor || 0,
      order: params.order ?? 0,
    });
  },
  //#endregion

  //#region 1.4 歌手粉丝 / 订阅
  /** 歌手粉丝列表：id ← 歌手 id */
  async getArtistFans(params: { id: number; limit?: number; offset?: number }): Promise<ArtistFansRes> {
    return await getRequest('/artist/fans', { id: params.id, limit: params.limit || 20, offset: params.offset || 0 });
  },
  /** 歌手粉丝数 / 关注状态：id ← 歌手 id */
  async getArtistFollowCount(params: { id: number }): Promise<ArtistFollowCountRes> {
    return await getRequest('/artist/follow/count', { id: params.id });
  },
  /** 关注/取消关注歌手：id ← 歌手 id；t=1 关注，t=0 取消（需登录） */
  async setArtistSub(params: { id: number; t: 1 | 0 }): Promise<ContentSubRes> {
    return await getRequest('/artist/sub', { id: params.id, t: params.t });
  },
  /** 关注歌手列表（需登录） */
  async getArtistSublist(params: { limit?: number; offset?: number } = {}): Promise<ArtistSublistRes> {
    return await getRequest('/artist/sublist', { limit: params.limit || 25, offset: params.offset || 0 });
  },
  //#endregion

  //#region 1.5 MV 浏览 / 详情 / 订阅
  /** 全部 MV：area/type/order 组合筛选 */
  async getMvAll(
    params: { area?: string; type?: string; order?: string; limit?: number; offset?: number } = {},
  ): Promise<MvListRes> {
    return await getRequest('/mv/all', {
      area: params.area || '全部',
      type: params.type || '全部',
      order: params.order || '上升最快',
      limit: params.limit || 30,
      offset: params.offset || 0,
    });
  },
  /** 网易出品（独家推荐） */
  async getMvExclusiveRcmd(params: { limit?: number; offset?: number } = {}): Promise<MvListRes> {
    return await getRequest('/mv/exclusive/rcmd', { limit: params.limit || 30, offset: params.offset || 0 });
  },
  /** 最新 MV */
  async getMvFirst(params: { area?: string; limit?: number } = {}): Promise<MvListRes> {
    return await getRequest('/mv/first', { area: params.area || '', limit: params.limit || 30 });
  },
  /** MV 点赞/评论/分享数：mvid ← MV 列表 data[].id 或 /mvplay?mvid= */
  async getMvDetailInfo(params: { mvid: number | string }): Promise<MvDetailInfoRes> {
    return await getRequest('/mv/detail/info', { mvid: params.mvid });
  },
  /** 收藏/取消收藏 MV：mvid ← MV 详情路由；t=1 收藏，t=0 取消（需登录） */
  async setMvSub(params: { mvid: number | string; t: 1 | 0 }): Promise<ContentSubRes> {
    return await getRequest('/mv/sub', { mvid: params.mvid, t: params.t });
  },
  /** 已收藏 MV 列表（需登录） */
  async getMvSublist(params: { limit?: number; offset?: number } = {}): Promise<MvSublistRes> {
    return await getRequest('/mv/sublist', { limit: params.limit || 25, offset: params.offset || 0 });
  },
  /**
   * 数字专辑详情：id ← /album/list 的 products[].albumId（普通专辑 id 会返回 404「无专辑商品」）
   * 与专辑详情页使用的 /album 是不同的上游接口。
   */
  async getAlbumDetailExtra(params: { id: number | string }): Promise<any> {
    return await getRequest('/album/detail', { id: params.id });
  },
  /** 歌手详情补充信息：id ← /artist/list 的 artists[].id 或 /artist_detail?id= */
  async getArtistDetailExtra(params: { id: number | string }): Promise<any> {
    return await getRequest('/artist/detail', { id: params.id });
  },
  //#endregion
};

export default contentEnhanceService;
