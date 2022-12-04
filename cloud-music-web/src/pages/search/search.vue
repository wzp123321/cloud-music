<template>
  <div class="search" v-loading="isLoading">
    <cm-navbar :title="'搜索结果'" :navs="navs" v-model:selectedCode="search.type" @change="search.handleTypeChange">
    </cm-navbar>
    <cm-table v-if="search.type === SEARCH_TYPE.单曲" :dataSource="search.songs"></cm-table>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { FGetQueryParam } from '@/core/token';
import { SearchService } from './search.service';

import { SEARCH_TYPE } from './search.api';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { watch } from 'fs';
const destroy$ = new Subject<void>();

const keyword = computed(() => {
  return FGetQueryParam('keyword') as string;
});
const search = new SearchService(keyword.value);

search.query();
const isLoading = ref<boolean>(false);

const navs = computed(() => {
  return Object.keys(SEARCH_TYPE).map((v) => {
    return {
      code: SEARCH_TYPE[v],
      name: v,
    };
  });
});

watch(keyword.value, () => {
  search.query();
});

onMounted(() => {
  search.loadingResult$.pipe(takeUntil(destroy$)).subscribe((v) => {
    isLoading.value = v ?? false;
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

  .cm-navbar {
    padding: 60px 0 24px;
  }
}
</style>
