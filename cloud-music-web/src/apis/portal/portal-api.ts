import { Common_IUserVO } from '@/apis/common/user.api';

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
  // 跳转地址（部分 banner 才有，模板点击时使用）
  url: string;
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
  creator: Common_IUserVO;
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
  tracks: { id: number; name: string; ar?: SingerVO[] }[];
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

/**
 * 查询新碟参数
 */
export interface NewDVDParams {
  limit: number;
  area: string;
}

//#region 首页区块瀑布流 / 金刚区
/**
 * 首页区块瀑布流资源 UI
 */
export interface HomepageBlockResourceUI {
  image?: { imageUrl?: string };
  mainTitle?: { title?: string };
  subTitle?: { title?: string };
}

/**
 * 首页区块资源（歌单/歌曲/专辑/视频等）
 */
export interface HomepageBlockResource {
  resourceId?: string | number;
  resourceType?: string;
  resourceUrl?: string;
  uiElement?: HomepageBlockResourceUI;
  action?: { actionType?: string; businessId?: number };
  // 兼容专辑/歌曲等嵌套资源
  resourceExtInfo?: Record<string, any>;
}

/**
 * 首页区块创意分组
 */
export interface HomepageBlockCreative {
  creativeId?: string | number;
  resources?: HomepageBlockResource[];
}

/**
 * 首页单个区块
 */
export interface HomepageBlock {
  blockCode?: string;
  showType?: string;
  uiElement?: {
    title?: { title?: string };
    subTitle?: { title?: string };
  };
  creatives?: HomepageBlockCreative[];
  // 部分区块（如 BANNER）直接平铺资源
  resources?: HomepageBlockResource[];
  extInfo?: Record<string, any>;
}

/**
 * 首页区块瀑布流响应
 */
export interface HomepageBlockPageRes {
  code?: number;
  message?: string;
  data?: {
    blocks?: HomepageBlock[];
    cursor?: string;
    hasMore?: boolean;
  };
}

/**
 * 金刚区入口项
 */
export interface DragonBallItem {
  id?: string | number;
  name?: string;
  iconUrl?: string;
  // 跳转类型（参考 TARGET_TYPE）
  actionType?: string;
  action?: { actionType?: string; data?: Record<string, any> } | string;
  url?: string;
}

/**
 * 金刚区响应
 */
export interface DragonBallRes {
  code?: number;
  // 上游两种形态：data 直接是数组，或 data 包一层 ballList
  data?: DragonBallItem[] | { ballList?: DragonBallItem[] };
  ballList?: DragonBallItem[];
}
//#endregion

//#region 个性化推荐
/**
 * 推荐歌单项（personalized）
 */
export interface PersonalizedItem {
  id?: number;
  type?: number;
  name?: string;
  copywriter?: string;
  picUrl?: string;
  playCount?: number;
  trackCount?: number;
  creator?: { userId?: number; nickname?: string };
}

/**
 * 个性化推荐歌单响应
 */
export interface PersonalizedRes {
  code?: number;
  result?: PersonalizedItem[];
  hasTaste?: boolean;
}

/**
 * 推荐新歌项（personalized_newsong）
 */
export interface PersonalizedNewSongItem {
  id?: number;
  name?: string;
  picUrl?: string;
  song?: {
    id?: number;
    name?: string;
    alias?: string[];
    artists?: { id?: number; name?: string }[];
    album?: { id?: number; name?: string; picUrl?: string };
  };
}

/**
 * 推荐新歌响应
 */
export interface PersonalizedNewSongRes {
  code?: number;
  result?: PersonalizedNewSongItem[];
}

/**
 * 推荐电台项（personalized_djprogram）
 */
export interface PersonalizedDjItem {
  id?: number;
  name?: string;
  picUrl?: string;
  program?: {
    id?: number;
    name?: string;
    mainSong?: { id?: number; name?: string; artists?: { id?: number; name?: string }[] };
    radio?: { id?: number; name?: string };
  };
}

/**
 * 推荐电台响应
 */
export interface PersonalizedDjRes {
  code?: number;
  result?: PersonalizedDjItem[];
}

/**
 * 推荐 MV 项（personalized_mv）
 */
export interface PersonalizedMvItem {
  id?: number;
  name?: string;
  picUrl?: string;
  playCount?: number;
  artistName?: string;
  duration?: number;
  copywriter?: string;
}

/**
 * 推荐 MV 响应
 */
export interface PersonalizedMvRes {
  code?: number;
  result?: PersonalizedMvItem[];
}

/**
 * 独家放送项（personalized_privatecontent）
 */
export interface PersonalizedPrivateItem {
  id?: number;
  name?: string;
  picUrl?: string;
  sPicUrl?: string;
  copywriter?: string;
}

/**
 * 独家放送响应
 */
export interface PersonalizedPrivateRes {
  code?: number;
  result?: PersonalizedPrivateItem[];
}
//#endregion

//#region 每日推荐
/**
 * 每日推荐歌单项（recommend_resource）
 */
export interface RecommendResourceItem {
  id?: number;
  type?: number;
  name?: string;
  copywriter?: string;
  picUrl?: string;
  playCount?: number;
  trackCount?: number;
  reason?: string;
  creator?: { userId?: number; nickname?: string };
}

/**
 * 每日推荐歌单响应
 */
export interface RecommendResourceRes {
  code?: number;
  recommend?: RecommendResourceItem[];
  hasTaste?: boolean;
}

/**
 * 每日推荐歌曲项（recommend_songs）
 */
export interface RecommendSongItem {
  id?: number;
  name?: string;
  alias?: string[];
  album?: { id?: number; name?: string; picUrl?: string };
  artists?: { id?: number; name?: string }[];
}

/**
 * 每日推荐歌曲响应
 */
export interface RecommendSongsRes {
  code?: number;
  data?: {
    dailySongs?: RecommendSongItem[];
    recommendReasons?: { songId?: number; reason?: string }[];
  };
}

/**
 * 不感兴趣响应
 */
export interface RecommendDislikeRes {
  code?: number;
  result?: number;
}
//#endregion

//#region 排行榜
/**
 * 榜单列表项（toplist）
 */
export interface TopListItem {
  id?: number;
  name?: string;
  coverImgUrl?: string;
  description?: string;
  updateFrequency?: string;
  playCount?: number;
  trackCount?: number;
  ToplistType?: string;
}

/**
 * 所有榜单响应
 */
export interface ToplistRes {
  code?: number;
  list?: TopListItem[];
  artistToplist?: Record<string, any>;
}

/**
 * 单个榜单详情（top_list）
 */
export interface TopListTrack {
  id?: number;
  name?: string;
  ar?: { id?: number; name?: string }[];
  al?: { id?: number; name?: string; picUrl?: string };
}

/**
 * 单个榜单详情响应
 */
export interface TopListRes {
  code?: number;
  playlist?: {
    id?: number;
    name?: string;
    coverImgUrl?: string;
    description?: string;
    trackCount?: number;
    tracks?: TopListTrack[];
  };
}

/**
 * 精品歌单项（top_playlist_highquality）
 */
export interface HighqualityItem {
  id?: number;
  name?: string;
  coverImgUrl?: string;
  playCount?: number;
  trackCount?: number;
  tag?: string;
  creator?: { userId?: number; nickname?: string };
}

/**
 * 精品歌单响应
 */
export interface TopPlaylistHighqualityRes {
  code?: number;
  playlists?: HighqualityItem[];
  total?: number;
  lasttime?: number;
  more?: boolean;
}

/**
 * 新歌速递项（top_song）
 */
export interface TopSongItem {
  id?: number;
  name?: string;
  album?: { id?: number; name?: string; picUrl?: string };
  artists?: { id?: number; name?: string }[];
}

/**
 * 新歌速递响应
 */
export interface TopSongRes {
  code?: number;
  data?: TopSongItem[];
}

/**
 * MV 排行榜项（top_mv）
 */
export interface TopMvItem {
  id?: number;
  name?: string;
  cover?: string;
  playCount?: number;
  duration?: number;
  artists?: { id?: number; name?: string }[];
}

/**
 * MV 排行榜响应
 */
export interface TopMvRes {
  code?: number;
  data?: TopMvItem[];
  hasMore?: boolean;
  updateTime?: number;
}
//#endregion
