import { onMounted, onUnmounted, ref } from 'vue';

import { useLyricStore } from '@/store/lyric';
import { usePlayerStore } from '@/store/player';

/**
 * 当前歌词行的行内进度（0~1）。
 *
 * <audio> 的 timeupdate 只有约 4Hz，直接用它会看到字一跳一跳地亮；
 * 这里用 rAF 读 audio.currentTime 实时插值，逐字填充才是连续的。
 * 暂停时 audio.currentTime 不变，进度自然停住，无需额外判断。
 */
export const useLyricProgress = () => {
  const player = usePlayerStore();
  const lyric = useLyricStore();
  const progress = ref(0);
  let raf = 0;

  const tick = () => {
    const list = lyric.lrcList;
    const index = lyric.activeIndex;
    const line = list[index];
    if (!line) {
      progress.value = 0;
    } else {
      // 末行没有下一行时间，按 4s 兜底，只为让最后一行的填充不至于过慢
      const endTime = list[index + 1]?.time ?? line.time + 4000;
      const span = endTime - line.time;
      const nowMs = (player.audioEl?.currentTime ?? 0) * 1000;
      progress.value = span > 0 ? Math.min(1, Math.max(0, (nowMs - line.time) / span)) : 1;
    }
    raf = requestAnimationFrame(tick);
  };

  onMounted(() => {
    raf = requestAnimationFrame(tick);
  });
  onUnmounted(() => cancelAnimationFrame(raf));

  return { progress };
};
