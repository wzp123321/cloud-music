<template>
  <div class="cm-fly-ball" aria-hidden="true">
    <div
      v-for="ball in flyBalls"
      :key="ball.id"
      class="cm-fly-ball--item"
      :style="ball.style"
    >
      <cm-image v-if="ball.cover" :src="ball.cover" alt="" />
      <span v-else class="cm-fly-ball--glyph">♪</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { flyBalls } from './fly-to-player';

// 飞入播放器的落点由 flyToPlayer() 计算并写入 offset-path，
// 这里只负责把队列渲染出来，自身不持有时序逻辑。
defineOptions({ name: 'CmFlyBall' });
</script>

<style lang="less" scoped>
.cm-fly-ball {
  position: fixed;
  inset: 0;
  z-index: 2500;
  overflow: hidden;
  pointer-events: none;

  &--item {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    margin: -19px 0 0 -19px;
    overflow: hidden;
    background: var(--color-primary);
    border-radius: var(--radius-md);
    box-shadow: 0 6px 18px rgb(194 12 12 / 35%);
    offset-rotate: 0deg;
    animation: cm-fly-ball-fly 760ms cubic-bezier(0.3, 0.05, 0.6, 1) forwards;
    will-change: offset-distance, opacity, scale;
  }

  &--glyph {
    font-size: 20px;
    line-height: 1;
    color: #fff;
  }

  :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

@keyframes cm-fly-ball-fly {
  0% {
    offset-distance: 0%;
    opacity: 0;
    scale: 0.6;
  }

  14% {
    opacity: 1;
    scale: 1;
  }

  72% {
    opacity: 1;
  }

  100% {
    offset-distance: 100%;
    opacity: 0;
    scale: 0.26;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cm-fly-ball {
    display: none;
  }
}
</style>
