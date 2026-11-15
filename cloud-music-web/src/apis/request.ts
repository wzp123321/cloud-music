import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';
import serviceConfig from '@/config/request';
import { getCookie, TOKEN_KEY } from '@/core/token';
import { getNcmCookie } from '@/core/ncm-cookie';
import message from '@/utils/message';

// 统一 axios 单例：全项目共用，拦截器集中管理（token 注入 / 错误归一）
const instance: AxiosInstance = axios.create({
  baseURL: serviceConfig.BASE_URL,
  timeout: serviceConfig.TIME_OUT,
});

// 请求拦截：自动注入 cookie 中的登录凭证
instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getCookie(TOKEN_KEY);
  if (token) {
    config.headers.set('Authorization', token);
  }
  return config;
});

// 响应拦截：统一错误归一，业务层只需关心 resolve 数据 / catch 统一错误
instance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // 全局兜底：service 层静默降级的路径也能得到反馈（消除「点了没反应」）。
    // 业务层 catch 会再弹更具体的文案；message.show() 先 close 上一条，用户只会看到最后一条，不堆叠。
    message.error('请求失败，请稍后重试');
    return Promise.reject(error);
  },
);

// 请求超时辅助函数：超时必须 reject，否则调用方会把超时当正常数据 resolve。
// 返回 cancel 供 race 结束后清掉定时器，避免每个请求都悬挂一个到点才释放的 timer。
const timeoutfn = (delay: number, url: string) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const promise = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`请求超时--${url}`)), delay);
  });
  return { promise, cancel: () => clearTimeout(timer) };
};

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

// 上游返回的展示文案带第三方品牌名（榜单「网易云古典榜」、电台「网易每日轻松一刻」等）。
// 统一在响应出口清洗字符串值，避免每个页面各自处理；字段名、URL、Blob 响应不受影响。
const BRAND_TEXT_RULES: Array<[RegExp, string]> = [
  [/网易云音乐/g, '音乐'],
  [/网易出品/g, '独家出品'],
  [/网易云?/g, ''],
];

const stripBrandText = <T>(value: T): T => {
  if (typeof value === 'string') {
    const text = value as unknown as string;
    return BRAND_TEXT_RULES.reduce(
      (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
      text,
    ) as unknown as T;
  }
  if (Array.isArray(value)) {
    const list = value as unknown as unknown[];
    for (let i = 0; i < list.length; i += 1) {
      list[i] = stripBrandText(list[i]);
    }
    return value;
  }
  if (value && typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      const record = value as unknown as Record<string, unknown>;
      for (const key of Object.keys(record)) {
        // cookie 是会话凭证（803 / login_refresh 的 body.cookie），不能被品牌文案清洗改写
        if (key === 'cookie') {
          continue;
        }
        record[key] = stripBrandText(record[key]);
      }
    }
  }
  return value;
};

/**
 * 合并上游会话凭证：登录后所有接口都要带 cookie，否则上游仍按游客处理，
 * /login/status 拿不到 profile、/song/url 只给 30 秒试听片段。
 * 仅登录成功（803）后才会有值，未登录时不改动原请求参数。
 */
const withNcmCookie = (url: string, param: unknown, isForm: boolean): unknown => {
  const cookie = getNcmCookie();
  // 二维码生成/轮询必须保持匿名，带旧凭证会干扰上游。
  // 其余接口（含 login/refresh、login/status、song/url）都带凭证：
  // refresh 成功后 UserService 会把下游发回的新凭证写回本地，不会出现旧值覆盖新值。
  if (!cookie || url.includes('/login/qr/')) {
    return param;
  }
  if (isForm) {
    (param as FormData).append('cookie', cookie);
    return param;
  }
  if (param && typeof param === 'object') {
    return { ...(param as Record<string, unknown>), cookie };
  }
  return { cookie };
};

// 底层请求：处理 FormData / JSON 的 Content-Type，并合并外部 options
const publicReq = async (params: IRequestParams) => {
  const { url, method, param, options } = params;
  const isForm = typeof FormData !== 'undefined' && param instanceof FormData;
  const payload = withNcmCookie(url, param, isForm);
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
    [method === 'post' ? 'data' : 'params']: payload,
  }).then((res: AxiosResponse) => stripBrandText(res ? res.data : undefined));
};

// 单个请求（带超时 race）
export const req = async (params: IRequestParams, delay = serviceConfig.TIME_OUT) => {
  const timeout = timeoutfn(delay, params.url);
  try {
    return await Promise.race([timeout.promise, publicReq(params)]);
  } catch (error) {
    return Promise.reject(error);
  } finally {
    timeout.cancel();
  }
};

// GET request
// 泛型默认 any 是 API 边界的逃生口：未显式传泛型的旧调用保持原有宽松行为，
// 新代码应写成 getRequest<XxxRes>(...)，返回类型由 apis/*.api.ts 收口。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getRequest = async <T = any>(url: string, param?: unknown): Promise<T> =>
  (await req({ url, method: 'get', param })) as T;

// POST form request (multipart/form-data，用于文件上传场景如歌单封面)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const postFormRequest = async <T = any>(url: string, formData: FormData): Promise<T> =>
  (await req({ url, method: 'post', param: formData })) as T;

// POST request
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const postRequest = async <T = any>(
  url: string,
  param?: unknown,
  options?: IRequestOptions,
): Promise<T> => (await req({ url, method: 'post', param, options })) as T;

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
