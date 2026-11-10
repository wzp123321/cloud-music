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

// 底层请求：处理 FormData / JSON 的 Content-Type，并合并外部 options
const publicReq = async (params: { [key: string]: any }) => {
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
export const req = async (params: { [key: string]: any }, delay = serviceConfig.TIME_OUT) => {
  try {
    return await Promise.race([timeoutfn(delay, params.url), publicReq(params)]);
  } catch (error) {
    return Promise.reject(error);
  }
};

// GET request
export const getRequest = async (url: string, param?: { [key: string]: any }) => {
  try {
    return await req({ url, method: 'get', param });
  } catch (err) {
    return Promise.reject(err);
  }
};

// POST form request (multipart/form-data，用于文件上传场景如歌单封面)
export const postFormRequest = async (url: string, formData: FormData) => {
  try {
    return await req({ url, method: 'post', param: formData });
  } catch (err) {
    return Promise.reject(err);
  }
};

// POST request
export const postRequest = async (
  url: string,
  param?: { [key: string]: any } | number | string,
  options?: { [key: string]: any },
) => {
  try {
    return await req({ url, method: 'post', param, options });
  } catch (err) {
    return Promise.reject(err);
  }
};
