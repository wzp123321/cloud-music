<template>
  <div class="cm-simi">
    <div class="cms-header">
      <h5>{{ title || SIMI_TITLE[type] }}</h5>
      <span v-if="loading" class="cms-more">加载中...</span>
    </div>

    <div class="cms-list">
      <div
        v-for="item in list"
        :key="item.id"
        class="cms-item"
        @click="onItemClick(item)"
      >
        <cm-image :src="item.cover" alt="" loading="lazy" />
        <div class="cms-info">
          <p class="name" :title="item.name">{{ item.name }}</p>
          <p class="cm-simi--subtitle" :title="item.subtitle">{{ item.subtitle }}</p>
        </div>
      </div>
    </div>

    <div v-if="!loading && !list.length" class="cms-empty">暂无相关推荐</div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, PropType } from 'vue';
import { useRouter } from 'vue-router';
import {
  CM_SimiType,
  CM_SimiItem,
  SIMI_TITLE,
  fetchSimi,
  normalizeSimi,
} from './cm-simi.api';

const props = defineProps({
  /** 相似推荐类型：song / playlist / artist / mv / user */
  type: {
    type: String as PropType<CM_SimiType>,
    default: 'song',
  },
  /** 资源 id（song/playlist/user 传歌曲 id，artist 传歌手 id，mv 传 mvid） */
  id: {
    type: [Number, String] as PropType<number | string>,
    default: undefined,
  },
  /** 自定义标题（默认按 type 取） */
  title: {
    type: String,
    default: '',
  },
  /** 展示条数 */
  limit: {
    type: Number,
    default: 6,
  },
});

/** 点击后跳转的详情页路由与 query key */
const SIMI_ROUTE: Record<CM_SimiType, { path: string; key: string }> = {
  song: { path: '/music_detail', key: 'id' },
  playlist: { path: '/playlist_detail', key: 'id' },
  artist: { path: '/artist_detail', key: 'id' },
  mv: { path: '/mvplay', key: 'mvid' },
  user: { path: '/user', key: 'uid' },
};

const router = useRouter();
const list = ref<CM_SimiItem[]>([]);
const loading = ref(false);

const load = async () => {
  if (
    props.id === undefined ||
    props.id === null ||
    props.id === '' ||
    Number(props.id) <= 0
  ) {
    return;
  }
  loading.value = true;
  try {
    const res = await fetchSimi(props.type, props.id);
    list.value = normalizeSimi(props.type, res).slice(0, props.limit);
  } catch {
    list.value = [];
  } finally {
    loading.value = false;
  }
}

const onItemClick = (item: CM_SimiItem) => {
  const route = SIMI_ROUTE[props.type];
  if (!route || !router) return;
  router.push({ path: route.path, query: { [route.key]: String(item.id) } });
};

onMounted(load);
watch([() => props.type, () => props.id], load);
</script>

<style scoped lang="less">
.cm-simi {
  margin-top: 36px;

  .cms-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-text-divider);

    h5 {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-text);
    }

    .cms-more {
      font-size: 12px;
      color: var(--color-text-secondary);
    }
  }

  .cms-list {
    display: flex;
    flex-direction: column;
  }

  .cms-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--color-text-divider);
    cursor: pointer;

    img {
      width: 48px;
      height: 48px;
      border-radius: 6px;
      object-fit: cover;
      background: rgba(0, 0, 0, 0.05);
    }

    .cms-info {
      flex: 1 1 auto;
      overflow: hidden;

      p {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .name {
        font-size: 14px;
        color: var(--color-text);
      }

      .cm-simi--subtitle {
        font-size: 12px;
        color: var(--color-text-secondary);
        margin-top: 4px;
      }
    }
  }

  .cms-empty {
    font-size: 13px;
    color: var(--color-text-secondary);
    padding: 12px 0;
  }
}
</style>
