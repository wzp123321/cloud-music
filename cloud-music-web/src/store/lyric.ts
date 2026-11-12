import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { LyricLine } from '@/constant';

/** 去掉时间片段的前导 0 后转数字，如 '03' → 3 */
const parseTimePart = (part?: string): number => {
  if (!part) {
    return 0;
  }
  return Number(part.startsWith('0') ? part.replace('0', '') : part);
};

export const useLyricStore = defineStore('lyric', () => {
  const lrcList = ref<LyricLine[]>([]);
  /** 当前应高亮/滚动到的歌词行索引（-1 表示未开始） */
  const activeIndex = ref<number>(-1);

  /** 截至当前行的歌词：由 activeIndex 派生，进度回拖时自动回退，不再累积 */
  const lrcPanel = computed<string[]>(() =>
    activeIndex.value < 0
      ? []
      : lrcList.value.slice(0, activeIndex.value + 1).map((line) => line.lyc),
  );

  /** 当前应展示的歌词 */
  const showLyc = computed(() =>
    lrcPanel.value.length ? lrcPanel.value[lrcPanel.value.length - 1] : '',
  );

  const reset = () => {
    lrcList.value = [];
    activeIndex.value = -1;
  };

  /** 解析 [mm:ss.ms]歌词 文本 */
  const parse = (raw?: string) => {
    reset();
    if (!raw) {
      return;
    }
    raw.split(/\n/).forEach((line) => {
      const parts = line.split(']');
      const timeStr = parts[0]?.replace('[', '') ?? '';
      const [minute, rest] = timeStr.split(':');
      const [second, milli] = (rest ?? '').split('.');
      const time =
        parseTimePart(minute) * 60 * 1000 + parseTimePart(second) * 1000 + Number(milli ?? 0);
      if (Number.isNaN(time)) {
        return;
      }
      lrcList.value.push({ time, lyc: parts[1] ?? '' });
    });
  };

  /** 按播放进度重算当前行：直接按时间定位，进度回拖也能回到对应歌词 */
  const syncPanel = (time: number) => {
    const list = lrcList.value;
    if (!list.length) {
      activeIndex.value = -1;
      return;
    }
    // 当前行：最后一行时间 <= 当前播放时间的歌词
    let idx = -1;
    for (let i = 0; i < list.length; i += 1) {
      if (time >= list[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    activeIndex.value = idx;
  };

  return { lrcList, lrcPanel, activeIndex, showLyc, parse, reset, syncPanel };
});
