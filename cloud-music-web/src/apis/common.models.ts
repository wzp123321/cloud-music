/**
 * apis 层公共域模型（MV / 评论 / 歌曲详情）
 *
 * 依据 cloud-music-server 实测返回结构定义；上游缺字段属常态，
 * 除页面强依赖的字段外一律可选，避免渲染期因缺字段抛错。
 */
import type { CM_ICommentVO } from '@/components/cm-comment/cm-comment.api';

/** MV 详情（/mv/detail 的 data） */
export interface CS_IMvDetail {
  id: string;
  name: string;
  artistId: number;
  artistName: string;
  artists: {
    followed: string;
    id: string;
    img1v1Url: string;
    name: string;
  };
  commentCount: string;
  commentThreadId: string;
  cover: string;
  coverId: string;
  coverId_str: string;
  desc: string;
  duration: string;
  nType: string;
  playCount: string;
  price: string;
  publishTime: string;
  shareCount: string;
  subCount: string;
}

/** MV 播放地址（/mv/url 的 data） */
export interface CS_IMvUrl {
  id?: number;
  url?: string;
  r?: number;
  size?: number;
  md5?: string;
  code?: number;
  expi?: number;
  fee?: number;
  mvFee?: number;
  st?: number;
  msg?: string;
}

/** 评论列表（/comment/mv、/comment/playlist 均返回该扁平结构） */
export interface CS_ICommentListRes {
  code?: number;
  total?: number;
  more?: boolean;
  moreHot?: boolean;
  comments?: CM_ICommentVO[];
  hotComments?: CM_ICommentVO[];
}

/** 歌曲详情项（/song/detail 批量返回的元素，字段按需取用） */
export interface CS_ISongDetail {
  id: number;
  name: string;
  /** 时长（毫秒） */
  dt: number;
  al: {
    id?: number;
    name?: string;
    picUrl?: string;
  };
  ar: {
    id?: number | number[];
    name?: string;
  }[];
}

/** 歌曲详情批量响应（/song/detail） */
export interface CS_ISongDetailRes {
  code?: number;
  songs?: CS_ISongDetail[];
}
