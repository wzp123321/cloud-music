<template>
  <section v-if="subscribers.length" class="pd-subscribers">
    <div class="pd-subscribers-header">
      <h5>订阅者</h5>
      <span>{{ subscribers.length }}人</span>
    </div>
    <ul class="pd-subscribers-list">
      <li v-for="item in subscribers" :key="item.id" class="pd-subscribers-item">
        <cm-image class="pd-subscribers-avatar" :src="item.avatarUrl" :alt="item.nickname" />
        <span class="pd-subscribers-name">{{ item.nickname }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { SubscriberVO } from '../api/playlist-social.api';

defineProps<{
  subscribers: SubscriberVO[];
}>();
</script>

<style scoped lang="less">
.pd-subscribers {
  margin-top: 32px;

  &-header {
    display: flex;
    align-items: flex-end;

    h5 {
      font-size: 22px;
      line-height: 30px;
      font-weight: 600;
      color: var(--color-text);
    }

    span {
      margin-left: 8px;
      font-weight: 300;
      font-size: 14px;
      color: var(--color-text-secondary);
    }
  }

  &-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 16px;
    margin-top: 12px;
  }

  &-item {
    display: flex;
    align-items: center;
    max-width: 180px;
  }

  &-avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  &-name {
    margin-left: 8px;
    font-size: 13px;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
