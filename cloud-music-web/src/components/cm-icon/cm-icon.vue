<template>
  <i :class="['iconfont', name]"><slot /></i>
</template>

<script setup lang="ts">
/**
 * iconfont 图标原子组件：统一 iconfont 基类名，避免各处手写 class 拼错。
 * title / class / style / @click 等 attrs 自动透传到根元素。
 */
withDefaults(defineProps<{ name?: string }>(), { name: '' });
defineOptions({ name: 'CmIcon', inheritAttrs: true });
</script>
