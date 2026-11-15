import { getRequest, postFormRequest, postRequest } from '@/apis/request';

export type RouteMethod = 'get' | 'post';

export interface CallRouteOptions {
  method?: RouteMethod;
  params?: Record<string, unknown>;
  file?: File | null;
  fileField?: string;
}

/**
 * 全量接口清单的统一调用点：任何 server 路由都可以从这里发起真实请求。
 *
 * 统一走 request.ts，因此自动获得上游会话 cookie 注入、品牌文案清洗与错误归一；
 * 具体每个接口的调用参数由接口总览页提供，避免为 439 条路由各写一个空壳方法。
 */
export const callServerRoute = (
  routePath: string,
  options: CallRouteOptions = {},
): Promise<unknown> => {
  const { method = 'post', params = {}, file = null, fileField = 'songFile' } = options;

  if (file) {
    const formData = new FormData();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    formData.append(fileField, file);
    return postFormRequest(routePath, formData);
  }

  return method === 'get'
    ? getRequest(routePath, params)
    : postRequest(routePath, params);
};
