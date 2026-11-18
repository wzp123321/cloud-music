<template>
  <div class="cm-play-fx" aria-hidden="true">
    <span
      v-for="note in notes"
      :key="note.id"
      class="cm-play-fx--note"
      :style="note.style"
    >{{ note.glyph }}</span>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';

// 播放起的音符飞散特效：每个音符沿一条随机的三次贝塞尔曲线抛出，
// 轨迹由 offset-path 驱动，JS 只负责生成路径，帧动画全在合成层完成。
defineOptions({ name: 'CmPlayFx' });

const props = defineProps<{
  /** 数值递增即触发一次飞散，父组件负责在开始播放时 +1 */
  trigger: number;
  /** 播放中：按固定节奏持续飘出单颗音符，暂停即停 */
  active?: boolean;
}>();

interface Note {
  id: number;
  glyph: string;
  style: Record<string, string>;
}

const GLYPHS = ['♪', '♫', '♩', '♬'];
const NOTE_COUNT = 7;
/** 与 CSS 动画时长 1.45s 对齐，留一点余量等延迟动画跑完 */
const NOTE_LIFETIME = 1700;
/** 持续飘出的间隔：比 1.45s 的生命周期略长，场上始终只有一两颗，不压画面 */
const AMBIENT_INTERVAL = 1100;

const notes = ref<Note[]>([]);
let sequence = 0;
let ambientTimer = 0;
const timers: number[] = [];

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

/** 向上扇形散开：起点在封面中心，控制点先上扬再回落到终点，形成抛物线感 */
const buildBezierPath = () => {
  const angle = ((-160 + Math.random() * 140) * Math.PI) / 180;
  const distance = 64 + Math.random() * 76;
  const endX = Math.cos(angle) * distance;
  const endY = Math.sin(angle) * distance;
  const c1x = (endX * 0.15).toFixed(1);
  const c1y = (endY * 1.9).toFixed(1);
  const c2x = (endX * 0.85).toFixed(1);
  const c2y = (endY * 0.2).toFixed(1);
  return `M 0 0 C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
};

const spawn = (count: number) => {
  if (motionQuery.matches) {
    return;
  }
  const batch: Note[] = Array.from({ length: count }, () => {
    const id = ++sequence;
    return {
      id,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      style: {
        offsetPath: `path('${buildBezierPath()}')`,
        animationDelay: `${Math.round(Math.random() * 180)}ms`,
        fontSize: `${12 + Math.round(Math.random() * 8)}px`,
        // 双色同属品牌红：主色偏重、hover 色偏亮，落在白底上都够清楚
        color: Math.random() > 0.35 ? 'var(--color-primary)' : 'var(--color-primary-hover)',
      },
    };
  });
  notes.value = [...notes.value, ...batch];

  const batchIds = new Set(batch.map((note) => note.id));
  timers.push(
    window.setTimeout(() => {
      notes.value = notes.value.filter((note) => !batchIds.has(note.id));
    }, NOTE_LIFETIME),
  );
};

const stopAmbient = () => {
  if (ambientTimer) {
    window.clearInterval(ambientTimer);
    ambientTimer = 0;
  }
};

const startAmbient = () => {
  stopAmbient();
  if (motionQuery.matches) {
    return;
  }
  ambientTimer = window.setInterval(() => spawn(1), AMBIENT_INTERVAL);
};

watch(
  () => props.trigger,
  (value) => {
    if (value > 0) {
      spawn(NOTE_COUNT);
    }
  },
);

watch(
  () => props.active,
  (active) => {
    if (active) {
      startAmbient();
    } else {
      stopAmbient();
    }
  },
);

onUnmounted(() => {
  stopAmbient();
  timers.forEach((timer) => window.clearTimeout(timer));
});
</script>

<style lang="less" scoped>
.cm-play-fx {
  position: absolute;
  inset: 0;
  z-index: 4;
  overflow: visible;
  pointer-events: none;

  &--note {
    position: absolute;
    top: 50%;
    left: 50%;
    line-height: 1;
    opacity: 0;
    offset-rotate: 0deg;
    animation: cm-play-fx-fly 1.45s cubic-bezier(0.22, 0.68, 0.28, 1) forwards;
    will-change: offset-distance, opacity;
  }
}

@keyframes cm-play-fx-fly {
  0% {
    offset-distance: 0%;
    opacity: 0;
  }

  15% {
    opacity: 1;
  }

  68% {
    opacity: 1;
  }

  100% {
    offset-distance: 100%;
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cm-play-fx {
    display: none;
  }
}
</style>
