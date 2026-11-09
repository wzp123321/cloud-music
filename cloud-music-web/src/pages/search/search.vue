<template>
  <div class="search" v-loading="isLoading">
    <!-- 多重匹配概览：各类型匹配数量入口 -->
    <div class="search-multimatch" v-if="search.multimatch.length">
      <span class="mm-label">多重匹配</span>
      <span
        v-for="(item, index) in search.multimatch"
        :key="'mm_' + index"
        class="mm-item"
        :class="{ active: search.type === item.code }"
        @click="onMultimatchClick(item)"
      >
        {{ item.name }}
        <em>{{ item.count }}</em>
      </span>
    </div>
    <cm-navbar
      :title="'搜索结果'"
      :navs="navs"
      v-model:selectedCode="search.type"
      :hasLoadMore="false"
      @change="search.handleTypeChange"
    >
    </cm-navbar>
    <!-- 单曲 -->
    <cm-table v-if="search.type === SEARCH_TYPE.单曲" :dataSource="search.songs"></cm-table>
    <!-- 专辑 -->
    <div class="search-album" v-if="search.type === SEARCH_TYPE.专辑">
      <cm-album-card
        v-for="(item, index) in search.albums"
        :key="'album_' + index"
        :title="item.title"
        :publicTime="item.publicTime"
        :coverImageUrl="item.coverImageUrl"
        :id="item.id"
      ></cm-album-card>
    </div>
    <!-- mv -->
    <div class="search-album" v-if="search.type === SEARCH_TYPE.MV">
      <cm-mv-card
        v-for="(item, index) in search.mvs"
        :key="'mv_' + index"
        :coverImageUrl="item.imgurl"
        :title="item.name"
        :duration="String(item.duration)"
        :playCount="item.playCount"
        :publishTime="item.publishTime"
        :id="item.id"
      ></cm-mv-card>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { FGetQueryParam } from '@/core/token';
import { SearchService, SEARCH_IMultimatchEntry } from './search.service';

import { SEARCH_TYPE } from './search.api';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
const destroy$ = new Subject<void>();

const keyword = computed(() => {
  return FGetQueryParam('keyword') as string;
});
const search = new SearchService(keyword.value);

search.query();
search.queryMultimatch();
const isLoading = ref<boolean>(false);

const navs = computed(() => {
  return Object.keys(SEARCH_TYPE).map((v) => {
    return {
      code: SEARCH_TYPE[v],
      name: v,
    };
  });
});

/** 点击多重匹配入口：切换类型并重新查询 */
const onMultimatchClick = (item: SEARCH_IMultimatchEntry) => {
  if (item.code) {
    search.type = item.code;
    search.query();
  }
};

watch(
  () => keyword.value,
  () => {
    search.query();
    search.queryMultimatch();
  },
);

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

  &-multimatch {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px 0 0;

    .mm-label {
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .mm-item {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 13px;
      color: var(--color-text-title);
      background: rgba(0, 0, 0, 0.04);
      cursor: pointer;

      em {
        margin-left: 4px;
        font-style: normal;
        color: var(--color-text-secondary);
      }

      &:hover {
        background: rgba(255, 228, 67, 0.4);
      }

      &.active {
        background: #ffe443;
        font-weight: 600;

        em {
          color: var(--color-text-title);
        }
      }
    }
  }

  &-album {
    display: grid;
    grid-template-columns: repeat(4, auto);

    gap: 16px;
  }
}
</style>
