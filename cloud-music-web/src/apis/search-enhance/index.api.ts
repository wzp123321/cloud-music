 
/**
 * 搜索增强接口封装（search-enhancement）
 * 路由名 = server module 文件名下划线转斜杠，统一走 request.ts 封装
 * @see cloud-music-server/module/search_hot.js
 * @see cloud-music-server/module/search_hot_detail.js
 * @see cloud-music-server/module/search_suggest.js
 * @see cloud-music-server/module/search_multimatch.js
 */
import { getRequest } from '../request';

//#region 类型定义
/** 热搜榜单项（search_hot 返回） */
export interface SE_HotItem {
  /** 热搜词 */
  first: string;
  /** 副标题/描述 */
  second?: string;
  /** 角标类型：1 热 / 2 新 / 3 其他 */
  third?: number;
  iconUrl?: string;
  iconType?: number;
  [key: string]: unknown;
}

/** 热搜榜响应（search_hot） */
export interface SE_HotRes {
  code?: number;
  result?: {
    hots?: SE_HotItem[];
  };
  [key: string]: unknown;
}

/** 热搜详情单项（search_hot_detail 返回） */
export interface SE_HotDetailItem {
  /** 热搜词 */
  searchWord: string;
  /** 描述内容 */
  content?: string;
  /** 热度分 */
  score?: number;
  iconUrl?: string;
  iconType?: number;
  [key: string]: unknown;
}

/** 热搜详情响应（search_hot_detail） */
export interface SE_HotDetailRes {
  code?: number;
  data?: SE_HotDetailItem[];
  [key: string]: unknown;
}

/** 搜索建议原始响应（search_suggest，type=mobile） */
export interface SE_SuggestRes {
  code?: number;
  result?: { [key: string]: unknown[] };
  order?: string[];
  [key: string]: unknown;
}

/** 归一化后的搜索建议项 */
export interface SE_SuggestItem {
  /** 建议文本 */
  keyword: string;
  /** 建议来源类型 */
  type: 'song' | 'artist' | 'album' | 'playlist' | 'mv' | 'other';
}

/** 多重匹配响应（search_multimatch） */
export interface SE_MultimatchRes {
  code?: number;
  result?: {
    /** 各类型顺序，如 ['artist','album','playlist','song','video'] */
    orders?: string[];
    artist?: unknown[];
    album?: unknown[];
    playlist?: unknown[];
    song?: unknown[];
    video?: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
//#endregion

//#region ① 热搜榜
/** 热门搜索（热搜榜） */
export const getSearchHot = (): Promise<SE_HotRes> => getRequest('/search/hot');

/** 热搜列表（热搜详情，含描述与热度） */
export const getSearchHotDetail = (): Promise<SE_HotDetailRes> =>
  getRequest('/search/hot/detail');
//#endregion

//#region ② 搜索建议
/**
 * 搜索建议（输入联想）
 * @param keywords 输入关键词
 * @param type 联想类型：mobile 返回 keyword 联想词；web 返回分类结果（默认 mobile）
 */
export const getSearchSuggest = (
  keywords: string,
  type: 'mobile' | 'web' = 'mobile',
): Promise<SE_SuggestRes> =>
  getRequest('/search/suggest', { keywords, type });
//#endregion

//#region ③ 多重匹配
/**
 * 多类型搜索概览（歌手/歌单/专辑/歌曲/MV 等匹配数量）
 * @param keywords 关键词
 * @param type 搜索类型，默认 1（单曲），可传对应 SEARCH_TYPE 数值串
 */
export const getSearchMultimatch = (params: {
  keywords: string;
  type?: number | string;
}): Promise<SE_MultimatchRes> =>
  getRequest('/search/multimatch', {
    keywords: params.keywords,
    type: params.type ?? 1,
  });
//#endregion
