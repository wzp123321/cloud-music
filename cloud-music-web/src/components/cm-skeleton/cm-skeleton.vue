<template>
<div class="cm-skeleton" :style="{width, minWidth: width, height, borderRadius}">
  <img v-if="loaded" :src="imageUrl" alt="" />
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
import {  watch, ref } from 'vue';
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

    watch(
      () => props.imageUrl,
      (newVal) => {
        if (!newVal) {
          return;
        }
        const img = new Image();
        img.src = newVal;
        img.onload = () => {
          loaded.value = true;
        };
      },
      {
        immediate: true,
      },
    );

    // props 在模板中可直接访问，无需再用 toRef 转发一次
    ;
</script>

<style lang="less" scoped>
.cm-skeleton {
  background-color: #ededed;
  color: #ededed;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
  }
}

</style>
