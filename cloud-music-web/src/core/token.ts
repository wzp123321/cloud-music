/**
 * 会话凭证 cookie key（全项目唯一来源）。
 * 重要约束：本项目后端以「用户资料 JSON」作为 Authorization 凭证（见 request.ts 拦截器），
 * 并未下发独立的 token，故 cookie 中存的就是 profile 本身，无法设 HttpOnly。
 * 真正的「token ≠ profile」线级分离需后端配合下发真实 token，前端盲改会断登录。
 */
export const TOKEN_KEY = 'cloud-token';

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

// 存入cookie
// 安全加固：补齐 SameSite（防 CSRF 携带），HTTPS 下追加 Secure。
// 注意：本项目 token 由 JS 读取（注入 Authorization 头），故无法设 HttpOnly。
export const setCookie = (key: string, value?: string): void => {
  if (!key) {
    return;
  }

  // 仅在生产 HTTPS 环境追加 Secure，避免本地 http 开发态写不进 cookie
  const secure = window.location.protocol === 'https:' ? ';Secure' : '';
  document.cookie = `${key.toLowerCase()}=${encodeURIComponent(value ?? '')};path=/;SameSite=Lax${secure}`;
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

