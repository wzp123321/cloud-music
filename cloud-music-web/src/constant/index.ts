import { Common_IMusic } from '@/apis/common/index.api';

/** 播放模式（值同时作为 UI 标题） */
export enum PlayType {
  LOOP = '循环播放',
  SINGLE = '单曲循环',
  RANDOM = '随机播放',
}

/** 播放模式 → 图标类名；Object.keys 的顺序即切换顺序 */
export const playTypes: Record<string, string> = {
  [PlayType.LOOP]: 'icon-xunhuanbofang',
  [PlayType.SINGLE]: 'icon-24gl-repeatOnce2',
  [PlayType.RANDOM]: 'icon-24gl-shuffle',
};

export const playTypeKeys: string[] = Object.keys(playTypes);

/** 一行歌词 */
export interface LyricLine {
  time: number;
  lyc: string;
}

/** 空歌曲占位，避免模板读取 undefined */
export const emptyMusic: Common_IMusic = {
  name: '',
  artist: '',
  url: '',
  alName: '',
  dt: 0,
  picUrl: '',
  id: 0,
};
