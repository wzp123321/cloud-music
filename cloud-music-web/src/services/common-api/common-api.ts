export interface ICodeName<T> {
  code: T;
  name: string;
}

export interface IIdName<T> {
  id: T;
  name: string;
}

/**
 *  接口返参
 */
export interface IResTemplate<T> {
  code: number;
  message: string;
  success: boolean;
  data: T;
}
/**
 * 列表接口响应
 */
export interface IHttpListResponsive<T> {
  list: T;
  pageNum: number;
  pageSize: number;
  pages: number;
  total: number;
}

/**
 * @param id
 * @param name 歌曲名称
 * @param picUrl 封面
 * @param alName 专辑名称
 * @param duration 时长
 */
export interface Common_IMusic {
  dt: number;
  url: string;
  name: string;
  alName: string;
  artist: string;
  picUrl: string;
  id: number;
}

/**
 * 专辑
 */
export interface Common_IAblumVO {
  title: string;
  publicTime: number;
  artist: string;

  coverImageUrl: string;
  id: number;
}
