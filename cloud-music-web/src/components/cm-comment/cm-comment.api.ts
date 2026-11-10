import { Common_IUserVO } from '../../apis/common-api/user-api';
import { getRequest, postRequest } from '../../apis/request';

/**
 * 评论互动接口封装（comment-interaction）
 * 路由名 = server module 文件名下划线转斜杠，统一走 request.ts 封装。
 * @see cloud-music-server/module/comment_*.js
 */

/** 评论资源类型（对应 server util/config.json 的 resourceTypeMap 语义） */
export type CM_CommentType = 'music' | 'album' | 'playlist' | 'mv' | 'dj' | 'video' | 'event';

/** 资源类型 → 通用评论接口(comment_like/hot/floor/new/hug_list)所需的数字 type */
export const CM_COMMENT_TYPE_NUM: Record<CM_CommentType, number> = {
  music: 0,
  mv: 1,
  playlist: 2,
  album: 3,
  dj: 4,
  video: 5,
  event: 6,
};

/** 资源类型 → 各类型评论列表路由（server 文件名下划线转斜杠） */
export const CM_COMMENT_ROUTE: Record<CM_CommentType, string> = {
  music: '/comment/music',
  album: '/comment/album',
  playlist: '/comment/playlist',
  mv: '/comment/mv',
  dj: '/comment/dj',
  video: '/comment/video',
  event: '/comment/event',
};

/**
 * 评论
 */
export interface CM_ICommentVO {
  beReplied?: CM_ICommentVO[];
  commentId?: number;
  commentLocationType?: number;
  content?: string;
  liked?: boolean;
  likedCount?: number;
  needDisplayTime?: boolean;
  parentCommentId?: number;
  repliedMark?: string;
  richContent?: string;
  showFloorComment?: string;
  status?: number;
  time?: number;
  timeStr?: string;
  ipLocation?: {
    ip?: string;
    location?: string;
    userId?: string;
  };
  pendantData?: CM_ICommentVO;
  user?: Common_IUserVO;
  [key: string]: any;
}

/** 评论列表响应（comment_music~event / comment_hot） */
export interface CM_ICommentListRes {
  code?: number;
  hotComments?: CM_ICommentVO[];
  comments?: CM_ICommentVO[];
  total?: number;
  more?: boolean;
  moreHot?: boolean;
  [key: string]: any;
}

/** 新版通用评论响应（comment_new） */
export interface CM_ICommentNewRes {
  code?: number;
  data?: {
    comments?: CM_ICommentVO[];
    hotComments?: CM_ICommentVO[];
    totalCount?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

/** 楼层评论响应（comment_floor） */
export interface CM_ICommentFloorRes {
  code?: number;
  data?: {
    comments?: CM_ICommentVO[];
    ownerComment?: CM_ICommentVO;
    totalCount?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

/** 点赞用户列表响应（comment_hug_list） */
export interface CM_IHugListRes {
  code?: number;
  data?: {
    hugComments?: CM_ICommentVO[];
    comments?: CM_ICommentVO[];
    [key: string]: any;
  };
  hugComments?: CM_ICommentVO[];
  [key: string]: any;
}

/** 通用资源参数 */
interface CM_IResourceParam {
  type: CM_CommentType;
  id: number | string;
  threadId?: string;
  [key: string]: any;
}

//#region 各类型评论列表 comment_music/album/playlist/mv/dj/video/event
/**
 * 按资源类型拉取评论列表（含热评）
 * event 类型需额外传 threadId（comment_event 以 threadId 作为评论 thread）
 */
export const getCommentList = (
  type: CM_CommentType,
  id: number | string,
  params: {
    limit?: number;
    offset?: number;
    before?: number;
    threadId?: string;
    [key: string]: any;
  } = {},
): Promise<CM_ICommentListRes> => getRequest(CM_COMMENT_ROUTE[type], { id, ...params });
//#endregion

//#region 通用评论能力
/** 新版通用评论列表（comment_new；sortType 99 推荐 / 2 热度 / 3 时间） */
export const getCommentNew = (
  params: CM_IResourceParam & {
    pageNo?: number;
    pageSize?: number;
    sortType?: number;
    cursor?: string;
  },
): Promise<CM_ICommentNewRes> => {
  const { type, id, threadId, ...rest } = params;
  return getRequest('/comment/new', {
    type: CM_COMMENT_TYPE_NUM[type] ?? 0,
    id,
    ...(threadId ? { threadId } : {}),
    ...rest,
  });
};

/** 热门评论（comment_hot） */
export const getCommentHot = (
  params: CM_IResourceParam & { limit?: number; offset?: number; before?: number },
): Promise<CM_ICommentListRes> => {
  const { type, id, threadId, ...rest } = params;
  return getRequest('/comment/hot', {
    type: CM_COMMENT_TYPE_NUM[type] ?? 0,
    id,
    ...(threadId ? { threadId } : {}),
    ...rest,
  });
};

/** 楼层评论（comment_floor） */
export const getCommentFloor = (
  params: CM_IResourceParam & {
    parentCommentId: number;
    time?: number;
    limit?: number;
  },
): Promise<CM_ICommentFloorRes> => {
  const { type, id, threadId, ...rest } = params;
  return getRequest('/comment/floor', {
    type: CM_COMMENT_TYPE_NUM[type] ?? 0,
    id,
    ...(threadId ? { threadId } : {}),
    ...rest,
  });
};

/** 点赞用户列表（comment_hug_list） */
export const getCommentHugList = (
  params: CM_IResourceParam & {
    cid: number;
    uid?: number | string;
    page?: number;
    pageSize?: number;
    cursor?: string;
  },
): Promise<CM_IHugListRes> => {
  const { type, id, threadId, ...rest } = params;
  return getRequest('/comment/hug/list', {
    type: CM_COMMENT_TYPE_NUM[type] ?? 0,
    sid: id,
    ...(threadId ? { threadId } : {}),
    ...rest,
  });
};

/** 点赞 / 取消点赞评论（comment_like；t=1 点赞 / 0 取消） */
export const likeComment = (
  params: CM_IResourceParam & { cid: number; t: 1 | 0 },
): Promise<any> => {
  const { type, id, threadId, ...rest } = params;
  return postRequest('/comment/like', {
    type: CM_COMMENT_TYPE_NUM[type] ?? 0,
    id,
    ...(threadId ? { threadId } : {}),
    ...rest,
  });
};

/**
 * 发布 / 删除 / 回复评论（comment；t=1 发布 / 0 删除 / 2 回复）
 * 说明：契约以 comment_new 指代发评，但 server 的 comment_new 实为「新版评论列表」接口，
 * 真正写评论由 comment.js 提供，故发评走 /comment，comment_new 用于列表刷新。
 */
export const sendComment = (
  params: CM_IResourceParam & {
    content?: string;
    commentId?: number;
    t?: 1 | 0 | 2;
  },
): Promise<any> => {
  const { type, id, threadId, ...rest } = params;
  return postRequest('/comment', {
    type: CM_COMMENT_TYPE_NUM[type] ?? 0,
    id,
    t: 1,
    ...(threadId ? { threadId } : {}),
    ...rest,
  });
};
//#endregion
