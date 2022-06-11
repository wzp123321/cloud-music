/**
 * 首页banner
 */
export interface BannerVO {
  encodeId: string;
  exclusive: boolean;
  imageUrl: string;
  scm: string;
  targetId: number;
  targetType: number;
  titleColor: string;
  typeTitle: string;
}

/**
 * banner响应结果
 */
export interface BannerRes {
  banners: BannerVO[];
  code: number;
}

/**
 * 加载歌单参数
 */
export interface LoadPlayListParams {
  limit: number;
  cat: string;
}

/**
 * 请求歌单响应结果
 */
export interface PlayListRes {
  code: number;
  lasttime: number;
  more: boolean;
  playlists: PlayListVO[];
  total: number;
}

/**
 * 歌单
 */
export interface PlayListVO {}
