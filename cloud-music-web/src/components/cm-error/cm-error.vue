<template>
<div class="cm-error flex-column-center-center">
  <img src="../../assets/images/common/common-error.png" alt="" />
  <p class="title">加载失败，请稍后重试</p>
</div>

</template>

<script lang="ts">
/*
 * @Descrption: 缺省
 * @Author: wanzp
 * @Date: 2022-07-10 15:28:48
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-07-10 21:37:24
 */
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CmSkeleton',
  props: {
    title: {
      type: String,
      default: '暂无数据',
    },
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
