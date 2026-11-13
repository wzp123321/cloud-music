import { getRequest } from '@/apis/request';

/**
 * P2 5.x「粉丝中心与数字专辑」接口封装（共 9 个）。
 *
 * URL 规则：module 文件名下划线转斜杠；完整清单见 api-inventory-plain.md，禁止凭记忆猜 URL。
 * 统一约定：
 * - 一律 getRequest(url, params)；每个请求 try/catch，失败返回空对象 {}；
 * - 返回体保持原始结构，由页面 normalize() 兼容 res.data / res.result / res.xxx；
 * - 粉丝中心接口全部需登录只读（页面未登录降级不发请求）；
 * - digitalAlbum_detail / digitalAlbum_sales 需有效 id，属「待核不进主路径」，仅用户手动输入 id 点击后触发；
 * - digitalAlbum_ordering 为写操作，是否发出请求由页面根据 hasLogin() + window.confirm 控制。
 */
const call = async (url: string, params: Record<string, unknown> = {}): Promise<any> => {
  try {
    const res = await getRequest(url, params);
    return res ?? {};
  } catch {
    // 上游异常，降级为空对象，避免未捕获异常打断页面（响应拦截器统一提示，此处不重复 message.error）
    return {};
  }
}

const fanscenterDigitalalbumService = {
  //#region 5.1 粉丝中心（5，均需登录只读）
  /** 粉丝概览（需登录只读） */
  getFansOverview: (p: Record<string, any> = {}) => call('/fanscenter/overview/get', p),
  /** 粉丝画像-年龄（需登录只读） */
  getFansAge: (p: Record<string, any> = {}) => call('/fanscenter/basicinfo/age/get', p),
  /** 粉丝画像-性别（需登录只读） */
  getFansGender: (p: Record<string, any> = {}) => call('/fanscenter/basicinfo/gender/get', p),
  /** 粉丝画像-省份（需登录只读） */
  getFansProvince: (p: Record<string, any> = {}) => call('/fanscenter/basicinfo/province/get', p),
  /** 粉丝趋势（需登录只读） */
  getFansTrend: (p: Record<string, any> = {}) => call('/fanscenter/trend/list', p),
  //#endregion

  //#region 5.2 数字专辑（4）
  /** 数字专辑详情（待核，需有效 id）：id ← digitalAlbum_purchased / 页面输入，手动触发 */
  getDigitalAlbumDetail: (p: Record<string, any> = {}) => call('/digitalAlbum/detail', p),
  /** 数字专辑销量（待核，需有效 id）：id ← digitalAlbum_purchased / 页面输入，手动触发 */
  getDigitalAlbumSales: (p: Record<string, any> = {}) => call('/digitalAlbum/sales', p),
  /** 数字专辑下单（写操作）：需登录 + 二次确认 */
  orderDigitalAlbum: (p: Record<string, any> = {}) => call('/digitalAlbum/ordering', p),
  /** 已购数字专辑（需登录只读，提供 albumId 供 detail/sales/ordering 带参） */
  getDigitalAlbumPurchased: (p: Record<string, any> = {}) => call('/digitalAlbum/purchased', p),
  //#endregion
};

export default fanscenterDigitalalbumService;
