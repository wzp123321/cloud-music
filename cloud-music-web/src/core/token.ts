/**
 * 首屏登录快照的 cookie key（全项目唯一来源）。
 *
 * 职责已收窄：仅供首屏乐观渲染（刷新时先出用户信息，不等接口）。
 * 真实会话凭证是后端下发的 MUSIC_U 等 cookie，由 core/session 持久化、request.ts 逐请求回传，
 * 不复用本 cookie —— profile 快照既不能用于鉴权，又有 4KB 上限会静默写失败。
 */
export const tokenKey = 'cloud-token';

/**
 * 获取地址参数项
 * @param key 参数名
 * @returns 参数名对应的值
 */
export const getQueryParam = (key: string): string | undefined => {
  const reg = new RegExp(`(^|&)${key}=([^&]*)(&|$)`, 'i');
  const match = window.location.search.substring(1).match(reg) ?? '';
  if (match.length > 2) {
    return decodeURIComponent(match[2]);
  }
  return undefined;
}

/** 凭证 cookie 有效期（秒）：30 天。不设则为会话 cookie，关浏览器即丢 */
const cookieMaxAge = 60 * 60 * 24 * 30;

// 存入cookie
// 安全加固：补齐 SameSite（防 CSRF 携带），HTTPS 下追加 Secure。
// 注意：本 cookie 由 JS 读取（首屏渲染 profile 快照），故无法设 HttpOnly。
export const setCookie = (key: string, value?: string): void => {
  if (!key) {
    return;
  }

  // 仅在生产 HTTPS 环境追加 Secure，避免本地 http 开发态写不进 cookie
  const secure = window.location.protocol === 'https:' ? ';Secure' : '';
  // 空值视为删除：写 max-age=0，避免留下一条长期有效的空凭证
  const maxAge = value ? cookieMaxAge : 0;
  document.cookie = `${key.toLowerCase()}=${encodeURIComponent(value ?? '')};path=/;max-age=${maxAge};SameSite=Lax${secure}`;
}

// 取cookie
export const getCookie = (key: string): string | undefined => {
  const reg = new RegExp(`(^| )${key}=([^;]*)(;|$)`, 'i');
  const match = document.cookie.match(reg) ?? '';
  if (match.length > 2) {
    return decodeURIComponent(match[2]);
  }
  return undefined;
}

