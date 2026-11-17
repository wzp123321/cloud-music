import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
} from 'axios';
import serviceConfig from '@/config/request';
import { sessionManager } from '@/core/session';
import message from '@/utils/message';

// 统一 axios 单例：全项目共用，拦截器只做错误归一；会话凭证在请求组装阶段显式注入
const instance: AxiosInstance = axios.create({
  baseURL: serviceConfig.baseUrl,
  timeout: serviceConfig.timeout,
});

/**
 * 显式组合会话凭证。调用点即确定 payload 形态，不依赖运行时猜测。
 *
 * 不用 Authorization 的原因：后端 NeteaseCloudMusicApi 只认 MUSIC_U 这类上游 cookie，
 * 根本不读 Authorization 头。旧实现塞的是整个 profile JSON，既无效，又因含中文字符
 * 有触发非法请求头的风险。
 *
 * 后端侧 server.js 用 `Object.assign({}, { cookie: req.cookies }, req.query, req.body, ...)`
 * 组装参数，显式传入的 `cookie` 会覆盖浏览器 cookie，因此这里是「凭证自持」而非「双写」。
 */
const withSession = (payload?: unknown): unknown => {
  const session = sessionManager.snapshot();
  if (!session) {
    return payload;
  }
  if (payload === undefined || payload === null) {
    // 无 body 的 POST（如 /login/refresh、/logout）也必须带上凭证
    return { cookie: session };
  }
  if (typeof FormData !== 'undefined' && payload instanceof FormData) {
    // multipart：追加字段，由后端 fileUpload 解析进 req.body
    payload.append('cookie', session);
    return payload;
  }
  if (
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    !(payload instanceof ArrayBuffer) &&
    !(payload instanceof Blob) &&
    !(payload instanceof URLSearchParams)
  ) {
    return { ...(payload as Record<string, unknown>), cookie: session };
  }
  // 已序列化的字符串 body 等不注入，避免破坏调用方既定的报文格式
  return payload;
};

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
  const payload = withSession(param);
  return instance({
    url,
    method,
    ...options,
    headers,
    [method === 'post' ? 'data' : 'params']: payload,
  }).then((res: AxiosResponse) => (res ? res.data : undefined));
};

// 单个请求（带超时 race）
export const req = async (params: IRequestParams, delay = serviceConfig.timeout) => {
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

// 文件流下载：显式注入凭证，返回完整响应以读取 headers
export const getBlobResponse = (
  url: string,
  data?: unknown,
): Promise<AxiosResponse> =>
  instance({
    url,
    method: 'post',
    data: withSession(data),
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
