import { storeToRefs } from 'pinia';
import { useLyricStore } from '@/stores/lyric';

/** 歌词统一入口：包装 lyric store */
export const useLyric = () => {
  const lyric = useLyricStore();
  const { lrcList, lrcPanel, showLyc } = storeToRefs(lyric);

  return {
    lyric,
    lrcList,
    lrcPanel,
    showLyc,
    parse: lyric.parse,
    reset: lyric.reset,
    syncPanel: lyric.syncPanel,
  };
};
