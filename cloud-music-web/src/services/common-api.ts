export interface CodeNameKV<T> {
  code: T;
  name: string;
}

export interface IdNameKV<T> {
  id: T;
  name: string;
}

/**
 *  接口返参
 */
export interface ResTemplate<T> {
  code: number;
  message: string;
  success: boolean;
  data: T;
}
/**
 * 列表接口响应
 */
export interface HttpListResponsive<T> {
  list: T;
  pageNum: number;
  pageSize: number;
  pages: number;
  total: number;
}
