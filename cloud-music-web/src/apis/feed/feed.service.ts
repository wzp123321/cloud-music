import { getRequest } from '@/apis/request';

/**
 * P1 5.x 动态与话题（feed-topic）接口封装。
 *
 * URL 规则：module 文件名下划线转斜杠，完整清单见 api-inventory-plain.md「P1 动态与话题」。
 * 一律走 getRequest（与 content-enhance.service.ts 一致）。
 *
 * 参数来源（design.md 编码硬约束）：
 * - event_del / event_forward 的 id ← event 返回动态项，或页面输入
 * - topic_detail / topic_detail_event_hot 的 actid ← hot_topic 返回项，或页面输入
 * - related_allvideo / related_playlist 的 id ← 页面输入或列表项
 * - hot_topic 在本页 5.2 有独立调用点（与 P1 2.4 重复但不共用）
 */

type Params = Record<string, any>;

const feedService = {
  //#region 5.1 动态流
  /** 动态列表（需登录只读） */
  getEvent: (params: Params = {}): Promise<any> => getRequest('/event', params),
  /** 删除动态（写操作） */
  delEvent: (params: Params): Promise<any> => getRequest('/event/del', params),
  /** 转发动态（写操作） */
  forwardEvent: (params: Params): Promise<any> => getRequest('/event/forward', params),
  //#endregion

  //#region 5.2 话题
  /** 话题详情：actid ← hot_topic 点选或输入 */
  getTopicDetail: (params: Params = {}): Promise<any> => getRequest('/topic/detail', params),
  /** 话题热门动态：actid ← hot_topic 点选或输入 */
  getTopicDetailEventHot: (params: Params = {}): Promise<any> => getRequest('/topic/detail/event/hot', params),
  /** 已订阅话题（需登录只读） */
  getTopicSublist: (params: Params = {}): Promise<any> => getRequest('/topic/sublist', params),
  /** 热门话题（本页独立调用点） */
  getHotTopic: (params: Params = {}): Promise<any> => getRequest('/hot/topic', params),
  //#endregion

  //#region 5.3 相关推荐
  /** 相关视频：id ← 页面输入或列表项 */
  getRelatedAllvideo: (params: Params = {}): Promise<any> => getRequest('/related/allvideo', params),
  /** 相关歌单：id ← 页面输入或列表项 */
  getRelatedPlaylist: (params: Params = {}): Promise<any> => getRequest('/related/playlist', params),
  //#endregion
};

export default feedService;
