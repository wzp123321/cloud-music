/**
 * P1 content-detail-enhancement 接口类型
 * 依据 2026-11-09 对 cloud-music-server(10130) 的实测返回结构定义。
 * 上游字段多为可选，统一用宽松类型，避免上游缺字段时渲染报错。
 */

/** 通用响应码 */
export interface ContentResBase {
  code?: number;
  message?: string;
}

/** 专辑（album_new / album_newest / album 详情） */
export interface ContentAlbumItem {
  id?: number;
  name?: string;
  picUrl?: string;
  blurPicUrl?: string;
  publishTime?: number;
  size?: number;
  company?: string;
  description?: string;
  artist?: { id?: number; name?: string };
  artists?: { id?: number; name?: string }[];
}

export interface AlbumNewRes extends ContentResBase {
  total?: number;
  albums?: ContentAlbumItem[];
}

export interface AlbumNewestRes extends ContentResBase {
  albums?: ContentAlbumItem[];
}

/** 数字专辑商品（album_list / album_list_style / album_songsaleboard） */
export interface ContentAlbumProduct {
  albumId?: number;
  albumName?: string;
  artistName?: string;
  coverUrl?: string;
  pubTime?: number;
  saleNum?: number;
  sales?: number;
  price?: number;
  rank?: number;
  rankIncr?: number;
  productId?: number;
  albumType?: number;
}

export interface AlbumListRes extends ContentResBase {
  products?: ContentAlbumProduct[];
}

export interface AlbumListStyleRes extends ContentResBase {
  hasNextPage?: boolean;
  albumProducts?: ContentAlbumProduct[];
}

export interface AlbumSongsaleboardRes extends ContentResBase {
  products?: ContentAlbumProduct[];
}

/** 专辑动态信息 */
export interface AlbumDetailDynamicRes extends ContentResBase {
  onSale?: boolean;
  commentCount?: number;
  likedCount?: number;
  shareCount?: number;
  isSub?: boolean;
  subTime?: number;
  subCount?: number;
  albumGameInfo?: Record<string, any>;
}

/** 收藏专辑列表 */
export interface AlbumSublistRes extends ContentResBase {
  count?: number;
  hasMore?: boolean;
  data?: (ContentAlbumItem & { subTime?: number })[];
}

/** 歌手（artist_list） */
export interface ContentArtistItem {
  id?: number;
  name?: string;
  picUrl?: string;
  img1v1Url?: string;
  albumSize?: number;
  musicSize?: number;
  mvSize?: number;
  briefDesc?: string;
  followed?: boolean;
  trans?: string;
  alias?: string[];
}

export interface ArtistListRes extends ContentResBase {
  more?: boolean;
  total?: number;
  artists?: ContentArtistItem[];
}

/** 歌曲（artist_top_song / artist_songs / artist_new_song） */
export interface ContentSongItem {
  id?: number;
  name?: string;
  dt?: number;
  duration?: number;
  mv?: number;
  fee?: number;
  al?: { id?: number; name?: string; picUrl?: string };
  album?: { id?: number; name?: string; picUrl?: string };
  ar?: { id?: number; name?: string }[];
  artists?: { id?: number; name?: string }[];
  publishTime?: number;
}

export interface ArtistTopSongRes extends ContentResBase {
  more?: boolean;
  songs?: ContentSongItem[];
}

export interface ArtistSongsRes extends ContentResBase {
  more?: boolean;
  total?: number;
  songs?: ContentSongItem[];
}

export interface ArtistNewSongRes extends ContentResBase {
  data?: ContentSongItem[] | { list?: ContentSongItem[] };
}

export interface ArtistNewMvRes extends ContentResBase {
  data?: ContentMvItem[] | { list?: ContentMvItem[] };
}

/** 歌手相关视频（artist_video 返回 data.feeds / data.records） */
export interface ContentVideoItem {
  id?: number | string;
  vid?: string;
  title?: string;
  content?: string;
  coverUrl?: string;
  playCount?: number;
  duration?: number;
  creator?: { nickname?: string };
}

export interface ArtistVideoRes extends ContentResBase {
  data?: {
    records?: ContentVideoItem[];
    feeds?: ContentVideoItem[];
    page?: Record<string, any>;
  };
}

/** 歌手粉丝 */
export interface ArtistFansRes extends ContentResBase {
  data?: { userProfile?: { userId?: number; nickname?: string; avatarUrl?: string } }[];
}

export interface ArtistFollowCountRes extends ContentResBase {
  data?: {
    isFollow?: boolean;
    fansCnt?: number;
    followCnt?: number;
    followDay?: number;
    followDayCnt?: number;
    follow?: boolean;
  };
}

export interface ArtistSublistRes extends ContentResBase {
  count?: number;
  data?: ContentArtistItem[];
}

/** MV（mv_all / mv_exclusive_rcmd / mv_first） */
export interface ContentMvItem {
  id?: number;
  mvid?: number;
  name?: string;
  cover?: string;
  picUrl?: string;
  artistName?: string;
  artistId?: number;
  playCount?: number;
  duration?: number;
  briefDesc?: string;
  desc?: string;
  subed?: boolean;
  publishTime?: string;
}

export interface MvListRes extends ContentResBase {
  count?: number;
  hasMore?: boolean;
  more?: boolean;
  data?: ContentMvItem[];
}

/** MV 点赞/转发/评论数 */
export interface MvDetailInfoRes extends ContentResBase {
  likedCount?: number;
  shareCount?: number;
  commentCount?: number;
  liked?: boolean;
}

export interface MvSublistRes extends ContentResBase {
  count?: number;
  hasMore?: boolean;
  data?: (ContentMvItem & { subTime?: number })[];
}

/** 订阅/收藏写操作响应 */
export interface ContentSubRes extends ContentResBase {
  data?: any;
}
