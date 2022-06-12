import { UserVO } from '@/services/common-api/user-api';

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
export interface PlayListVO {
  adType: number;
  anonimous: false;
  cloudTrackCount: number;
  commentCount: number;
  commentThreadId: string;
  copywriter: string;
  coverImgId: string;
  coverImgId_str: string;
  coverImgUrl: string;
  coverStatus: number;
  createTime: number;
  creator: UserVO;
  description: string;
  highQuality: true;
  id: number;
  name: string;
  newImported: false;
  ordered: true;
  playCount: number;
  privacy: number;
  recommendInfo: null;
  shareCount: number;
  specialType: number;
  status: number;
  subscribed: null;
  subscribedCount: number;
  tag: string;
  tags: string[];
  totalDuration: number;
  trackCount: number;
  trackNumberUpdateTime: number;
  trackUpdateTime: number;
  tracks: null;
  updateTime: number;
  userId: number;
}

/**
 * 热门歌手响应结果
 */
export interface HotSingerRes {
  code: number;
  more: boolean;
  artists: SingerVO[];
}

/**
 * 歌手详情
 */
export interface SingerVO {
  albumSize: number;
  alias: string[];
  briefDesc: string;
  followed: false;
  id: number;
  img1v1Id: string;
  img1v1Id_str: string;
  img1v1Url: string;
  musicSize: number;
  name: string;
  picId: string;
  picId_str: string;
  picUrl: string;
  topicPerson: number;
  trans: string;
}
