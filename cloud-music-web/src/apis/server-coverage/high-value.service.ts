import { getRequest, postRequest } from '@/apis/request';

/**
 * 新增对齐接口的业务封装（38 条）。
 *
 * 与 server-coverage.service.ts 的通用调用点不同：这里每条接口都有明确的参数类型与语义，
 * 供业务页面直接消费。URL 以 server/module 文件名规则为准，参数取自 interface.d.ts。
 *
 * 约定：
 * - 统一走 request.ts，自动获得会话凭证注入、文案清洗与错误提示；
 * - 失败返回 null（响应拦截器已统一提示），页面据此降级；
 * - 写操作是否发出由页面用 hasLogin() + 二次确认控制，service 不自动触发。
 */

export type HV_Params = Record<string, unknown>;
/** 上游返回形态不统一，这里只约束公共字段，具体结构由页面按需读取 */
export type HV_Result = Record<string, unknown> & { code?: number; data?: unknown };

const call = async (
  url: string,
  params: HV_Params = {},
  method: 'get' | 'post' = 'get',
): Promise<HV_Result | null> => {
  try {
    const res = method === 'post'
      ? await postRequest<HV_Result>(url, params)
      : await getRequest<HV_Result>(url, params);
    return res ?? null;
  } catch {
    // 响应拦截器已统一提示，业务侧降级即可
    return null;
  }
};

/** 搜索（5） */
export const highValueSearch = {
  /** 歌词搜索：按关键词找含该歌词的歌曲 */
  lyric: (keyword: string, limit = 30, offset = 0) =>
    call('/search/lyric', { keyword, keywords: keyword, limit, offset }),
  /** 歌曲元数据匹配（标题/专辑/歌手/时长） */
  match: (params: { title?: string; album?: string; artist?: string; duration?: number; md5?: string }) =>
    call('/search/match', params as HV_Params),
  /** PC 端搜索联想 */
  suggestPc: (keyword: string) => call('/search/suggest/pc', { keyword }),
  /** 移动端搜索联想 */
  suggestMobile: (keyword: string) => call('/search/suggest/mobile', { keyword, keywords: keyword }),
  /** 歌曲搜索分页列表 */
  songPage: (keyword: string, limit = 30, offset = 0, scene = 'normal') =>
    call('/search/song/list/page', { keyword, keywords: keyword, limit, offset, scene }),
};

/** 歌曲互动（6） */
export const highValueSong = {
  /** 红心 / 取消红心（写操作） */
  like: (id: number | string, like = true) => call('/song/like', { id, like }, 'post'),
  /** 批量查询红心状态，ids 为逗号分隔 */
  likeCheck: (ids: string) => call('/song/like/check', { ids }),
  /** 下载直链，level 见 SoundQualityType 枚举 */
  downloadUrl: (id: number | string, level = 'lossless') =>
    call('/song/download/url/v1', { id, level }),
  /** 相似歌曲 */
  simi: (id: number | string) => call('/song/simi/get', { id }),
  /** 歌曲百科 */
  wiki: (id: number | string) => call('/song/wiki/info', { id }),
  /** 红心数量 */
  redCount: (id: number | string) => call('/song/red/count', { id }),
};

/** 评论（3） */
export const highValueComment = {
  /** 举报评论（写操作）：id 资源 id、cid 评论 id、reason 原因码 */
  report: (id: number | string, cid: number | string, reason: number | string) =>
    call('/comment/report', { id, cid, reason }, 'post'),
  /** 评论信息列表 */
  infoList: (params: { ids?: string; id?: string; type?: number | string }) =>
    call('/comment/info/list', params as HV_Params),
  /** 热评墙广场信息 */
  hotwall: () => call('/comment/hotwall/square/info', {}),
};

/** 歌单（4） */
export const highValuePlaylist = {
  /** 删除歌单（写操作） */
  remove: (id: number | string) => call('/playlist/delete', { id }, 'post'),
  /** 歌单订阅者 */
  subscribers: (id: number | string, limit = 20, offset = 0) =>
    call('/playlist/subscribers', { id, limit, offset }),
  /** 歌单分类列表 */
  categories: (cat = '全部', limit = 24) => call('/playlist/category/list', { cat, limit }),
  /** 歌单相关推荐 */
  rcmd: (id: number | string) => call('/playlist/detail/rcmd/get', { id }),
};

/** 用户（4） */
export const highValueUser = {
  /** 新版用户资料 */
  detailNew: (uid: number | string) => call('/user/detail/new', { uid }),
  /** 用户创建的歌单 */
  created: (uid: number | string, limit = 100, offset = 0) =>
    call('/user/playlist/create', { uid, limit, offset }),
  /** 用户收藏的歌单 */
  collected: (uid: number | string, limit = 100, offset = 0) =>
    call('/user/playlist/collect', { uid, limit, offset }),
  /** 混合关注流 */
  followMixed: (size = 30, cursor = 0, scene = 0) =>
    call('/user/follow/mixed', { size, cursor, scene }),
};

/** 会员（6） */
export const highValueVip = {
  /** VIP 签到（写操作） */
  sign: () => call('/vip/sign', {}, 'post'),
  /** 签到总览 */
  signInfo: () => call('/vip/sign/info', {}),
  /** 签到明细 */
  signDetail: (timestamp: number | string) => call('/vip/sign/detail', { timestamp }),
  /** 签到历史 */
  signHistory: (type = 0) => call('/vip/sign/history', { type }),
  /** 会员任务 */
  tasks: (id?: number | string) => call('/vip/tasks/v1', id === undefined ? {} : { id }),
  /** 成长值总览 */
  growthpoint: () => call('/vip/growthpoint/getall', {}),
};

/** 榜单（3） */
export const highValueChart = {
  /** 全部榜单详情 v2 */
  toplistV2: () => call('/toplist/detail/v2', {}),
  /** 榜单详情 */
  detail: (chartCode: number | string, targetId: number | string, targetType: number | string) =>
    call('/chart/detail', { chartCode, targetId, targetType }),
  /** 榜单歌曲详情 */
  songDetail: (chartCode: number | string, targetId: number | string, targetType: number | string) =>
    call('/chart/song/detail', { chartCode, targetId, targetType }),
};

/** 推荐（3） */
export const highValueRecommend = {
  /** 每日推荐歌曲 v1 */
  songsV1: (ispush = false) => call('/recommend/songs/v1', { ispush }),
  /** 分类推荐歌曲 */
  categorySongs: () => call('/recommend/category/songs', {}),
  /** 推荐分类配置 */
  categoryConfigs: () => call('/recommend/category/configs', {}),
};

/** 云盘与其它（4） */
export const highValueMisc = {
  /** 云盘歌词 */
  cloudLyric: (uid: number | string, sid: number | string) =>
    call('/cloud/lyric/get', { uid, sid }),
  /** 云盘导入（写操作） */
  cloudImport: (params: {
    md5: string;
    id?: number | string;
    bitrate?: number | string;
    fileSize?: number | string;
    artist?: string;
    album?: string;
    song?: string;
    fileType?: string;
  }) => call('/cloud/import', params as HV_Params, 'post'),
  /** 最近收听 */
  recentListen: () => call('/recent/listen/list', {}),
  /** 不喜欢的歌曲 */
  dislikeList: () => call('/dislike/list', {}),
};

export const highValueService = {
  search: highValueSearch,
  song: highValueSong,
  comment: highValueComment,
  playlist: highValuePlaylist,
  user: highValueUser,
  vip: highValueVip,
  chart: highValueChart,
  recommend: highValueRecommend,
  misc: highValueMisc,
};

export default highValueService;
