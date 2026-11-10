import { Common_IMusic } from '@/apis/common-api/common-api';

/** 播放模式（值同时作为 UI 标题） */
export enum PLAY_TYPE {
  LOOP = '循环播放',
  SINGLE = '单曲循环',
  RANDOM = '随机播放',
}

/** 播放模式 → 图标类名；Object.keys 的顺序即切换顺序 */
export const PLAY_TYPES: Record<string, string> = {
  [PLAY_TYPE.LOOP]: 'icon-xunhuanbofang',
  [PLAY_TYPE.SINGLE]: 'icon-24gl-repeatOnce2',
  [PLAY_TYPE.RANDOM]: 'icon-24gl-shuffle',
};

export const PLAY_TYPE_KEYS: string[] = Object.keys(PLAY_TYPES);

/** 一行歌词 */
export interface LyricLine {
  time: number;
  lyc: string;
}

/** 空歌曲占位，避免模板读取 undefined */
export const EMPTY_MUSIC: Common_IMusic = {
  name: '',
  artist: '',
  url: '',
  alName: '',
  dt: 0,
  picUrl: '',
  id: 0,
};
