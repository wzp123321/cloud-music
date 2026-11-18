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
    <!-- 歌词：/search/lyric 命中片段 -->
    <div v-if="type === SearchType.歌词" class="search-lyric">
      <div
        v-for="hit in lyrics"
        :key="'lyric_' + hit.id"
        class="lyric-card"
        @click="onLyricClick(hit.id)"
      >
        <cm-image class="lyric-cover" :src="hit.cover" alt="" />
        <div class="lyric-body">
          <p class="lyric-title"><b>{{ hit.name }}</b><span>{{ hit.artist }}</span></p>
          <p class="lyric-text">{{ hit.matched }}</p>
        </div>
      </div>
      <p v-if="!lyrics.length" class="search-empty">暂无歌词匹配结果</p>
    </div>
    <!-- 歌手 / 歌单 / 用户 / 电台 / 视频 / 综合：通用卡片 -->
    <div v-else-if="showGeneric" class="search-generic">
      <div v-for="hit in generic" :key="'gen_' + hit.id" class="generic-card">
        <cm-image class="generic-cover" :src="hit.cover" alt="" />
        <p class="generic-name">{{ hit.name }}</p>
        <p class="generic-sub">{{ hit.sub }}</p>
      </div>
      <p v-if="!generic.length" class="search-empty">暂无匹配结果</p>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getQueryParam } from '@/core/token';
import { useSearch, SEARCH_MultimatchEntry } from './hooks/useSearch';

import { SearchType } from '../../apis/search/index.api';

const urlKeyword = computed(() => {
  return getQueryParam('keyword') as string;
});
const router = useRouter();
const {
  type,
  songs,
  albums,
  mvs,
  lyrics,
  generic,
  multimatch,
  loadingResult$,
  query,
  queryMultimatch,
  handleTypeChange,
} = useSearch();

query();
queryMultimatch();
const isLoading = ref<boolean>(false);

/** 已有专属渲染的类型；其余 tab 走通用卡片 */
const plainTypes: string[] = [SearchType.单曲, SearchType.专辑, SearchType.MV, SearchType.歌词];
const showGeneric = computed(() => !plainTypes.includes(type.value as string));

/** 歌词命中项 → 打开歌曲详情 */
const onLyricClick = (id: number) => {
  if (id) router.push({ path: '/music_detail', query: { id } });
};

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

  &-lyric {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .lyric-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 14px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      border-color: var(--color-primary, #c20c0c);
    }
  }

  .lyric-cover {
    width: 54px;
    height: 54px;
    flex-shrink: 0;
    border-radius: 6px;
    object-fit: cover;
  }

  .lyric-body {
    min-width: 0;
  }

  .lyric-title {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 0 0 4px;

    b {
      font-size: 14px;
      color: #333;
    }

    span {
      font-size: 12px;
      color: #999;
    }
  }

  .lyric-text {
    margin: 0;
    font-size: 12px;
    line-height: 20px;
    color: #777;
    white-space: pre-line;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &-generic {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
  }

  .generic-card {
    min-width: 0;
  }

  .generic-cover {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 8px;
    object-fit: cover;
  }

  .generic-name {
    margin: 8px 0 2px;
    font-size: 13px;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .generic-sub {
    margin: 0;
    font-size: 11px;
    color: #aaa;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .search-empty {
    padding: 40px 0;
    text-align: center;
    font-size: 13px;
    color: #aaa;
  }
}
</style>
