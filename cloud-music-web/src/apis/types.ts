/**
 * apis 层通用类型 —— 单一事实来源
 *
 * 依据上游 API 实测返回结构定义：上游不同接口的包裹层不一致
 * （有的返回 { code, data }，有的直接返回裸数据），且字段常缺失，
 * 故统一以「可选字段 + 宽松泛型」表达，避免渲染期因缺字段报错。
 */

/**
 * 上游原始响应边界类型。
 *
 * 网易云 API 各接口返回结构不统一（{ code, data } / 裸数据 / 字段常缺），
 * 且在 API 调试台场景下需原样透传给 normalize 层做动态抽取。
 * 这里作为全项目唯一的 any 收口点：业务代码拿到后应尽快用
 * extractObject / unwrapData / as XxxVO 收窄为具体类型，不要在下游继续透传 any。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiRawResponse = any;

/** 标准响应包裹（四个字段齐全的场景） */
export interface IResTemplate<T> {
  code: number;
  message: string;
  success: boolean;
  data: T;
}

/**
 * 宽松响应包裹：上游部分接口缺 code / success / data，
 * 作为 API 函数返回类型的通用外壳使用。
 */
export interface ApiEnvelope<T = unknown> {
  code?: number;
  message?: string;
  success?: boolean;
  data?: T;
}

/** 列表接口响应（分页） */
export interface IHttpListResponsive<T> {
  list: T;
  pageNum: number;
  pageSize: number;
  pages: number;
  total: number;
}
