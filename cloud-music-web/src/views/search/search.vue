<template>
  <div v-loading="isLoading" class="search">
    <!-- 多重匹配概览：各类型匹配数量入口 -->
    <div v-if="multimatch.length" class="search-multimatch">
      <span class="mm-label">多重匹配</span>
      <span
        v-for="(item, index) in multimatch"
        :key="'mm_' + index"
        class="mm-item"
        :class="{ active: type === item.code }"
        @click="onMultimatchClick(item)"
      >
        {{ item.name }}
        <em>{{ item.count }}</em>
      </span>
    </div>
    <cm-navbar
      v-model:selected-code="type"
      :title="'搜索结果'"
      :navs="navs"
      :has-load-more="false"
      @change="handleTypeChange"
    >
    </cm-navbar>
    <!-- 单曲 -->
    <cm-table
      v-if="type === SearchType.单曲"
      :data-source="songs"
      empty-text="没有找到相关歌曲"
    ></cm-table>
    <!-- 专辑 -->
    <div v-if="type === SearchType.专辑" class="search-album">
      <cm-album-card
        v-for="(item, index) in albums"
        :id="item.id"
        :key="'album_' + index"
        :title="item.title"
        :public-time="item.publicTime"
        :cover-image-url="item.coverImageUrl"
      ></cm-album-card>
    </div>
    <!-- mv -->
    <div v-if="type === SearchType.MV" class="search-album">
      <cm-mv-card
        v-for="(item, index) in mvs"
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
import { getQueryParam } from '@/core/token';
import { useSearch, SEARCH_MultimatchEntry } from './hooks/useSearch';

import { SearchType } from '../../apis/search/index.api';

const urlKeyword = computed(() => {
  return getQueryParam('keyword') as string;
});
const { type, songs, albums, mvs, multimatch, loadingResult$, query, queryMultimatch, handleTypeChange } = useSearch();

query();
queryMultimatch();
const isLoading = ref<boolean>(false);

const navs = computed(() => {
  return Object.keys(SearchType).map((v) => {
    return {
      code: SearchType[v as keyof typeof SearchType],
      name: v,
    };
  });
});

/** 点击多重匹配入口：切换类型并重新查询 */
const onMultimatchClick = (item: SEARCH_MultimatchEntry) => {
  if (item.code) {
    type.value = item.code;
    query();
  }
};

watch(
  () => urlKeyword.value,
  () => {
    query();
    queryMultimatch();
  },
);

// 订阅搜索 loading 状态，immediate 保证首屏同步到当前值
watch(
  loadingResult$,
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
        background: rgba(194, 12, 12, 0.08);
      }

      &.active {
        background: var(--color-primary);
        color: #fff;
        font-weight: 600;

        em {
          color: rgba(255, 255, 255, 0.8);
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
