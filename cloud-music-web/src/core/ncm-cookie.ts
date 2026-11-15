/**
 * 上游会话凭证（NeteaseCloudMusicApi 的 MUSIC_U / __csrf 等）。
 *
 * 与本地 `cloud-token`（用户资料 JSON，仅用于前端展示 + Authorization 头）不是一回事：
 * 上游真正判断「是否登录」看的是这份 cookie，它决定了 /login/status 返回 profile、
 * /song/url 返回完整音源还是 30 秒试听片段。
 *
 * 二维码登录 803 才会在响应 body.cookie 里一次性返回完整凭证串。服务端虽也会下发
 * Set-Cookie，但经 Vite 代理 + HttpOnly + 缓存中间件后不一定可靠落盘，故显式保存，
 * 并由 request.ts 随每个请求以 cookie 参数回传（与上游 public/qrlogin.html 的做法一致）。
 */
const STORAGE_KEY = 'cloud-ncm-cookie';

/** Set-Cookie 的属性名，不是真正的 cookie 键值，必须剔除 */
const ATTR_KEYS = new Set([
  'max-age',
  'expires',
  'path',
  'domain',
  'samesite',
  'secure',
  'httponly',
  'priority',
]);

/** 把 803 返回的原始 cookie 串清洗成 "k=v; k2=v2"，去掉 Max-Age/Path/HTTPOnly 等属性 */
export const normalizeNcmCookie = (raw: string): string => {
  if (!raw) {
    return '';
  }
  const pairs: string[] = [];
  for (const part of raw.split(';')) {
    const text = part.trim();
    const eq = text.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = text.slice(0, eq).trim();
    const value = text.slice(eq + 1).trim();
    if (!key || !value || ATTR_KEYS.has(key.toLowerCase())) {
      continue;
    }
    pairs.push(`${key}=${value}`);
  }
  // 注意：不要加空格。axios 会把空格序列化成 "+"，而服务端用 decodeURIComponent
  // 解码不会把 "+" 还原成空格，会让下一组 cookie 的键名带上 "+"（如 "+__csrf"）。
  return pairs.join(';');
};

export const getNcmCookie = (): string => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
};

export const setNcmCookie = (raw: string): void => {
  try {
    const value = normalizeNcmCookie(raw);
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
    // localStorage 不可用（隐私模式等）：静默降级为服务端 Set-Cookie
  }
};

/**
 * 合并新下发的凭证：login_refresh / 扫码成功可能只回传部分 cookie，
 * 整体覆盖会把 MUSIC_U 等丢掉，故同名覆盖、其余保留。
 */
export const mergeNcmCookie = (raw: string): void => {
  const incoming = normalizeNcmCookie(raw);
  if (!incoming) {
    return;
  }
  const merged = new Map<string, string>();
  for (const pair of getNcmCookie().split(';')) {
    const eq = pair.indexOf('=');
    if (eq > 0) {
      merged.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
  for (const pair of incoming.split(';')) {
    const eq = pair.indexOf('=');
    if (eq > 0) {
      merged.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
  // 复用 normalizeNcmCookie 保证输出仍是「无空格分号」格式
  setNcmCookie(
    Array.from(merged, ([key, value]) => `${key}=${value}`).join(';'),
  );
};

export const clearNcmCookie = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
};
