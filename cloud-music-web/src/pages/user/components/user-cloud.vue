<template>
  <section class="up-cloud">
    <div class="up-block-title">我的云盘（{{ cloud.count || list.length }}）</div>
    <div class="up-cloud-list" v-if="list.length">
      <div class="up-cloud-item" v-for="item in list" :key="item.songId">
        <div class="up-cloud-info">
          <div class="up-cloud-name">{{ item.songName }}</div>
          <div class="up-cloud-artist">{{ item.artist }} - {{ item.album }}</div>
        </div>
        <span class="up-cloud-size">{{ formatSize(item.fileSize) }}</span>
      </div>
    </div>
    <div class="up-empty" v-else>云盘暂无文件</div>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import userCenterService from '../user.service';
import { UC_ICloudItem } from '@/services/user.api';

const list = ref<UC_ICloudItem[]>([]);
const cloud = ref<{ list: UC_ICloudItem[]; count: number }>({ list: [], count: 0 });
const destroy$ = new Subject<void>();

const formatSize = (size?: number) => {
  if (!size) return '';
  return size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)}MB` : `${(size / 1024).toFixed(0)}KB`;
};

onMounted(() => {
  userCenterService.cloud$.pipe(takeUntil(destroy$)).subscribe((v) => {
    cloud.value = v;
    list.value = v.list;
  });
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
