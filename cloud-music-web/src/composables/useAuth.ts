import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/user';

/** 登录态统一入口：包装 user store，供页面与组件读取 */
export const useAuth = () => {
  const user = useUserStore();
  const { token, profile, isLogin } = storeToRefs(user);

  return {
    user,
    token,
    profile,
    isLogin,
    login: user.setLogin,
    logout: user.logout,
    fetchProfile: user.fetchProfile,
    restoreSession: user.restoreSession,
  };
};
