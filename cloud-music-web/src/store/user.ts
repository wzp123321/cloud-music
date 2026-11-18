import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getCookie, setCookie, tokenKey } from '@/core/token';
import { sessionManager } from '@/core/session';
import { postRequest } from '@/apis/request';
import UserService from '@/apis/user/user.service';
import { HL_LoginUserVO } from '@/apis/header-loginform/index.api';

type UserProfile = NonNullable<HL_LoginUserVO['profile']>;

/** 安全解析凭证串为 profile；解析失败回落 null，不影响登录态判定 */
const parseProfileFromToken = (token: string): UserProfile | null => {
  if (!token) {
    return null;
  }
  try {
    return JSON.parse(token) as UserProfile;
  } catch {
    return null;
  }
};

/** 登录态：首屏以凭证 cookie 为准，真实会话由 core/session 持久化的后端 cookie 维持 */
export const useUserStore = defineStore('user', () => {
  // token = 原始会话凭证（profile JSON 字符串）；profile = 其解析结果，二者分离存储职责
  const token = ref(getCookie(tokenKey) ?? '');
  const profile = ref<UserProfile | null>(parseProfileFromToken(token.value));
  const isLogin = computed(() => Boolean(token.value));

  /**
   * 登录成功：持久化后端会话凭证 + 写首屏快照 cookie + 更新响应式状态
   * @param userProfile 用户资料
   * @param sessionCookie 登录接口响应体里的 cookie 串（MUSIC_U 等），缺省时沿用已有凭证
   */
  const setLogin = (userProfile: UserProfile, sessionCookie?: string) => {
    if (sessionCookie) {
      sessionManager.establish(sessionCookie);
    }
    token.value = JSON.stringify(userProfile);
    profile.value = userProfile;
    setCookie(tokenKey, token.value);
  };

  /** 退出登录：调用后端并清空本地态 */
  const logout = async () => {
    // /logout 需要携带上游凭证才能真正在服务端失效，所以先请求、再清本地
    const res = await postRequest('/logout');
    sessionManager.revoke();
    token.value = '';
    profile.value = null;
    setCookie(tokenKey, '');
    return res;
  };

  /**
   * 查询最新登录态。后端在凭证失效时以游客身份响应且不带 401，
   * 因此在明确的 login_status 语义上兜一次：仍为游客则吊销凭证，避免「显示已登录、数据为空」。
   */
  const fetchProfile = async () => {
    const status = await UserService.loginStatus();
    const account = status?.data?.account as { anonimousUser?: boolean } | undefined;
    if (account?.anonimousUser === true && sessionManager.isAlive()) {
      const renewed = await sessionManager.renew();
      if (!renewed) {
        sessionManager.revoke();
        token.value = '';
        profile.value = null;
        setCookie(tokenKey, '');
        return null;
      }
      const retried = await UserService.loginStatus();
      return retried?.code === 200 ? (retried?.data?.profile ?? null) : null;
    }
    return status?.code === 200 ? (status?.data?.profile ?? null) : null;
  };

  /**
   * 启动时恢复会话：renew（login_refresh）→ login_status。
   * 拿到 profile 后走 setLogin 回写快照，覆盖「关浏览器后 cloud-token 已失效」的场景。
   */
  const restoreSession = async () => {
    try {
      await sessionManager.renew();
      const latest = await fetchProfile();
      if (latest) {
        // login_status 的字段声明比本地资料类型窄，运行时按可选字段读取，故显式放宽
        setLogin(latest as unknown as UserProfile);
        return latest;
      }
      return null;
    } catch {
      // 会话失效时保持本地缓存，不阻断页面
      return null;
    }
  };

  return { token, profile, isLogin, setLogin, logout, fetchProfile, restoreSession };
});
