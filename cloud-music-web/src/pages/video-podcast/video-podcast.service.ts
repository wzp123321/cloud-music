import { getRequest, postFormRequest } from '@/services/request';

/**
 * P2 2.x 视频与播客（video-podcast）接口封装，共 14 个。
 *
 * URL 规则：module 文件名下划线转斜杠，逐条照抄 api-inventory-plain.md「P2 视频与播客」。
 * 仅 voice_upload 走 postFormRequest（multipart 上传），其余一律 getRequest。
 *
 * 参数来源（p2-tasks.md 接入前置约束 A 节）：
 * - video_detail / video_detail_info / video_url / video_sub 的 id/vid ← video_group_list / video_timeline_* 返回项
 * - voicelist_search / voice_detail 的 id ← voicelist_list 返回项
 * - video_detail 为待核接口（需有效视频 id），仅手动按钮 + 输入框，不进主路径
 * - video_timeline_* / voicelist_* / voice_detail 需登录，未登录 UI 降级
 */

type Params = Record<string, any>;

const videoPodcastService = {
  //#region 2.1 视频发现（5 个）
  /** 视频分类 */
  getVideoCategoryList: (params: Params = {}): Promise<any> => getRequest('/video/category/list', params),
  /** 视频分组 */
  getVideoGroup: (params: Params = {}): Promise<any> => getRequest('/video/group', params),
  /** 视频分组列表：返回项 id/vid 作为 videoId 来源 */
  getVideoGroupList: (params: Params = {}): Promise<any> => getRequest('/video/group/list', params),
  /** 全部视频信息流（需登录）：返回项 id/vid 作为 videoId 来源 */
  getVideoTimelineAll: (params: Params = {}): Promise<any> => getRequest('/video/timeline/all', params),
  /** 推荐视频信息流（需登录） */
  getVideoTimelineRecommend: (params: Params = {}): Promise<any> => getRequest('/video/timeline/recommend', params),
  //#endregion

  //#region 2.2 视频详情 / 播放 / 订阅（4 个）
  /** 视频详情（待核：需有效视频 id，仅手动触发）：id ← video_group_list / video_timeline_all */
  getVideoDetail: (params: Params = {}): Promise<any> => getRequest('/video/detail', params),
  /** 视频详情信息：vid ← 上游视频列表返回项 */
  getVideoDetailInfo: (params: Params = {}): Promise<any> => getRequest('/video/detail/info', params),
  /** 视频播放地址：id ← 上游视频列表返回项 */
  getVideoUrl: (params: Params = {}): Promise<any> => getRequest('/video/url', params),
  /** 订阅/取消订阅视频（写操作）：id ← 上游视频列表；t=1 订阅，t=0 取消 */
  setVideoSub: (params: Params = {}): Promise<any> => getRequest('/video/sub', params),
  //#endregion

  //#region 2.3 播客（5 个）
  /** 播客列表（需登录）：返回项 id 作为 voiceId 来源 */
  getVoicelistList: (params: Params = {}): Promise<any> => getRequest('/voicelist/list', params),
  /** 播客列表搜索（需登录，按关键词） */
  getVoicelistListSearch: (params: Params = {}): Promise<any> => getRequest('/voicelist/list/search', params),
  /** 播客搜索（需登录）：id ← voicelist_list 返回项，或关键词 */
  getVoicelistSearch: (params: Params = {}): Promise<any> => getRequest('/voicelist/search', params),
  /** 播客详情（需登录）：id ← voicelist_list 返回项 */
  getVoiceDetail: (params: Params = {}): Promise<any> => getRequest('/voice/detail', params),
  /** 上传声音（写操作，multipart 上传） */
  uploadVoice: (formData: FormData): Promise<any> => postFormRequest('/voice/upload', formData),
  //#endregion
};

export default videoPodcastService;
