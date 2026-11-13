<template>
  <section class="up-cloud">
    <div class="up-block-title">我的云盘（{{ cloud.count || list.length }}）</div>
    <div v-if="list.length" class="up-cloud-list">
      <div v-for="item in list" :key="item.songId" class="up-cloud-item">
        <div class="up-cloud-info">
          <div class="up-cloud-name">{{ item.songName }}</div>
          <div class="up-cloud-artist">{{ item.artist }} - {{ item.album }}</div>
        </div>
        <span class="up-cloud-size">{{ formatSize(item.fileSize) }}</span>
      </div>
    </div>
    <div v-else class="up-empty">云盘暂无文件</div>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import { useUserCenter } from '../hooks/useUserCenter';
import { UC_CloudItem } from '@/apis/user/user.api';

const userCenterService = useUserCenter();

const list = ref<UC_CloudItem[]>([]);
const cloud = ref<{ list: UC_CloudItem[]; count: number }>({ list: [], count: 0 });

const formatSize = (size?: number) => {
  if (!size) return '';
  return size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)}MB` : `${(size / 1024).toFixed(0)}KB`;
};

// 订阅云盘状态，immediate 保证首屏同步到当前值
watch(
  userCenterService.cloud$,
  (v) => {
    cloud.value = v;
    list.value = v.list;
  },
  { immediate: true },
);

onMounted(() => {
  userCenterService.loadCloud();
});
</script>

<style scoped lang="less">
.up-cloud {
  margin-top: 24px;

  .up-block-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
  }

  .up-cloud-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;

    .up-cloud-info {
      flex: 1;

      .up-cloud-name {
        font-size: 14px;
        color: #333;
      }

      .up-cloud-artist {
        margin-top: 4px;
        font-size: 12px;
        color: #999;
      }
    }

    .up-cloud-size {
      font-size: 12px;
      color: #bbb;
    }
  }

  .up-empty {
    padding: 40px 0;
    text-align: center;
    color: #999;
  }
}
</style>
