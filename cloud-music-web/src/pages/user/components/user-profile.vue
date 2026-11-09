<template>
  <section class="up-profile">
    <div class="up-cover">
      <img v-if="detail?.profile?.backgroundUrl" :src="detail.profile.backgroundUrl" class="up-bg" alt="" />
    </div>
    <div class="up-main">
      <el-avatar :size="96" :src="detail?.profile?.avatarUrl" />
      <div class="up-info">
        <div class="up-name">
          <span class="up-nick">{{ detail?.profile?.nickname || '未知用户' }}</span>
          <el-tag v-if="detail?.profile?.vipType" size="small" effect="dark" type="danger">VIP</el-tag>
          <el-button v-if="canEdit" size="small" class="up-edit" @click="$emit('edit')">编辑资料</el-button>
        </div>
        <div class="up-sign">{{ detail?.profile?.signature || '这个人很懒，什么都没留下' }}</div>
        <div class="up-stats">
          <span @click="$emit('tab', 'event')">动态 {{ (detail?.profile as any)?.eventCount || 0 }}</span>
          <span @click="$emit('tab', 'follow')">关注 {{ (detail?.profile as any)?.follows || 0 }}</span>
          <span @click="$emit('tab', 'follow')">粉丝 {{ (detail?.profile as any)?.followeds || 0 }}</span>
          <span>听歌 {{ detail?.listenSongs || 0 }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { UC_IUserDetail } from '@/services/user.api';

defineProps<{
  detail: UC_IUserDetail;
  canEdit: boolean;
}>();

defineEmits<{
  (e: 'edit'): void;
  (e: 'tab', value: string): void;
}>();
</script>

<style scoped lang="less">
.up-profile {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

  .up-cover {
    width: 100%;
    height: 160px;
    background: linear-gradient(135deg, #c20c0c, #ff6a6a);

    .up-bg {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .up-main {
    display: flex;
    align-items: center;
    padding: 16px 24px 24px;
    margin-top: -48px;

    :deep(.el-avatar) {
      border: 4px solid #fff;
      background: #eee;
    }

    .up-info {
      margin-left: 20px;
      flex: 1;

      .up-name {
        display: flex;
        align-items: center;

        .up-nick {
          font-size: 22px;
          font-weight: 600;
          color: #333;
        }

        .el-tag {
          margin-left: 10px;
        }

        .up-edit {
          margin-left: auto;
        }
      }

      .up-sign {
        margin-top: 8px;
        font-size: 13px;
        color: #888;
      }

      .up-stats {
        margin-top: 14px;
        display: flex;
        gap: 24px;
        font-size: 13px;
        color: #666;

        span {
          cursor: pointer;

          &:hover {
            color: #c20c0c;
          }
        }
      }
    }
  }
}
</style>
