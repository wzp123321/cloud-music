<template>
  <div class="not-found flex-column-center-center">
    <p class="not-found--code">404</p>
    <h2 class="not-found--title">页面不存在</h2>
    <p class="not-found--desc">你访问的页面可能已被移动或删除</p>
    <cm-button primary class="not-found--back" @click="goHome">返回首页</cm-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

defineOptions({ name: 'NotFound' });

const router = useRouter();
const goHome = () => router.push('/');
</script>

<style scoped lang="less">
.not-found {
  min-height: 60vh;
  gap: 12px;

  &--code {
    font-size: 96px;
    font-weight: 700;
    line-height: 1;
    color: var(--color-primary);
  }

  &--title {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-title);
  }

  &--desc {
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  &--back {
    margin-top: 12px;
    padding: 8px 28px;
    border-radius: 6px;
    cursor: pointer;
  }
}
</style>
