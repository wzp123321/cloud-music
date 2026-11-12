<template>
  <div class="album-discovery">
    <cm-navbar :title="'新碟与数字专辑'" :has-load-more="false"></cm-navbar>

    <div class="album-discovery--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['album-discovery--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </button>
    </div>

    <div v-if="showAreaFilter || activeTab === 'saleboard'" class="album-discovery--filters">
      <template v-if="showAreaFilter">
        <span class="album-discovery--filter-label">地区</span>
        <button
          v-for="area in currentAreaOptions"
          :key="area.value"
          :class="['album-discovery--filter', activeArea === area.value ? 'active' : '']"
          @click="switchArea(area.value)"
        >
          {{ area.name }}
        </button>
      </template>
      <template v-if="activeTab === 'saleboard'">
        <span class="album-discovery--filter-label">榜单周期</span>
        <button
          v-for="period in periodOptions"
          :key="period.value"
          :class="['album-discovery--filter', activePeriod === period.value ? 'active' : '']"
          @click="switchPeriod(period.value)"
        >
          {{ period.name }}
        </button>
      </template>
    </div>

    <div v-if="loading" class="album-discovery--status">加载中…</div>
    <cm-error v-else-if="!albumList.length" :title="'暂无专辑数据'"></cm-error>
    <div v-else class="album-discovery--grid grid-cols-5">
      <div
        v-for="(item, index) in albumList"
        :key="'album_' + activeTab + '_' + index + '_' + item.id"
        class="album-discovery--card"
        @click="linkToAlbum(item.id)"
      >
        <div v-if="item.rank" class="album-discovery--rank">{{ item.rank }}</div>
        <cm-skeleton width="100%" :height="''" :image-url="item.cover" :border-radius="'6px'"></cm-skeleton>
        <p class="album-discovery--name" :title="item.title">{{ item.title }}</p>
        <p class="album-discovery--sub" :title="item.subtitle">{{ item.subtitle }}</p>
      </div>
    </div>

    <p class="album-discovery--tip">点击专辑卡片进入专辑详情，可查看动态数据并订阅</p>
  </div>
</template>

<script lang="ts" setup>
import { useAlbumDiscovery } from './hooks/useAlbumDiscovery';

const {
  tabs,
  currentAreaOptions,
  periodOptions,
  activeTab,
  activeArea,
  activePeriod,
  showAreaFilter,
  loading,
  albumList,
  switchTab,
  switchArea,
  switchPeriod,
  linkToAlbum,
} = useAlbumDiscovery();
</script>

<style scoped lang="less">
.album-discovery {
  width: 1200px;
  margin: 0 auto;
  padding: 24px 0 48px;

  &--tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 20px;
  }

  &--tab {
    padding: 8px 18px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 18px;
    background: var(--color-default, #fff);
    color: #666;
    font-size: 14px;
    cursor: pointer;

    &.active {
      border-color: #c20c0c;
      color: #c20c0c;
      background: rgba(194, 12, 12, 0.06);
    }
  }

  &--filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
    padding: 14px 18px;
    background: var(--color-default, #fff);
    border-radius: 8px;
  }

  &--filter-label {
    font-size: 13px;
    color: #999;
    margin-right: 4px;
  }

  &--filter {
    padding: 4px 12px;
    border: none;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.04);
    color: #666;
    font-size: 13px;
    cursor: pointer;

    &.active {
      color: #fff;
      background: #c20c0c;
    }
  }

  &--status {
    margin-top: 32px;
    color: #999;
    font-size: 14px;
  }

  &--grid {
    display: grid;
    gap: 24px;
    margin-top: 20px;
  }

  &--card {
    position: relative;
    cursor: pointer;
    transition: transform 0.2s;

    // 封面为正方形，跟随列宽缩放而不是写死高度
    :deep(.cm-skeleton) {
      height: auto;
      aspect-ratio: 1;
    }

    &:hover {
      transform: translateY(-4px);
    }
  }

  &--rank {
    position: absolute;
    z-index: 2;
    top: 8px;
    left: 8px;
    min-width: 26px;
    height: 26px;
    line-height: 26px;
    text-align: center;
    border-radius: 13px;
    background: rgba(194, 12, 12, 0.85);
    color: #fff;
    font-size: 13px;
  }

  &--name {
    margin-top: 10px;
    font-size: 14px;
    color: #333;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--sub {
    margin-top: 4px;
    font-size: 12px;
    color: #999;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--tip {
    margin-top: 32px;
    font-size: 12px;
    color: #aaa;
  }
}
</style>
