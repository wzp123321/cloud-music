import { ref, type Ref } from 'vue';

/**
 * 统一封装异步请求：对外暴露 loading / error / data 与 run。
 * 请求层统一走 src/services/request.ts，本 composable 只负责状态。
 */
export const useRequest = <T>(request: (...args: any[]) => Promise<T>) => {
  const loading = ref<boolean>(false);
  const error = ref<unknown>(null);
  const data = ref<T | null>(null) as Ref<T | null>;

  /** 执行一次请求；异常被收敛到 error，不向外抛出 */
  const run = async (...args: any[]): Promise<T | null> => {
    loading.value = true;
    error.value = null;
    try {
      const result = await request(...args);
      data.value = result;
      return result;
    } catch (err) {
      error.value = err;
      return null;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, data, run };
};
