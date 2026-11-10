<template>
  <section class="up-record">
    <div class="up-record-head">
      <div class="up-block-title">听歌排行</div>
      <div class="up-record-switch">
        <span :class="{ active: type === 1 }" @click="onSwitch(1)">最近一周</span>
        <span :class="{ active: type === 0 }" @click="onSwitch(0)">全部</span>
      </div>
    </div>

    <div v-if="list.length" class="up-record-list">
      <div v-for="(item, index) in list" :key="item.song?.id || index" class="up-record-item">
        <span class="up-rank">{{ index + 1 }}</span>
        <img class="up-rec-cover" :src="item.song?.al?.picUrl || item.song?.album?.picUrl" alt="" />
        <div class="up-rec-info">
          <div class="up-rec-name">{{ item.song?.name }}</div>
          <div class="up-rec-artist">{{ (item.song?.ar || item.song?.artists || [])?.map((a: any) => a.name).join('/') }}</div>
        </div>
        <span class="up-rec-count">播放 {{ item.playCount }}</span>
      </div>
    </div>
    <div v-else class="up-empty">暂无听歌记录</div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { UC_IRecord } from '@/services/user.api';

const props = defineProps<{
  record: UC_IRecord;
  type: number;
}>();

const emit = defineEmits<{
  (e: 'switch', value: number): void;
}>();

const list = computed(() => (props.type === 1 ? props.record?.weekData : props.record?.allData) || []);

const onSwitch = (t: number) => {
  emit('switch', t);
};
</script>

<style scoped lang="less">
.up-record {
  margin-top: 24px;

  .up-record-head {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .up-block-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .up-record-switch {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #999;

      span {
        cursor: pointer;

        &.active {
          color: #c20c0c;
          font-weight: 600;
        }
      }
    }
  }

  .up-record-list {
    margin-top: 12px;
  }

  .up-record-item {
    display: flex;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #f5f5f5;

    .up-rank {
      width: 28px;
      text-align: center;
      color: #c20c0c;
      font-weight: 600;
    }

    .up-rec-cover {
      width: 44px;
      height: 44px;
      border-radius: 4px;
      object-fit: cover;
      margin-left: 8px;
    }

    .up-rec-info {
      margin-left: 12px;
      flex: 1;

      .up-rec-name {
        font-size: 14px;
        color: #333;
      }

      .up-rec-artist {
        margin-top: 4px;
        font-size: 12px;
        color: #999;
      }
    }

    .up-rec-count {
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
