import { getRequest } from '@/apis/request';

/**
 * P2 1.x 电台（dj-radio）接口封装，共 27 个。
 *
 * URL 规则：module 文件名下划线转斜杠，逐条照抄 api-inventory-plain.md「P2 电台」，未凭记忆改写。
 * 本批无 special 例外路由；一律 getRequest，无上传类接口。
 *
 * 参数来源（design.md「编码硬约束」/ p2-tasks.md 接入前置约束 A 节）：
 * - dj_detail / dj_program / dj_subscriber / dj_sub 的 rid ← dj_catelist / dj_recommend / dj_hot / dj_toplist* 返回项
 * - dj_program_detail 的 id ← dj_program 的 programs[].id
 * - dj_radio_hot 的 cateId ← dj_catelist 返回项
 * - aidj_content_rcmd 为待核接口，仅手动触发，不进主路径
 */

type Params = Record<string, any>;

const djRadioService = {
  //#region 1.1 电台发现（9 个，匿名只读）
  /** 电台分类：返回 categories[].id，作为 cateId 来源 */
  getDjCatelist: (params: Params = {}): Promise<any> => getRequest('/dj/catelist', params),
  /** 分类推荐：cateId ← dj_catelist */
  getDjCategoryRecommend: (params: Params = {}): Promise<any> => getRequest('/dj/category/recommend', params),
  /** 分类冷门（排除热门） */
  getDjCategoryExcludehot: (params: Params = {}): Promise<any> => getRequest('/dj/category/excludehot', params),
  /** 电台轮播 banner */
  getDjBanner: (params: Params = {}): Promise<any> => getRequest('/dj/banner', params),
  /** 热门电台：djRadios[].id 作为 rid 来源 */
  getDjHot: (params: Params = {}): Promise<any> => getRequest('/dj/hot', { limit: 30, ...params }),
  /** 推荐电台：djRadios[].id 作为 rid 来源 */
  getDjRecommend: (params: Params = {}): Promise<any> => getRequest('/dj/recommend', params),
  /** 分类类型推荐 */
  getDjRecommendType: (params: Params = {}): Promise<any> => getRequest('/dj/recommend/type', params),
  /** 个性化推荐 */
  getDjPersonalizeRecommend: (params: Params = {}): Promise<any> => getRequest('/dj/personalize/recommend', params),
  /** 今日优选（清单拼写 perfered，照抄） */
  getDjTodayPerfered: (params: Params = {}): Promise<any> => getRequest('/dj/today/perfered', params),
  //#endregion

  //#region 1.2 电台详情与节目（6 个）
  /** 电台详情：rid ← 上游电台列表返回项 */
  getDjDetail: (params: Params = {}): Promise<any> => getRequest('/dj/detail', params),
  /** 电台节目：rid ← 上游电台列表返回项；返回 programs[].id 作为 programId 来源 */
  getDjProgram: (params: Params = {}): Promise<any> => getRequest('/dj/program', { limit: 30, ...params }),
  /** 节目详情：id ← dj_program 的 programs[].id */
  getDjProgramDetail: (params: Params = {}): Promise<any> => getRequest('/dj/program/detail', params),
  /** 节目榜单 */
  getDjProgramToplist: (params: Params = {}): Promise<any> => getRequest('/dj/program/toplist', params),
  /** 节目小时榜 */
  getDjProgramToplistHours: (params: Params = {}): Promise<any> => getRequest('/dj/program/toplist/hours', params),
  /** 分类热门电台：cateId ← dj_catelist */
  getDjRadioHot: (params: Params = {}): Promise<any> => getRequest('/dj/radio/hot', params),
  //#endregion

  //#region 1.3 订阅 / 礼物 / 榜单（9 个）
  /** 订阅/取消订阅电台（写操作）：rid ← 上游电台列表；t=1 订阅，t=0 取消 */
  setDjSub: (params: Params = {}): Promise<any> => getRequest('/dj/sub', params),
  /** 我的订阅电台列表（需登录只读） */
  getDjSublist: (params: Params = {}): Promise<any> => getRequest('/dj/sublist', params),
  /** 电台订阅者：rid ← 上游电台列表 */
  getDjSubscriber: (params: Params = {}): Promise<any> => getRequest('/dj/subscriber', params),
  /** 电台付费礼物 */
  getDjPaygift: (params: Params = {}): Promise<any> => getRequest('/dj/paygift', params),
  /** 电台榜：返回项作为 rid 来源 */
  getDjToplist: (params: Params = {}): Promise<any> => getRequest('/dj/toplist', params),
  /** 电台小时榜：返回项作为 rid 来源 */
  getDjToplistHours: (params: Params = {}): Promise<any> => getRequest('/dj/toplist/hours', params),
  /** 电台新人榜：返回项作为 rid 来源 */
  getDjToplistNewcomer: (params: Params = {}): Promise<any> => getRequest('/dj/toplist/newcomer', params),
  /** 电台付费榜：返回项作为 rid 来源 */
  getDjToplistPay: (params: Params = {}): Promise<any> => getRequest('/dj/toplist/pay', params),
  /** 电台热门榜：返回项作为 rid 来源 */
  getDjToplistPopular: (params: Params = {}): Promise<any> => getRequest('/dj/toplist/popular', params),
  //#endregion

  //#region 1.4 节目推荐 / AI 推荐 / 音频匹配（3 个）
  /** 节目推荐 */
  getProgramRecommend: (params: Params = {}): Promise<any> => getRequest('/program/recommend', params),
  /** AI DJ 内容推荐（待核：业务异常，仅手动触发，不进主路径） */
  getAidjContentRcmd: (params: Params = {}): Promise<any> => getRequest('/aidj/content/rcmd', params),
  /** 音频匹配（手动，带 id 输入） */
  getAudioMatch: (params: Params = {}): Promise<any> => getRequest('/audio/match', params),
  //#endregion
};

export default djRadioService;
