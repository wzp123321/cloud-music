<template>
  <div class="mvplay" v-loading="isLoading">
    <div class="mvplay-mvcontainer">
      <video :src="mvPlay.url"></video>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { FGetQueryParam } from '@/core/token';
import { MvPlayService } from './mvplay.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
const destroy$ = new Subject<void>();

const id = FGetQueryParam('id') as string;
const mvPlay = new MvPlayService(id);

mvPlay.query();

const isLoading = ref<boolean>(false);
onMounted(() => {
  mvPlay.loadingResult$.pipe(takeUntil(destroy$)).subscribe((v) => {
    isLoading.value = v;
  });
});

onUnmounted(() => {
  destroy$.next();
  destroy$.complete();
});
</script>
<style lang="less" scoped>
.mvplay {
  width: 100%;
  height: 100%;

  overflow: hidden;

  .mvplay-mvcontainer {
    min-height: 528px;

    video {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
