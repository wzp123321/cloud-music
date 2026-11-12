<template>
  <div class="mv-discovery">
    <cm-navbar :title="'MV'" :has-load-more="false"></cm-navbar>

    <div class="mv-discovery--tabs">
      <cm-button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['mv-discovery--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </cm-button>
    </div>

    <div v-if="activeTab === 'all'" class="mv-discovery--filters">
      <span class="mv-discovery--filter-label">地区</span>
      <cm-button
        v-for="area in areaOptions"
        :key="area"
        :class="['mv-discovery--filter', activeArea === area ? 'active' : '']"
        @click="switchArea(area)"
      >
        {{ area }}
      </cm-button>
      <span class="mv-discovery--filter-label">排序</span>
      <cm-button
        v-for="order in orderOptions"
        :key="order"
        :class="['mv-discovery--filter', activeOrder === order ? 'active' : '']"
        @click="switchOrder(order)"
      >
        {{ order }}
      </cm-button>
    </div>

    <section class="mv-discovery--section">
      <div v-if="loading" class="mv-discovery--status">加载中…</div>
      <cm-error v-else-if="!mvList.length" :title="'暂无 MV 数据'"></cm-error>
      <div v-else class="mv-discovery--grid grid-cols-4">
        <div
          v-for="(item, index) in mvList"
          :key="'mv_' + activeTab + '_' + index + '_' + item.id"
          class="mv-discovery--card"
          @click="linkToMv(item.id)"
        >
          <cm-skeleton width="100%" :height="''" :image-url="item.cover || ''" :border-radius="'6px'"></cm-skeleton>
          <p class="mv-discovery--name" :title="item.name">{{ item.name }}</p>
          <p class="mv-discovery--sub">{{ item.artistName || '' }} · 播放 {{ formatPlayCount(item.playCount || 0) }}</p>
        </div>
      </div>
    </section>

    <!-- 已收藏 MV：mv_sublist（需登录，未登录降级提示） -->
    <section class="mv-discovery--section">
      <h3 class="mv-discovery--heading">我收藏的 MV</h3>
      <p v-if="!hasLogin" class="mv-discovery--tip">登录后查看收藏的 MV</p>
      <cm-error v-else-if="!subMvList.length" :title="'暂无收藏 MV'"></cm-error>
      <div v-else class="mv-discovery--grid grid-cols-4">
        <div
          v-for="(item, index) in subMvList"
          :key="'sub_mv_' + index"
          class="mv-discovery--card"
          @click="linkToMv(item.id)"
        >
          <cm-skeleton width="100%" :height="''" :image-url="item.cover || ''" :border-radius="'6px'"></cm-skeleton>
          <p class="mv-discovery--name" :title="item.name">{{ item.name }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { useMvView } from './hooks/useMvView';

const {
  tabs,
  activeTab,
  switchTab,
  areaOptions,
  activeArea,
  switchArea,
  orderOptions,
  activeOrder,
  switchOrder,
  loading,
  mvList,
  linkToMv,
  formatPlayCount,
  hasLogin,
  subMvList,
} = useMvView();
</script>

<style scoped lang="less">
.mv-discovery {
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 24px 24px 48px;

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
      border-color: var(--color-primary, #c20c0c);
      color: var(--color-primary, #c20c0c);
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
      background: var(--color-primary, #c20c0c);
    }
  }

  &--section {
    margin-top: 24px;
    padding: 16px 20px;
    background: var(--color-default, #fff);
    border-radius: 8px;
  }

  &--heading {
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }

  &--status,
  &--tip {
    margin-top: 16px;
    font-size: 13px;
    color: #999;
  }

  &--grid {
    display: grid;
    gap: 24px;
    margin-top: 20px;
  }

  &--card {
    cursor: pointer;
    transition: transform 0.2s;

    // MV 封面为 16:9，跟随列宽缩放
    :deep(.cm-skeleton) {
      height: auto;
      aspect-ratio: 16 / 9;
    }

    &:hover {
      transform: translateY(-4px);
    }
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
}
</style>
