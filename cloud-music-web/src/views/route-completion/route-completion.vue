<template>
  <div class="route-completion">
    <cm-navbar :title="'路由补齐：专辑与歌手详情'" :has-load-more="false"></cm-navbar>

    <p class="route-completion--intro">
      server 侧 309 个接口中最后两个独立详情接口。两者与详情页已用的 <code>/album</code>、<code>/artists</code>
      不是同一上游： <code>/album/detail</code> 是数字专辑详情（需数字专辑 id），<code>/artist/detail</code>
      返回歌手头部信息。 左侧列表由上游接口提供 id，点击后按该 id 请求详情。
    </p>

    <div class="route-completion--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['route-completion--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </button>
    </div>

    <div class="route-completion--layout">
      <section class="route-completion--panel">
        <h4 class="route-completion--heading">
          上游列表 · {{ activeTab === 'album' ? '/album/list' : '/artist/list' }}
        </h4>
        <p v-if="loadingList" class="route-completion--status">加载中…</p>
        <p v-else-if="!sourceList.length" class="route-completion--status">暂无上游数据</p>
        <div v-else class="route-completion--source-list">
          <div
            v-for="item in sourceList"
            :key="item.id"
            :class="['route-completion--source-item', activeId === item.id ? 'active' : '']"
            @click="queryDetail(item)"
          >
            <span class="route-completion--source-name">{{ item.name }}</span>
            <span class="route-completion--source-id">id: {{ item.id }}</span>
          </div>
        </div>
      </section>

      <section class="route-completion--panel">
        <h4 class="route-completion--heading">
          详情响应 · {{ activeTab === 'album' ? 'album_detail（/album/detail）' : 'artist_detail（/artist/detail）' }}
        </h4>
        <p v-if="loadingDetail" class="route-completion--status">请求中…</p>
        <pre v-else class="route-completion--detail">{{ detailText }}</pre>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { getRequest } from '@/apis/request';
import contentEnhanceService from '@/apis/content-enhance.service';

type TabCode = 'album' | 'artist';

interface SourceItem {
  id: number | string;
  name: string;
}

const tabs: { code: TabCode; name: string }[] = [
  { code: 'album', name: '数字专辑详情' },
  { code: 'artist', name: '歌手详情' },
];

const activeTab = ref<TabCode>('album');
const activeId = ref<number | string>('');
const sourceList = ref<SourceItem[]>([]);
const loadingList = ref(false);
const loadingDetail = ref(false);
const detailText = ref('点击左侧列表项，用返回的 id 请求详情接口。');

const loadSourceList = async () => {
  loadingList.value = true;
  sourceList.value = [];
  activeId.value = '';
  detailText.value = '点击左侧列表项，用返回的 id 请求详情接口。';
  try {
    if (activeTab.value === 'album') {
      const res: any = await getRequest('/album/list', { area: 'ALL', limit: 20, offset: 0 });
      const rows: any[] = res?.products || res?.albums || res?.data || [];
      sourceList.value = rows
        .filter((item) => item.albumId != null || item.id != null)
        .map((item) => ({
          id: item.albumId ?? item.id,
          name: item.albumName || item.name || '未命名专辑',
        }));
    } else {
      const res: any = await getRequest('/artist/list', { type: 1, area: -1, limit: 20, offset: 0 });
      const rows: any[] = res?.artists || res?.data || [];
      sourceList.value = rows
        .filter((item) => item.id != null)
        .map((item) => ({ id: item.id, name: item.name || '未命名歌手' }));
    }
  } catch {
    detailText.value = '上游列表请求失败，请检查 server 19830 是否在线。';
  } finally {
    loadingList.value = false;
  }
};

const queryDetail = async (item: SourceItem) => {
  activeId.value = item.id;
  loadingDetail.value = true;
  try {
    const res: any =
      activeTab.value === 'album'
        ? await contentEnhanceService.getAlbumDetailExtra({ id: item.id })
        : await contentEnhanceService.getArtistDetailExtra({ id: item.id });
    detailText.value = JSON.stringify(res, null, 2).slice(0, 4000);
  } catch {
    detailText.value = '详情请求失败，请确认该 id 是否为有效资源。';
  } finally {
    loadingDetail.value = false;
  }
};

const switchTab = (code: TabCode) => {
  if (activeTab.value === code) return;
  activeTab.value = code;
  loadSourceList();
};

onMounted(() => {
  loadSourceList();
});
</script>

<style scoped lang="less">
.route-completion {
  width: 1400px;
  margin: 0 auto;
  padding-bottom: 60px;

  &--intro {
    margin: 20px 0;
    padding: 14px 18px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.03);
    font-size: 13px;
    line-height: 22px;
    color: #666;

    code {
      padding: 1px 5px;
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.06);
      font-size: 12px;
      color: var(--color-primary, #c20c0c);
    }
  }

  &--tabs {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }

  &--tab {
    padding: 8px 22px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 20px;
    background: #fff;
    font-size: 14px;
    color: #555;
    cursor: pointer;

    &.active {
      border-color: var(--color-primary, #c20c0c);
      background: var(--color-primary, #c20c0c);
      color: #fff;
    }
  }

  &--layout {
    display: grid;
    grid-template-columns: 460px 1fr;
    gap: 20px;
  }

  &--panel {
    min-height: 420px;
    padding: 18px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 10px;
    background: #fff;
  }

  &--heading {
    margin-bottom: 14px;
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }

  &--status {
    padding: 24px 0;
    text-align: center;
    font-size: 13px;
    color: #999;
  }

  &--source-list {
    max-height: 520px;
    overflow-y: auto;
  }

  &--source-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    &.active {
      background: rgba(194, 12, 12, 0.08);
    }
  }

  &--source-name {
    overflow: hidden;
    font-size: 13px;
    color: #333;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &--source-id {
    flex-shrink: 0;
    margin-left: 12px;
    font-size: 12px;
    color: #aaa;
  }

  &--detail {
    max-height: 520px;
    overflow: auto;
    padding: 14px;
    border-radius: 6px;
    background: #f7f7f8;
    font-size: 12px;
    line-height: 19px;
    color: #444;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
