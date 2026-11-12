<template>
  <audio ref="audioRef"><slot /></audio>
</template>

<script setup lang="ts">
import { ref } from 'vue';

/**
 * 音频元素封装：仍是原生 audio（player store 需要真实 DOM 驱动播放），
 * src / @timeupdate / @ended / @error 等 attrs 自动透传到根元素。
 * 通过 defineExpose 暴露 el，供父组件注入 player store。
 */
defineOptions({ name: 'CmAudio', inheritAttrs: true });

const audioRef = ref<HTMLAudioElement | null>(null);
defineExpose({ el: audioRef });
</script>
