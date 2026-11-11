<template>
  <section class="up-level">
    <div class="up-level-card">
      <div class="up-level-num">
        <span class="up-lv">Lv.{{ level?.level || 0 }}</span>
        <span class="up-lv-tip">当前等级</span>
      </div>
      <div class="up-level-progress">
        <div class="up-progress-bar">
          <div class="up-progress-inner" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="up-progress-text">
          距离升级还需 {{ level?.progress || 0 }} 点经验（{{ level?.nowPlayCount || 0 }}/{{ level?.nextPlayCount || 0 }}）
        </div>
      </div>
    </div>

    <div class="up-subcount">
      <div v-for="item in subItems" :key="item.label" class="up-sub-item">
        <div class="up-sub-num">{{ item.value }}</div>
        <div class="up-sub-label">{{ item.label }}</div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { UC_IUserLevel, UC_IUserSubcount } from '@/apis/user/user.api';

const props = defineProps<{
  level: UC_IUserLevel;
  subcount: UC_IUserSubcount;
}>();

const progressPercent = computed(() => {
  const lv = props.level;
  if (!lv?.nextPlayCount) return 0;
  const pct = ((lv.nowPlayCount || 0) / lv.nextPlayCount) * 100;
  return Math.min(100, Math.round(pct));
});

const subItems = computed(() => {
  const s = props.subcount;
  return [
    { label: '创建的歌单', value: s?.createdPlaylistCount || 0 },
    { label: '收藏的歌单', value: s?.subPlaylistCount || 0 },
    { label: '关注歌手', value: s?.artistCount || 0 },
    { label: 'MV', value: s?.mvCount || 0 },
    { label: '电台', value: s?.djRadioCount || 0 },
  ];
});
</script>

<style scoped lang="less">
.up-level {
  margin-top: 24px;

  .up-level-card {
    display: flex;
    align-items: center;
    padding: 24px;
    background: linear-gradient(135deg, #2b2b2b, #4a4a4a);
    border-radius: 8px;
    color: #fff;

    .up-level-num {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 120px;

      .up-lv {
        font-size: 32px;
        font-weight: 700;
      }

      .up-lv-tip {
        font-size: 12px;
        opacity: 0.7;
        margin-top: 4px;
      }
    }

    .up-level-progress {
      flex: 1;
      margin-left: 24px;

      .up-progress-bar {
        height: 8px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.2);

        .up-progress-inner {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, #ff6a6a, #c20c0c);
        }
      }

      .up-progress-text {
        margin-top: 10px;
        font-size: 12px;
        opacity: 0.85;
      }
    }
  }

  .up-subcount {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
    margin-top: 16px;

    .up-sub-item {
      text-align: center;
      padding: 16px 0;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

      .up-sub-num {
        font-size: 20px;
        font-weight: 600;
        color: #333;
      }

      .up-sub-label {
        margin-top: 4px;
        font-size: 12px;
        color: #999;
      }
    }
  }
}
</style>
