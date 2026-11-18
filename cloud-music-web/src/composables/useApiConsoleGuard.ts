import type { Ref } from 'vue';

/**
 * 接口调用台共享的登录降级与写操作确认前置校验。
 * 文案必须与既有实现逐字一致，统一在此维护，避免多处复制后各自漂移。
 */
export const useApiConsoleGuard = (hasLogin: Ref<boolean>, toast: Ref<string>) => {
  const requireLogin = (): boolean => {
    if (!hasLogin.value) {
      toast.value = '该接口需要登录后才能查看（已降级，不发请求）';
      return false;
    }
    return true;
  };

  const writeGuard = (confirmText: string): boolean => {
    if (!hasLogin.value) {
      toast.value = '请先登录后再执行该写操作（已降级，不发请求）';
      return false;
    }
    if (!window.confirm(confirmText)) {
      toast.value = '已取消操作';
      return false;
    }
    return true;
  };

  return { requireLogin, writeGuard };
};
