/**
 * apis 层通用类型 —— 单一事实来源
 *
 * 依据网易云 API 上游实测返回结构定义：上游不同接口的包裹层不一致
 * （有的返回 { code, data }，有的直接返回裸数据），且字段常缺失，
 * 故统一以「可选字段 + 宽松泛型」表达，避免渲染期因缺字段报错。
 */

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
