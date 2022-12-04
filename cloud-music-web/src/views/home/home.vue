<template>
  <div class="home">
    <Header></Header>
    <div class="container">
      <router-view></router-view>
    </div>
    <!-- 音乐播放器 -->
    <play-controller></play-controller>
    <!-- 音乐播放列表 -->
    <play-list></play-list>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

import Header from '../header/header.vue';
import PlayController from './components/play-controller/play-controller.vue';
import PlayLIst from './components/play-list/play-list.vue';

export default defineComponent({
  components: {
    Header,
    'play-controller': PlayController,
    'play-list': PlayLIst,
  },
});
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
    width: 1400px;
    margin: 0 auto;
    flex: 1 1 auto;
    padding-bottom: 90px;
  }
}
</style>
