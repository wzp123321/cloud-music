<template>
  <img
    :src="currentSrc"
    :alt="alt"
    :loading="lazy ? 'lazy' : undefined"
    @error="onError"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import defaultCover from '@/assets/images/common/common-avatar-default.png';

/**
 * 图片原子组件：统一兜底图、懒加载与加载失败回退。
 * class / style / width / height / @click 等 attrs 自动透传到根元素。
 */
const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    fallback?: string;
    lazy?: boolean;
  }>(),
  {
    src: '',
    alt: '',
    fallback: defaultCover,
    lazy: true,
  },
);

defineOptions({ name: 'CmImage', inheritAttrs: true });

const currentSrc = ref(props.src || props.fallback);

watch(
  () => [props.src, props.fallback],
  () => {
    currentSrc.value = props.src || props.fallback;
  },
);

/** 加载失败时回退到默认图；若默认图本身也失败则不再重试，避免死循环 */
const onError = () => {
  if (currentSrc.value !== props.fallback) {
    currentSrc.value = props.fallback;
  }
};
</script>
