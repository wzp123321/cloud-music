<template>
  <div v-loading="isLoading" class="search">
    <!-- 多重匹配概览：各类型匹配数量入口 -->
    <div v-if="search.multimatch.length" class="search-multimatch">
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
      v-model:selected-code="search.type"
      :title="'搜索结果'"
      :navs="navs"
      :has-load-more="false"
      @change="search.handleTypeChange"
    >
    </cm-navbar>
    <!-- 单曲 -->
    <cm-table v-if="search.type === SEARCH_TYPE.单曲" :data-source="search.songs"></cm-table>
    <!-- 专辑 -->
    <div v-if="search.type === SEARCH_TYPE.专辑" class="search-album">
      <cm-album-card
        v-for="(item, index) in search.albums"
        :id="item.id"
        :key="'album_' + index"
        :title="item.title"
        :public-time="item.publicTime"
        :cover-image-url="item.coverImageUrl"
      ></cm-album-card>
    </div>
    <!-- mv -->
    <div v-if="search.type === SEARCH_TYPE.MV" class="search-album">
      <cm-mv-card
        v-for="(item, index) in search.mvs"
        :id="item.id"
        :key="'mv_' + index"
        :cover-image-url="item.imgurl"
        :title="item.name"
        :duration="Number(item.duration)"
        :play-count="item.playCount"
        :publish-time="item.publishTime"
      ></cm-mv-card>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { FGetQueryParam } from '@/core/token';
import { useSearch, SEARCH_IMultimatchEntry } from './search.service';

import { SEARCH_TYPE } from './search.api';

const keyword = computed(() => {
  return FGetQueryParam('keyword') as string;
});
const search = useSearch();

search.query();
search.queryMultimatch();
const isLoading = ref<boolean>(false);

const navs = computed(() => {
  return Object.keys(SEARCH_TYPE).map((v) => {
    return {
      code: SEARCH_TYPE[v as keyof typeof SEARCH_TYPE],
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

// 订阅搜索 loading 状态，immediate 保证首屏同步到当前值
watch(
  search.loadingResult$,
  (v) => {
    isLoading.value = v ?? false;
  },
  { immediate: true },
);
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
