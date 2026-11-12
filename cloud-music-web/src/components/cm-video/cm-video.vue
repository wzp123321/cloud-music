<template>
  <video ref="videoRef"><slot /></video>
</template>

<script setup lang="ts">
import { ref } from 'vue';

/**
 * 视频元素封装：src / controls / autoplay / muted / preload 等 attrs 自动透传。
 * 通过 defineExpose 暴露 el，便于后续做自定义播放控制。
 */
defineOptions({ name: 'CmVideo', inheritAttrs: true });

const videoRef = ref<HTMLVideoElement | null>(null);
defineExpose({ el: videoRef });
</script>
