import { getRequest } from '@/services/request';

/**
 * P2 3.x 云贝/会员/音乐人（yunbei-vip-musician）接口封装，共 25 个。
 *
 * URL 规则：module 文件名下划线转斜杠，逐条照抄 api-inventory-plain.md「P2 云贝/会员/音乐人」。
 * 一律 getRequest，无上传类接口。
 *
 * 约束（p2-tasks.md 接入前置约束 B 节）：
 * - yunbei* / vip_* / musician_* 均为需登录只读，未登录 UI 降级不发请求
 * - /yunbei/info 上游 404「已登记失效」，不进主流程自动请求（页面提供手动查看说明按钮，不发请求）
 * - 写操作：yunbei_sign / yunbei_task_finish / yunbei_rcmd_song / musician_sign
 *   → 未登录降级、window.confirm 二次确认、禁止 onMounted 自动调用
 */

type Params = Record<string, any>;

const yunbeiVipMusicianService = {
  //#region 3.1 云贝积分（11 个）
  /** 云贝余额/总额（需登录只读） */
  getYunbei: (params: Params = {}): Promise<any> => getRequest('/yunbei', params),
  /** 云贝信息（已登记失效：上游 404，仅登记不接入主路径） */
  getYunbeiInfo: (params: Params = {}): Promise<any> => getRequest('/yunbei/info', params),
  /** 云贝支出（需登录只读） */
  getYunbeiExpense: (params: Params = {}): Promise<any> => getRequest('/yunbei/expense', params),
  /** 云贝收入（需登录只读） */
  getYunbeiReceipt: (params: Params = {}): Promise<any> => getRequest('/yunbei/receipt', params),
  /** 云贝签到（写操作） */
  setYunbeiSign: (params: Params = {}): Promise<any> => getRequest('/yunbei/sign', params),
  /** 今日云贝（需登录只读） */
  getYunbeiToday: (params: Params = {}): Promise<any> => getRequest('/yunbei/today', params),
  /** 推荐歌曲（写操作） */
  setYunbeiRcmdSong: (params: Params = {}): Promise<any> => getRequest('/yunbei/rcmd/song', params),
  /** 推荐歌曲历史（需登录只读） */
  getYunbeiRcmdSongHistory: (params: Params = {}): Promise<any> => getRequest('/yunbei/rcmd/song/history', params),
  /** 完成任务（写操作） */
  setYunbeiTaskFinish: (params: Params = {}): Promise<any> => getRequest('/yunbei/task/finish', params),
  /** 云贝任务（需登录只读） */
  getYunbeiTasks: (params: Params = {}): Promise<any> => getRequest('/yunbei/tasks', params),
  /** 待办云贝任务（需登录只读） */
  getYunbeiTasksTodo: (params: Params = {}): Promise<any> => getRequest('/yunbei/tasks/todo', params),
  //#endregion

  //#region 3.2 会员成长（7 个，均需登录只读）
  /** 会员信息 */
  getVipInfo: (params: Params = {}): Promise<any> => getRequest('/vip/info', params),
  /** 会员信息 v2 */
  getVipInfoV2: (params: Params = {}): Promise<any> => getRequest('/vip/info/v2', params),
  /** 成长值 */
  getVipGrowthpoint: (params: Params = {}): Promise<any> => getRequest('/vip/growthpoint', params),
  /** 成长值获取记录 */
  getVipGrowthpointGet: (params: Params = {}): Promise<any> => getRequest('/vip/growthpoint/get', params),
  /** 成长值明细 */
  getVipGrowthpointDetails: (params: Params = {}): Promise<any> => getRequest('/vip/growthpoint/details', params),
  /** 会员任务 */
  getVipTasks: (params: Params = {}): Promise<any> => getRequest('/vip/tasks', params),
  /** 会员时光机 */
  getVipTimemachine: (params: Params = {}): Promise<any> => getRequest('/vip/timemachine', params),
  //#endregion

  //#region 3.3 音乐人中心（7 个）
  /** 音乐人签到（写操作） */
  setMusicianSign: (params: Params = {}): Promise<any> => getRequest('/musician/sign', params),
  /** 音乐人任务（需登录只读） */
  getMusicianTasks: (params: Params = {}): Promise<any> => getRequest('/musician/tasks', params),
  /** 音乐人新任务（需登录只读） */
  getMusicianTasksNew: (params: Params = {}): Promise<any> => getRequest('/musician/tasks/new', params),
  /** 音乐人云豆（需登录只读） */
  getMusicianCloudbean: (params: Params = {}): Promise<any> => getRequest('/musician/cloudbean', params),
  /** 音乐人云豆获取（需登录只读） */
  getMusicianCloudbeanObtain: (params: Params = {}): Promise<any> => getRequest('/musician/cloudbean/obtain', params),
  /** 音乐人数据概览（需登录只读） */
  getMusicianDataOverview: (params: Params = {}): Promise<any> => getRequest('/musician/data/overview', params),
  /** 音乐人播放趋势（需登录只读） */
  getMusicianPlayTrend: (params: Params = {}): Promise<any> => getRequest('/musician/play/trend', params),
  //#endregion
};

export default yunbeiVipMusicianService;
