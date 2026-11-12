<template>
<div class="cm-error flex-column-center-center">
  <cm-image src="../../assets/images/common/common-error.png" alt="" />
  <p class="title">{{ title }}</p>
</div>

</template>

<script setup lang="ts">

// 缺省
defineOptions({ name: 'CmSkeleton' });
defineProps({
    title: {
      type: String,
      default: '加载失败，请稍后重试',
    },
  });
</script>

<style lang="less" scoped>
.cm-error {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-size: 14px;

  img {
    width: 60px;
    height: 60px;
  }

  p.title {
    color: var(--color-text-disable);
  }
}

</style>
