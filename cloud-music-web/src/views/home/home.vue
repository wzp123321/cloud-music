<template>
  <div class="home">
    <app-header></app-header>
    <div class="container">
      <router-view></router-view>
    </div>
    <!-- 音乐播放器 -->
    <play-controller></play-controller>
    <!-- 音乐播放列表 -->
    <play-list></play-list>
  </div>
</template>
<script setup lang="ts">



import AppHeader from '../header/header.vue';
import PlayController from './components/play-controller/play-controller.vue';
import PlayList from './components/play-list/play-list.vue';
</script>
<style lang="less" scoped>
.home {
  position: relative;
  width: 100%;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;

  .container {
    width: 1200px;
    margin: 0 auto;
    flex: 1 1 auto;
    padding-bottom: 90px;
  }
}
</style>
