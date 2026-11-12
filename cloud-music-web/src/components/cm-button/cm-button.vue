<template>
  <button><slot /></button>
</template>

<script setup lang="ts">
/**
 * 按钮原子组件。
 *
 * 内部仍是原生 button：项目的 src/assets/style/button.css 依赖
 * button[primary] / button[radius] / button[text] / button[danger] 等属性选择器，
 * 换成 Element Plus 会丢掉整套视觉。这里只做一层组件封装，
 * attrs（含无值属性、class、style、disabled、@click）自动透传到根元素。
 */
defineOptions({ name: 'CmButton', inheritAttrs: true });
</script>
