import { IResTemplate } from '@/apis/common/index.api';

/**
 * 获取地址参数项
 * @param key 参数名
 * @returns 参数名对应的值
 */
export function FGetQueryParam(key: string): string | undefined {
  const reg = new RegExp(`(^|&)${key}=([^&]*)(&|$)`, 'i');
  const match = window.location.search.substring(1).match(reg) ?? '';
  if (match.length > 2) {
    return decodeURIComponent(match[2]);
  }
  return undefined;
}

// 存入cookie
// 安全加固：补齐 SameSite（防 CSRF 携带），HTTPS 下追加 Secure。
// 注意：本项目 token 由 JS 读取（注入 Authorization 头），故无法设 HttpOnly。
export function FSetCookie(key: string, value?: string): void {
  if (!key) {
    return;
  }

  // 仅在生产 HTTPS 环境追加 Secure，避免本地 http 开发态写不进 cookie
  const secure = window.location.protocol === 'https:' ? ';Secure' : '';
  document.cookie = `${key.toLowerCase()}=${encodeURIComponent(value ?? '')};path=/;SameSite=Lax${secure}`;
}

// 取cookie
export function FGetCookie(key: string): string | undefined {
  const reg = new RegExp(`(^| )${key}=([^;]*)(;|$)`, 'i');
  const match = document.cookie.match(reg) ?? '';
  if (match.length > 2) {
    return decodeURIComponent(match[2]);
  }
  return undefined;
}

/**
 * 响应处理
 * @param res 响应体
 * @returns 返回数据
 * @throws 异常信息
 */
export function FResHandler<T = void>(res: IResTemplate<T>): T {
  if (res?.success) {
    return res.data;
  }

  throw res?.message ?? '未知原因';
}
