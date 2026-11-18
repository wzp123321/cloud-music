<template>
  <div class="cm-state">
    <div v-if="loading" class="cm-state--box">
      <cm-loading></cm-loading>
    </div>
    <div v-else-if="error" class="cm-state--box">
      <cm-error :title="typeof error === 'string' ? error : errorTitle"></cm-error>
    </div>
    <div v-else-if="empty" class="cm-state--box cm-state--empty">
      <span class="cm-state--glyph" aria-hidden="true">♪</span>
      <p class="cm-state--text">{{ emptyText }}</p>
    </div>
    <slot v-else></slot>
  </div>
</template>

<script setup lang="ts">
/**
 * 列表三态容器：加载中 / 失败 / 空，三者互斥，正常时渲染默认插槽。
 *
 * 之前各页混用 v-loading 遮罩与 cm-error 当空态，语义错位：
 * 「没有数据」不是「加载失败」，用户看到的提示和可采取的下一步都不同。
 */
defineOptions({ name: 'CmState' });

withDefaults(
  defineProps<{
    loading?: boolean;
    /** 传 true 用默认文案，传字符串直接作为错误文案 */
    error?: boolean | string;
    empty?: boolean;
    emptyText?: string;
    errorTitle?: string;
  }>(),
  {
    loading: false,
    error: false,
    empty: false,
    emptyText: '暂无数据',
    errorTitle: '加载失败，请稍后重试',
  },
);
</script>

<style lang="less" scoped>
.cm-state {
  width: 100%;

  &--box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    // 与常见列表区域高度对齐，避免加载/空态把页面撑得太窄又太跳
    min-height: 220px;
    padding: 24px 0;
  }

  &--empty {
    gap: 10px;
  }

  &--glyph {
    font-size: 34px;
    line-height: 1;
    color: var(--color-text-disable);
  }

  &--text {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
}
</style>
