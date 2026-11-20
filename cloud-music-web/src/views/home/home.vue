<template>
  <div class="home">
    <app-header></app-header>
    <div class="container">
      <router-view v-slot="{ Component, route }">
        <transition name="page-slide" mode="out-in">
          <div :key="route.path" class="page-slide-wrap">
            <component :is="Component"></component>
          </div>
        </transition>
      </router-view>
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
    max-width: 1200px;
    width: 100%;
    box-sizing: border-box;
    margin: 0 auto;
    padding-left: 24px;
    padding-right: 24px;
    flex: 1 1 auto;
    padding-bottom: 90px;
    position: relative;
  }

  // 过渡包裹层：Transition 作用于它（单元素），规避多根组件无法动画的告警
  .page-slide-wrap {
    width: 100%;
  }
}

// 页面切换：左右渐入渐出（out-in：旧页先滑出，新页再滑入，两段都看得清）
.page-slide-enter-active,
.page-slide-leave-active {
  transition: opacity 200ms linear, transform 200ms linear;
}
.page-slide-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.page-slide-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

@media (prefers-reduced-motion: reduce) {
  .page-slide-enter-active,
  .page-slide-leave-active {
    transition: none;
  }
}
</style>
