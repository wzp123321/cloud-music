import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { FGetCookie, FSetCookie } from '@/core/token';
import { postRequest } from '@/apis/request';
import UserService from '@/apis/user/user.service';
import { HL_ILoginUserVO } from '@/apis/header-loginform/index.api';

type UserProfile = NonNullable<HL_ILoginUserVO['profile']>;

/**
 * 会话凭证 key。
 * 重要约束：本项目后端以「用户资料 JSON」作为 Authorization 凭证（见 request.ts 拦截器），
 * 并未下发独立的 token，故 cookie 中存的就是 profile 本身，无法设 HttpOnly。
 * 真正的「token ≠ profile」线级分离需后端配合下发真实 token，前端盲改会断登录。
 * 本文件只做存储层职责分离：token 承载原始凭证串，profile 由其解析，不再单独缓存一份资料 cookie。
 */
const TOKEN_KEY = 'cloud-token';

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

/** 登录态：cookie 沿用旧 key，状态本身不做 pinia 持久化 */
export const useUserStore = defineStore('user', () => {
  // token = 原始会话凭证（profile JSON 字符串）；profile = 其解析结果，二者分离存储职责
  const token = ref(FGetCookie(TOKEN_KEY) ?? '');
  const profile = ref<UserProfile | null>(parseProfileFromToken(token.value));
  const isLogin = computed(() => Boolean(token.value));

  /** 登录成功：仅写凭证 cookie（沿用旧 key）+ 更新响应式状态 */
  const setLogin = (userProfile: UserProfile) => {
    token.value = JSON.stringify(userProfile);
    profile.value = userProfile;
    FSetCookie(TOKEN_KEY, token.value);
  };

  /** 退出登录：调用后端并清空本地态 */
  const logout = async () => {
    const res = await postRequest('/logout');
    token.value = '';
    profile.value = null;
    FSetCookie(TOKEN_KEY, '');
    return res;
  };

  /** 查询最新登录态 */
  const fetchProfile = async () => {
    const status = await UserService.loginStatus();
    return status?.code === 200 ? status?.data?.profile ?? null : null;
  };

  /** 启动时刷新会话：login_refresh → login_status，失败时保留本地缓存 */
  const restoreSession = async () => {
    try {
      await UserService.loginRefresh();
      const latest = await fetchProfile();
      if (latest) {
        // login_status 的字段声明比本地资料类型窄，运行时按可选字段读取，故显式放宽
        profile.value = latest as unknown as UserProfile;
      }
      return latest;
    } catch {
      // 会话失效时保持本地缓存，不阻断页面
      return null;
    }
  };

  return { token, profile, isLogin, setLogin, logout, fetchProfile, restoreSession };
});
