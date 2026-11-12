<template>
  <!-- 媒体卡片网格：封面 + 标题 + 可选副标题，点击回传整项 -->
  <div
    class="cm-media-grid"
    :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: gap + 'px' }"
  >
    <div
      v-for="(item, index) in items"
      :key="itemKey ? String((item as Record<string, any>)[itemKey]) : index"
      class="cm-media-grid--item"
      @click="emit('item-click', item, index)"
    >
      <cm-skeleton
        width="100%"
        :image-url="(item as Record<string, any>).cover || ''"
        :border-radius="'6px'"
      ></cm-skeleton>
      <p class="cm-media-grid--title" :title="(item as Record<string, any>).title">
        {{ (item as Record<string, any>).title }}
      </p>
      <p v-if="(item as Record<string, any>).subtitle" class="cm-media-grid--sub">
        {{ (item as Record<string, any>).subtitle }}
      </p>
      <!-- 自定义扩展区，如「id: xxx」等额外文案 -->
      <slot name="extra" :item="item" :index="index"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// 全局组件按文件名注册，cm-skeleton 已在 components 下自动注册，无需 import
defineProps<{
  /** 卡片数据列表，每项至少含 cover/title，可选 subtitle */
  items: Record<string, any>[];
  /** 列数，默认 6 */
  cols?: number;
  /** 列间距（px），默认 18 */
  gap?: number;
  /** 作为 key 的字段名，缺省用索引 */
  itemKey?: string;
}>();

const emit = defineEmits<{
  (e: 'item-click', item: Record<string, any>, index: number): void;
}>();
</script>

<style scoped lang="less">
.cm-media-grid {
  display: grid;

  &--item {
    cursor: pointer;
    transition: transform 0.2s;

    // 封面为正方形，跟随列宽缩放
    :deep(.cm-skeleton) {
      height: auto;
      aspect-ratio: 1;
    }

    &:hover {
      transform: translateY(-4px);
    }
  }

  &--title {
    margin-top: 8px;
    font-size: 13px;
    color: #333;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--sub {
    margin-top: 4px;
    font-size: 11px;
    color: #999;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}
</style>
