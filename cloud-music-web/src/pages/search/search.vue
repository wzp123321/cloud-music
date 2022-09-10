<template>
  <div class="search" v-loading="isLoading"></div>
</template>
<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { FGetQueryParam } from '@/core/token';
import { SearchService } from './search.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
const destroy$ = new Subject<void>();

const keyword = FGetQueryParam('keyword') as string;
const search = new SearchService(keyword);

search.query();

const isLoading = ref<boolean>(false);
onMounted(() => {
  search.loadingResult$.pipe(takeUntil(destroy$)).subscribe((v) => {
    isLoading.value = v;
  });
});

onUnmounted(() => {
  destroy$.next();
  destroy$.complete();
});
</script>
<style lang="less" scoped>
.search {
  width: 100%;
  height: 100%;

  overflow: hidden;
}
</style>
