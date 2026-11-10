import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { FGetCookie, FSetCookie } from '@/core/token';
import { postRequest } from '@/apis/request';
import UserService from '@/apis/user.service';
import { HL_ILoginUserVO } from '@/views/header/header-loginform/header-loginform.api';

type UserProfile = NonNullable<HL_ILoginUserVO['profile']>;

const TOKEN_KEY = 'cloud-token';
const INFO_KEY = 'cloud-userInfo';

/** 读取旧版本缓存在 cookie 里的用户资料 */
const readCachedProfile = (): UserProfile | null => {
  const raw = FGetCookie(INFO_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return (parsed?.profile ?? null) as UserProfile | null;
  } catch {
    return null;
  }
};

/** 登录态：cookie 仍沿用旧 key，状态本身不做 pinia 持久化 */
export const useUserStore = defineStore('user', () => {
  const token = ref(FGetCookie(TOKEN_KEY) ?? '');
  const profile = ref<UserProfile | null>(readCachedProfile());
  const isLogin = computed(() => Boolean(token.value));

  /** 登录成功：写 cookie（沿用旧 key）+ 更新响应式状态 */
  const setLogin = (userProfile: UserProfile) => {
    token.value = JSON.stringify(userProfile);
    profile.value = userProfile;
    FSetCookie(TOKEN_KEY, JSON.stringify(userProfile));
    FSetCookie(INFO_KEY, JSON.stringify({ profile: userProfile }));
  };

  /** 退出登录：调用后端并清空本地态 */
  const logout = async () => {
    const res = await postRequest('/logout');
    token.value = '';
    profile.value = null;
    FSetCookie(TOKEN_KEY, '');
    FSetCookie(INFO_KEY, '');
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
        FSetCookie(INFO_KEY, JSON.stringify({ profile: latest }));
      }
      return latest;
    } catch {
      // 会话失效时保持本地缓存，不阻断页面
      return null;
    }
  };

  return { token, profile, isLogin, setLogin, logout, fetchProfile, restoreSession };
});
