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
  const lrcPanel = ref<string[]>([]);

  /** 当前应展示的歌词 */
  const showLyc = computed(() =>
    lrcPanel.value.length ? lrcPanel.value[lrcPanel.value.length - 1] : '',
  );

  const reset = () => {
    lrcList.value = [];
    lrcPanel.value = [];
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

  /** 按播放进度推进歌词面板（每次只往后追加一行） */
  const syncPanel = (time: number) => {
    if (!lrcList.value.length) {
      lrcPanel.value = [];
      return;
    }
    if (!lrcPanel.value.length) {
      lrcPanel.value.push(lrcList.value[0]?.lyc ?? '', lrcList.value[1]?.lyc ?? '');
      return;
    }
    const next = lrcList.value[lrcPanel.value.length];
    if (next && time > next.time) {
      lrcPanel.value.push(next.lyc);
    }
  };

  return { lrcList, lrcPanel, showLyc, parse, reset, syncPanel };
});
