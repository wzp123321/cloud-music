import { getRequest } from '@/services/request';

/**
 * P2 8.x「杂项长尾」接口封装（共 9 个）。
 *
 * URL 规则：module 文件名下划线转斜杠；完整清单见 api-inventory-plain.md，禁止凭记忆猜 URL。
 * 统一约定：
 * - 一律 getRequest(url, params)；每个请求 try/catch，失败返回空对象 {}；
 * - 返回体保持原始结构，由页面 normalize() 兼容 res.data / res.result / res.xxx；
 * - weblog 为写操作，是否发出请求由页面根据 hasLogin() + window.confirm 控制；
 * - calendar 需登录只读（页面未登录降级），时间参数用 new Date() 生成；
 * - pl_count 业务异常属「待核不进主路径」，仅用户手动点击触发，不自动加载。
 */
async function call(url: string, params: Record<string, any> = {}): Promise<any> {
  try {
    const res = await getRequest(url, params);
    return res ?? {};
  } catch {
    return {};
  }
}

const miscLongtailService = {
  //#region 8.1 杂项与统计（9）
  /** 内部版本自检（只读，可 onMounted 自动加载） */
  getInnerVersion: (p: Record<string, any> = {}) => call('/inner/version', p),
  /** Web 日志上报（写操作）：需登录 + 二次确认 */
  sendWeblog: (p: Record<string, any> = {}) => call('/weblog', p),
  /** 阈值详情（只读） */
  getThresholdDetail: (p: Record<string, any> = {}) => call('/threshold/detail/get', p),
  /** 年度听歌总结（只读） */
  getSummaryAnnual: (p: Record<string, any> = {}) => call('/summary/annual', p),
  /** 创作者认证信息（只读） */
  getCreatorAuthinfo: (p: Record<string, any> = {}) => call('/creator/authinfo/get', p),
  /** 计数（待核，业务异常，不进主路径，仅手动触发） */
  getPlCount: (p: Record<string, any> = {}) => call('/pl/count', p),
  /** 批量接口（只读） */
  getBatch: (p: Record<string, any> = {}) => call('/batch', p),
  /** 用户 ID 查询（只读） */
  getUserids: (p: Record<string, any> = {}) => call('/get/userids', p),
  /** 日历（需登录只读，startTime/endTime 用 new Date() 生成） */
  getCalendar: (p: Record<string, any> = {}) => call('/calendar', p),
  //#endregion
};

export default miscLongtailService;
