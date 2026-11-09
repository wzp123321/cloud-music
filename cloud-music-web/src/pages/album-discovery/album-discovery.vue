<template>
  <div class="album-discovery">
    <cm-navbar :title="'新碟与数字专辑'" :hasLoadMore="false"></cm-navbar>

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

    <div class="album-discovery--filters" v-if="showAreaFilter || activeTab === 'saleboard'">
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

    <div class="album-discovery--status" v-if="loading">加载中…</div>
    <cm-error v-else-if="!albumList.length" :title="'暂无专辑数据'"></cm-error>
    <div v-else class="album-discovery--grid">
      <div
        v-for="(item, index) in albumList"
        :key="'album_' + activeTab + '_' + index + '_' + item.id"
        class="album-discovery--card"
        @click="linkToAlbum(item.id)"
      >
        <div class="album-discovery--rank" v-if="item.rank">{{ item.rank }}</div>
        <cm-skeleton width="100%" :height="'180px'" :imageUrl="item.cover" :borderRadius="'6px'"></cm-skeleton>
        <p class="album-discovery--name" :title="item.title">{{ item.title }}</p>
        <p class="album-discovery--sub" :title="item.subtitle">{{ item.subtitle }}</p>
      </div>
    </div>

    <p class="album-discovery--tip">点击专辑卡片进入专辑详情，可查看动态数据并订阅</p>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import contentEnhanceService from '@/services/content-enhance.service';

/** 统一卡片模型：5 个列表接口的字段在这里归一 */
interface AlbumCardItem {
  id: number;
  title: string;
  cover: string;
  subtitle: string;
  rank?: number;
}

type TabCode = 'new' | 'newest' | 'list' | 'style' | 'saleboard';

const router = useRouter();

const tabs: { code: TabCode; name: string }[] = [
  { code: 'new', name: '全部新碟' },
  { code: 'newest', name: '最新专辑' },
  { code: 'list', name: '数字专辑' },
  { code: 'style', name: '语种风格馆' },
  { code: 'saleboard', name: '专辑销量榜' },
];

const areaOptions = [
  { name: '全部', value: 'ALL' },
  { name: '华语', value: 'ZH' },
  { name: '欧美', value: 'EA' },
  { name: '韩国', value: 'KR' },
  { name: '日本', value: 'JP' },
];

const styleAreaOptions = [
  { name: '华语', value: 'Z_H' },
  { name: '欧美', value: 'E_A' },
  { name: '韩国', value: 'KR' },
  { name: '日本', value: 'JP' },
];

const periodOptions = [
  { name: '日榜', value: 'daily' },
  { name: '周榜', value: 'week' },
  { name: '总榜', value: 'total' },
];

const activeTab = ref<TabCode>('new');
const activeArea = ref<string>('ALL');
const activePeriod = ref<string>('daily');
const loading = ref<boolean>(false);
const albumList = ref<AlbumCardItem[]>([]);

const showAreaFilter = computed(() => activeTab.value === 'new' || activeTab.value === 'list' || activeTab.value === 'style');
const currentAreaOptions = computed(() => (activeTab.value === 'style' ? styleAreaOptions : areaOptions));

const toCard = (raw: any, source: TabCode): AlbumCardItem => {
  const isProduct = source === 'list' || source === 'style' || source === 'saleboard';
  const id = Number(isProduct ? raw?.albumId : raw?.id) || 0;
  const cover = (isProduct ? raw?.coverUrl : raw?.picUrl) || '';
  const title = (isProduct ? raw?.albumName : raw?.name) || '未知专辑';
  const artist = isProduct ? raw?.artistName : raw?.artist?.name || raw?.artists?.[0]?.name || '';
  const extra = raw?.saleNum ?? raw?.sales;
  const subtitle = source === 'saleboard' ? `${artist} · 销量 ${extra ?? 0}` : artist || '未知歌手';
  return { id, title, cover, subtitle, rank: source === 'saleboard' ? raw?.rank : undefined };
};

/** 每个 tab 对应一个真实接口调用点；地区/周期切换会重新拉取对应接口 */
const loadAlbums = async () => {
  loading.value = true;
  albumList.value = [];
  try {
    let raw: any[] = [];
    switch (activeTab.value) {
      case 'new': {
        const res = await contentEnhanceService.getAlbumNew({ area: activeArea.value, limit: 30 });
        raw = res?.albums || [];
        break;
      }
      case 'newest': {
        const res = await contentEnhanceService.getAlbumNewest();
        raw = res?.albums || [];
        break;
      }
      case 'list': {
        const res = await contentEnhanceService.getAlbumList({ area: activeArea.value, limit: 30 });
        raw = res?.products || [];
        break;
      }
      case 'style': {
        const res = await contentEnhanceService.getAlbumListStyle({ area: activeArea.value, limit: 10 });
        raw = res?.albumProducts || [];
        break;
      }
      case 'saleboard': {
        const res = await contentEnhanceService.getAlbumSongsaleboard({ type: activePeriod.value });
        raw = res?.products || [];
        break;
      }
    }
    albumList.value = raw.map((item) => toCard(item, activeTab.value)).filter((item) => item.id > 0);
  } catch (error) {
    albumList.value = [];
  } finally {
    loading.value = false;
  }
};

const switchTab = (code: TabCode) => {
  if (activeTab.value === code) return;
  activeTab.value = code;
  // 风格馆使用独立的 area 取值（Z_H/E_A/...），切换时重置，避免把 ALL 传给风格接口
  activeArea.value = code === 'style' ? 'Z_H' : 'ALL';
  loadAlbums();
};

const switchArea = (value: string) => {
  if (activeArea.value === value) return;
  activeArea.value = value;
  loadAlbums();
};

const switchPeriod = (value: string) => {
  if (activePeriod.value === value) return;
  activePeriod.value = value;
  loadAlbums();
};

/** 列表 → 详情参数来源：卡片 id 传入 /album_detail?id= */
const linkToAlbum = (id?: number) => {
  if (!id) return;
  router.push({ path: '/album_detail', query: { id: String(id) } });
};

onMounted(() => {
  loadAlbums();
});
</script>

<style scoped lang="less">
.album-discovery {
  width: 1400px;
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
      background: var(--color-primary, #c20c0c);
    }
  }

  &--status {
    margin-top: 32px;
    color: #999;
    font-size: 14px;
  }

  &--grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 24px;
    margin-top: 20px;
  }

  &--card {
    position: relative;
    cursor: pointer;
    transition: transform 0.2s;

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
