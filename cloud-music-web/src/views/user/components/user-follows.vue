<template>
  <section class="up-follows">
    <div class="up-tabs">
      <span :class="{ active: tab === 'follows' }" @click="switchTab('follows')">关注</span>
      <span :class="{ active: tab === 'followeds' }" @click="switchTab('followeds')">粉丝</span>
    </div>

    <div v-if="list.length" class="up-list">
      <div v-for="u in list" :key="u.userId" class="up-item">
        <el-avatar :size="48" :src="u.avatarUrl" />
        <div class="up-item-info">
          <div class="up-item-name">{{ u.nickname }}</div>
          <div class="up-item-sign">{{ u.signature || '暂无签名' }}</div>
        </div>
        <el-button
          v-if="u.userId !== ownerUid"
          size="small"
          :type="u.followed ? 'info' : 'danger'"
          plain
          @click="onToggle(u)"
        >
          {{ u.followed ? '已关注' : '关注' }}
        </el-button>
      </div>
    </div>
    <div v-else class="up-empty">暂无数据</div>
  </section>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { useUserCenter } from '../hooks/useUserCenter';

const userCenterService = useUserCenter();
import { UC_FollowUser } from '@/apis/user/user.api';

const tab = ref<'follows' | 'followeds'>('follows');
const ownerUid = ref<number>(0);

const follows = computed(() => userCenterService.followsValue);
const followeds = computed(() => userCenterService.followedsValue);
const list = computed<UC_FollowUser[]>(() => (tab.value === 'follows' ? follows.value : followeds.value));

const switchTab = (t: 'follows' | 'followeds') => {
  tab.value = t;
  if (t === 'follows') userCenterService.loadFollows();
  else userCenterService.loadFolloweds();
};

const onToggle = (u: UC_FollowUser) => {
  userCenterService.toggleFollow(u.userId, u.followed);
};

onMounted(() => {
  ownerUid.value = useUserStore().profile?.userId ?? 0;
  userCenterService.loadFollows();
});
</script>

<style scoped lang="less">
.up-follows {
  .up-tabs {
    display: flex;
    gap: 28px;
    border-bottom: 1px solid #eee;
    margin-bottom: 16px;

    span {
      cursor: pointer;
      font-size: 15px;
      color: #666;
      padding-bottom: 10px;

      &.active {
        color: #c20c0c;
        font-weight: 600;
        border-bottom: 2px solid #c20c0c;
      }
    }
  }

  .up-list {
    display: flex;
    flex-direction: column;
  }

  .up-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;

    .up-item-info {
      margin-left: 14px;
      flex: 1;

      .up-item-name {
        font-size: 14px;
        color: #333;
      }

      .up-item-sign {
        margin-top: 4px;
        font-size: 12px;
        color: #999;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 480px;
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
