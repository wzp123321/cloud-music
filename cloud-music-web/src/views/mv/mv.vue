<template>
  <div class="mv-discovery">
    <cm-navbar :title="'MV'" :has-load-more="false"></cm-navbar>

    <div class="mv-discovery--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['mv-discovery--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </button>
    </div>

    <div v-if="activeTab === 'all'" class="mv-discovery--filters">
      <span class="mv-discovery--filter-label">地区</span>
      <button
        v-for="area in areaOptions"
        :key="area"
        :class="['mv-discovery--filter', activeArea === area ? 'active' : '']"
        @click="switchArea(area)"
      >
        {{ area }}
      </button>
      <span class="mv-discovery--filter-label">排序</span>
      <button
        v-for="order in orderOptions"
        :key="order"
        :class="['mv-discovery--filter', activeOrder === order ? 'active' : '']"
        @click="switchOrder(order)"
      >
        {{ order }}
      </button>
    </div>

    <section class="mv-discovery--section">
      <div v-if="loading" class="mv-discovery--status">加载中…</div>
      <cm-error v-else-if="!mvList.length" :title="'暂无 MV 数据'"></cm-error>
      <div v-else class="mv-discovery--grid">
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
      <div v-else class="mv-discovery--grid">
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
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { formatPlayCount } from '@/core/utils';
import contentEnhanceService, { hasLogin as checkLogin } from '@/apis/content-enhance/content-enhance.service';
import { ContentMvItem } from '@/apis/content-enhance/index.api';

type TabCode = 'all' | 'exclusive' | 'first';

const router = useRouter();

const tabs: { code: TabCode; name: string }[] = [
  { code: 'all', name: '全部 MV' },
  { code: 'exclusive', name: '网易出品' },
  { code: 'first', name: '最新 MV' },
];

const areaOptions = ['全部', '内地', '港台', '欧美', '日本', '韩国'];
const orderOptions = ['上升最快', '最热', '最新'];

const activeTab = ref<TabCode>('all');
const activeArea = ref<string>('全部');
const activeOrder = ref<string>('上升最快');
const loading = ref<boolean>(false);
const hasLogin = checkLogin();
const mvList = ref<ContentMvItem[]>([]);
const subMvList = ref<ContentMvItem[]>([]);

/** 三个 tab 各对应一个真实接口调用点 */
const loadMvList = async () => {
  loading.value = true;
  mvList.value = [];
  try {
    let res;
    switch (activeTab.value) {
      case 'all':
        res = await contentEnhanceService.getMvAll({ area: activeArea.value, order: activeOrder.value, limit: 30 });
        break;
      case 'exclusive':
        res = await contentEnhanceService.getMvExclusiveRcmd({ limit: 30 });
        break;
      case 'first':
        res = await contentEnhanceService.getMvFirst({ limit: 30 });
        break;
    }
    mvList.value = res?.data || [];
  } catch {
    mvList.value = [];
  } finally {
    loading.value = false;
  }
};

/** 收藏列表需登录，未登录不请求，只做降级 */
const loadSubMvList = async () => {
  if (!hasLogin) return;
  try {
    const res = await contentEnhanceService.getMvSublist({ limit: 25 });
    subMvList.value = (res?.data || []) as ContentMvItem[];
  } catch {
    subMvList.value = [];
  }
};

const switchTab = (code: TabCode) => {
  if (activeTab.value === code) return;
  activeTab.value = code;
  loadMvList();
};

const switchArea = (area: string) => {
  if (activeArea.value === area) return;
  activeArea.value = area;
  loadMvList();
};

const switchOrder = (order: string) => {
  if (activeOrder.value === order) return;
  activeOrder.value = order;
  loadMvList();
};

/** 列表 → 播放页参数来源：data[].id 传入 /mvplay?mvid= */
const linkToMv = (id?: number) => {
  if (!id) return;
  router.push({ path: '/mvplay', query: { mvid: String(id) } });
};

onMounted(() => {
  loadMvList();
  loadSubMvList();
});
</script>

<style scoped lang="less">
.mv-discovery {
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
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
