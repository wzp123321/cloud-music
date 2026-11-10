import { getRequest, postFormRequest } from '@/services/request';

/**
 * P2 6.x「云盘」接口封装（共 2 个）。
 *
 * URL 规则：module 文件名下划线转斜杠；完整清单见 api-inventory-plain.md，禁止凭记忆猜 URL。
 * 统一约定：
 * - 每个请求 try/catch，失败返回空对象 {}；
 * - 返回体保持原始结构，由页面 normalize() 兼容 res.data / res.result / res.xxx；
 * - cloud 为上传写操作，必须用 postFormRequest(url, FormData)；是否发出请求由页面根据
 *   hasLogin() + window.confirm 控制，service 不自动触发；
 * - cloud_match 需登录只读（/cloud/match 实测 301），返回匹配结果并提供 songId 给 cloud 带参。
 */
async function call(url: string, params: Record<string, any> = {}): Promise<any> {
  try {
    const res = await getRequest(url, params);
    return res ?? {};
  } catch {
    return {};
  }
}

async function callForm(url: string, formData: FormData): Promise<any> {
  try {
    const res = await postFormRequest(url, formData);
    return res ?? {};
  } catch {
    return {};
  }
}

const cloudDiskService = {
  //#region 6.1 云盘上传与匹配（2）
  /** 云盘上传（写操作，postFormRequest + FormData）：songId ← cloud_match 返回 / 页面输入；需登录 + 二次确认 */
  uploadCloud: (formData: FormData) => callForm('/cloud', formData),
  /** 本地音频匹配（需登录只读，提供 songId 给 cloud 带参） */
  matchCloud: (p: Record<string, any> = {}) => call('/cloud/match', p),
  //#endregion
};

export default cloudDiskService;
