<template>
  <section class="up-event">
    <div class="up-block-title">我的动态</div>
    <div v-if="events.length" class="up-event-list">
      <div v-for="ev in events" :key="ev.id" class="up-event-item">
        <el-avatar :size="40" :src="ev.user?.avatarUrl" />
        <div class="up-event-body">
          <div class="up-event-user">{{ ev.user?.nickname }}</div>
          <div class="up-event-msg">{{ ev.msg }}</div>
          <div class="up-event-time">{{ formatTime(ev?.eventTime) }}</div>
        </div>
      </div>
    </div>
    <div v-else class="up-empty">暂无动态</div>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import { useUserCenter } from '../user.service';
import { UC_IEvent } from '@/apis/user.api';

const userCenterService = useUserCenter();

const events = ref<UC_IEvent[]>([]);

const formatTime = (t?: number) => {
  if (!t) return '';
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 订阅动态状态，immediate 保证首屏同步到当前值
watch(userCenterService.event$, (v) => (events.value = v), { immediate: true });

onMounted(() => {
  userCenterService.loadEvent();
});
</script>

<style scoped lang="less">
.up-event {
  margin-top: 24px;

  .up-block-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
  }

  .up-event-item {
    display: flex;
    align-items: flex-start;
    padding: 14px 0;
    border-bottom: 1px solid #f5f5f5;

    .up-event-body {
      margin-left: 12px;
      flex: 1;

      .up-event-user {
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }

      .up-event-msg {
        margin-top: 6px;
        font-size: 13px;
        color: #555;
        line-height: 20px;
        white-space: pre-wrap;
      }

      .up-event-time {
        margin-top: 6px;
        font-size: 12px;
        color: #bbb;
      }
    }
  }

  .up-empty {
    padding: 40px 0;
    text-align: center;
    color: #999;
  }
}
</style>
