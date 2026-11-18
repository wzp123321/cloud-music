<template>
  <span class="cm-lyric-line">
    <span class="cm-lyric-line--base" :style="{ opacity: String(baseOpacity) }">{{ text }}</span>
    <span
      class="cm-lyric-line--fill"
      :style="{ '--fill': `${(Math.min(1, Math.max(0, progress)) * 100).toFixed(2)}%`, color: fillColor }"
      aria-hidden="true"
    >{{ text }}</span>
  </span>
</template>

<script setup lang="ts">
// 逐字高亮：底层是暗色整行，上层用同色文本 + 渐变遮罩，遮罩右侧随进度推进，
// 相当于卡拉OK的字幕填充。文本渲染两次而不是按字符切 span，
// 换行、缩进和字间距都不会错位。
defineOptions({ name: 'CmLyricLine' });

withDefaults(
  defineProps<{
    text: string;
    /** 行内进度 0~1 */
    progress: number;
    /** 底层未唱部分的透明度；非当前行传 1，直接沿用父级颜色 */
    baseOpacity?: number;
    /** 已唱部分的颜色：浅底用品牌红，深底歌词页可传 currentColor */
    fillColor?: string;
  }>(),
  { baseOpacity: 0.45, fillColor: 'var(--color-primary)' },
);
</script>

<style lang="less" scoped>
.cm-lyric-line {
  position: relative;
  display: inline-block;
  max-width: 100%;
  white-space: pre-wrap;
  word-break: break-word;

  &--base {
    color: currentColor;
  }

  &--fill {
    position: absolute;
    inset: 0;
    // 颜色由 fillColor 内联给出，这里不设，避免盖掉
    // 右侧留 10% 的软过渡，切口不会像硬边一样突兀
    mask-image: linear-gradient(
      to right,
      #000 calc(var(--fill) - 10%),
      transparent var(--fill)
    );
    -webkit-mask-image: linear-gradient(
      to right,
      #000 calc(var(--fill) - 10%),
      transparent var(--fill)
    );
    pointer-events: none;
  }
}
</style>
