export interface ICodeName<T> {
  code: T;
  name: string;
}

// 通用响应类型统一收敛到 apis/types.ts，此处 re-export 以兼容既有引用
export type { IResTemplate, IHttpListResponsive } from '../types';

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
export interface Common_IAlbumVO {
  title: string;
  publicTime: number;
  artist: string;

  coverImageUrl: string;
  id: number;
}
