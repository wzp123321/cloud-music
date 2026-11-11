<template>
<div class="cm-skeleton" :class="{ 'is-placeholder': placeholder }" :style="skeletonStyle">
  <img v-if="loaded" :src="imageUrl" alt="" />
  <span v-else-if="placeholder" class="cm-skeleton--placeholder" aria-hidden="true">♪</span>
</div>

</template>

<script setup lang="ts">

/*
 * @Descrption: 骨架屏
 * @Author: wanzp
 * @Date: 2022-07-10 15:28:48
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-07-10 17:06:43
 */
import { watch, ref, computed, onBeforeUnmount } from 'vue';
defineOptions({ name: 'CmSkeleton' });
const props = defineProps({
    width: {
      type: String,
      default: '100%',
    },
    height: {
      type: String,
      default: '100%',
    },
    borderRadius: {
      type: String,
      default: 'none',
    },
    imageUrl: {
      type: String,
      default: '',
    },
  });
const loaded = ref<boolean>(false);
// 无图或图片加载失败时显示静态占位，避免骨架一直挂着像在加载
const placeholder = ref<boolean>(false);
let pending: HTMLImageElement | null = null;

// height 允许传空串：不输出 inline height，改由外部 aspect-ratio 控制比例
const skeletonStyle = computed<Record<string, string>>(() => {
  const style: Record<string, string> = {
    width: props.width,
    minWidth: props.width,
    borderRadius: props.borderRadius,
  };
  if (props.height) {
    style.height = props.height;
  }
  return style;
});

const reset = () => {
  if (pending) {
    pending.onload = null;
    pending.onerror = null;
    pending = null;
  }
  loaded.value = false;
  placeholder.value = false;
};

watch(
  () => props.imageUrl,
  (newVal) => {
    reset();
    if (!newVal) {
      placeholder.value = true;
      return;
    }
    const img = new Image();
    pending = img;
    // 先绑事件再赋 src，避免缓存命中时 onload 丢失
    img.onload = () => {
      if (pending !== img) return;
      loaded.value = true;
      placeholder.value = false;
      pending = null;
    };
    img.onerror = () => {
      if (pending !== img) return;
      placeholder.value = true;
      pending = null;
    };
    img.src = newVal;
  },
  { immediate: true },
);

onBeforeUnmount(reset);
</script>

<style lang="less" scoped>
.cm-skeleton {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ededed;
  color: #ededed;
  overflow: hidden;

  &.is-placeholder {
    background: linear-gradient(135deg, #f7f7f7, #e9e9e9);
  }

  &--placeholder {
    font-size: 36px;
    line-height: 1;
    color: #c9c9c9;
  }

  img {
    width: 100%;
    height: 100%;
    // 容器比例与源图不一致时裁切居中显示，禁止拉伸变形
    object-fit: cover;
  }
}

</style>
