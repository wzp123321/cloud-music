/**
 * 后端会话凭证（MUSIC_U / MUSIC_A / __csrf 等）的本地持久化。
 *
 * 背景：本项目后端为 NeteaseCloudMusicApi，鉴权完全依赖上游 cookie，没有独立 token。
 * 浏览器 cookie 会被清理策略、隐私模式或跨域场景抹掉，一旦丢失后端会静默降级为游客态
 * （util/request.js 在无 MUSIC_U 时注入全局 anonymous_token），前端却无从感知。
 *
 * 因此把后端下发的 cookie 串自持一份，之后每个请求通过 `cookie` 参数显式回传：
 * server.js 中 `query.cookie` 会覆盖 `req.cookies`，显式传参优先级更高，行为确定。
 * 与浏览器 cookie 并存不冲突——后端只取优先级最高的那一份。
 */

const sessionKey = 'cloud-session';

/**
 * 规范化 cookie 串：去掉各段前后空白与空段。
 * 后端 `cookieToJson` 按 `;` 切分且不 trim key，`a=1; b=2` 会切出 `" b"` 这个无效键名。
 */
const normalizeCookie = (raw: string): string =>
  raw
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item.includes('='))
    .join(';');

/** 游客态也可能持有 MUSIC_A / __csrf，只有 MUSIC_U 才代表真实登录 */
const hasLoginCookie = (raw: string): boolean => /(?:^|;)MUSIC_U=/.test(raw);

/**
 * 会话凭证的唯一所有者。
 * 内存是读取真源，localStorage 只在状态变更时写盘；请求层不得逐次读存储。
 */
class SessionManager {
  private current: string;

  public constructor() {
    this.current = this.readStorage();
    if (typeof window !== 'undefined') {
      // 多标签页同步：另一个标签页建立/吊销会话时刷新本页内存值
      window.addEventListener('storage', (event) => {
        if (event.key === sessionKey) {
          this.current = this.readStorage();
        }
      });
    }
  }

  /** 仅模块初始化与 storage 事件调用 */
  private readStorage(): string {
    try {
      return localStorage.getItem(sessionKey) ?? '';
    } catch {
      // 隐私模式 / 存储被禁用时降级为「仅依赖浏览器 cookie」
      return '';
    }
  }

  /** 唯一写盘点：同步内存与存储，空值等同于清除 */
  private writeStorage(raw?: string): void {
    const value = raw ? normalizeCookie(raw) : '';
    this.current = value;
    try {
      if (value) {
        localStorage.setItem(sessionKey, value);
      } else {
        localStorage.removeItem(sessionKey);
      }
    } catch {
      // 存储不可用时不阻断登录流程，内存值仍然更新
    }
  }

  /** 登录成功后建立会话 */
  public establish(rawCookie: string): void {
    this.writeStorage(rawCookie);
  }

  /**
   * 续期：有入参直接替换（登录响应已带回新 cookie 时使用）；
   * 无入参则调用 login_refresh 取回新凭证。动态 import 避免 core → apis → request → core 循环依赖。
   */
  public async renew(rawCookie?: string): Promise<boolean> {
    if (rawCookie !== undefined) {
      this.writeStorage(rawCookie);
      return this.isAlive();
    }
    try {
      const { default: UserService } = await import('@/apis/user/user.service');
      const res = await UserService.loginRefresh();
      const raw = res?.cookie;
      const value = Array.isArray(raw) ? raw.join(';') : typeof raw === 'string' ? raw : '';
      if (!value) {
        return false;
      }
      this.writeStorage(value);
      return this.isAlive();
    } catch {
      return false;
    }
  }

  /** 吊销：清内存与存储 */
  public revoke(): void {
    this.writeStorage('');
  }

  /** 供请求层注入的当前凭证 */
  public snapshot(): string {
    return this.current;
  }

  /** 是否持有真实登录凭证（游客态的 MUSIC_A 不算） */
  public isAlive(): boolean {
    return hasLoginCookie(this.current);
  }
}

export const sessionManager = new SessionManager();

/** 仅供测试重置单例状态；生产构建中该分支被静态消除 */
if (import.meta.env.DEV) {
  (sessionManager as SessionManager & { resetForTest?: () => void }).resetForTest = () =>
    sessionManager.revoke();
}
