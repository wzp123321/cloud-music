<template>
  <div class="home">
    <Header></Header>
    <div class="container"></div>
  </div>
</template>
<script lang="ts" setup>
import Header from '../header/header.vue';
</script>
<style lang="less" scoped>
.home {
  width: 100%;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;

  .container {
    width: 1200px;
    margin: 0 auto;
    flex: 1 1 auto;
  }
}
</style>
