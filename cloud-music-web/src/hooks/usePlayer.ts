import { storeToRefs } from 'pinia';
import { usePlayerStore } from '@/store/player';
import { usePlaylistStore } from '@/store/playlist';

/** 播放器统一入口：包装 player / playlist 两个 store，页面不必直接感知 store 细节 */
export const usePlayer = () => {
  const player = usePlayerStore();
  const playlist = usePlaylistStore();
  const { currentMusic, isPlaying, progress, volume, playTimestamp } = storeToRefs(player);
  const { musicList } = storeToRefs(playlist);

  return {
    player,
    playlist,
    currentMusic,
    isPlaying,
    progress,
    volume,
    playTimestamp,
    musicList,
  };
};
