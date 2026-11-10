import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';
import serviceConfig from '@/config/request';
import { FGetCookie } from '@/core/token';

// 统一 axios 单例：全项目共用，拦截器集中管理（token 注入 / 错误归一）
const instance: AxiosInstance = axios.create({
  baseURL: serviceConfig.BASE_URL,
  timeout: serviceConfig.TIME_OUT,
});

// 请求拦截：自动注入 cookie 中的登录态（cloud-token 存在时）
instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = FGetCookie('cloud-token');
  if (token) {
    config.headers.set('Authorization', token);
  }
  return config;
});

// 响应拦截：统一错误归一，业务层只需关心 resolve 数据 / catch 统一错误
instance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => Promise.reject(error),
);

// 请求超时辅助函数
const timeoutfn = (delay: number, url: string) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(`请求超时--${url}`), delay);
  });

/** 请求可选配置：headers 与二进制响应类型 */
export interface IRequestOptions {
  headers?: Record<string, string>;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream';
}

/** 内部请求参数（publicReq / req 使用） */
interface IRequestParams {
  url: string;
  method: 'get' | 'post';
  /** 请求体 / 查询参数 */
  param?: unknown;
  options?: IRequestOptions;
}

// 底层请求：处理 FormData / JSON 的 Content-Type，并合并外部 options
const publicReq = async (params: IRequestParams) => {
  const { url, method, param, options } = params;
  const isForm = typeof FormData !== 'undefined' && param instanceof FormData;
  // 合并外部传入的 headers；FormData 场景交由 axios 自动设置 multipart boundary
  const headers = isForm
    ? { ...(options?.headers || {}) }
    : {
        ...(options?.headers || {}),
        'Content-Type':
          Object.prototype.toString.call(param) === '[object String]'
            ? 'application/json; charset=utf-8'
            : 'application/json',
      };
  return instance({
    url,
    method,
    ...options,
    headers,
    [method === 'post' ? 'data' : 'params']: param,
  }).then((res: AxiosResponse) => (res ? res.data : undefined));
};

// 单个请求（带超时 race）
export const req = async (params: IRequestParams, delay = serviceConfig.TIME_OUT) => {
  try {
    return await Promise.race([timeoutfn(delay, params.url), publicReq(params)]);
  } catch (error) {
    return Promise.reject(error);
  }
};

// GET request
// 泛型默认 any 是 API 边界的逃生口：未显式传泛型的旧调用保持原有宽松行为，
// 新代码应写成 getRequest<XxxRes>(...)，返回类型由 apis/*.api.ts 收口。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getRequest = async <T = any>(url: string, param?: unknown): Promise<T> => {
  try {
    return (await req({ url, method: 'get', param })) as T;
  } catch (err) {
    return Promise.reject(err);
  }
};

// POST form request (multipart/form-data，用于文件上传场景如歌单封面)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const postFormRequest = async <T = any>(url: string, formData: FormData): Promise<T> => {
  try {
    return (await req({ url, method: 'post', param: formData })) as T;
  } catch (err) {
    return Promise.reject(err);
  }
};

// POST request
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const postRequest = async <T = any>(
  url: string,
  param?: unknown,
  options?: IRequestOptions,
): Promise<T> => {
  try {
    return (await req({ url, method: 'post', param, options })) as T;
  } catch (err) {
    return Promise.reject(err);
  }
};

// 文件流下载：复用统一实例（拦截器自动注入 Authorization），返回完整响应以读取 headers
export const getBlobResponse = (
  url: string,
  data?: unknown,
): Promise<AxiosResponse> =>
  instance({
    url,
    method: 'post',
    data,
    responseType: 'blob',
  });

/**
 * 统一解包上游响应：部分接口返回 { code, data }，部分直接返回裸数据。
 * 约定优先取 res.data，缺省回退 res 本身（与原 `res?.data ?? res` 完全等价）。
 */
export const unwrapData = <T>(res: unknown): T => {
  const wrapped = res as { data?: T } | null | undefined;
  return (wrapped?.data ?? res) as T;
};
