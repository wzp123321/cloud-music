<template>
  <div id="user" class="user">
    <cm-loading v-if="loading"></cm-loading>
    <div v-else-if="!uid" class="user-empty">
      <p>请先 <span class="user-link" @click="goLogin">登录</span> 后查看个人中心</p>
    </div>
    <div v-else class="user-main">
      <div class="user-tabs">
        <span
          v-for="t in tabs"
          :key="t.key"
          :class="{ active: activeTab === t.key }"
          @click="activeTab = t.key"
          >{{ t.label }}</span
        >
      </div>

      <!-- 主页：资料 + 歌单 + 等级 -->
      <div v-show="activeTab === 'home'">
        <user-profile
          :detail="detail"
          :can-edit="canEdit"
          @edit="editVisible = true"
          @tab="goTab"
        />
        <user-playlists :playlists="playlists" />
        <user-level :level="level" :subcount="subcount" />
      </div>

      <!-- 听歌排行 -->
      <user-record
        v-show="activeTab === 'record'"
        :record="record"
        :type="recordType"
        @switch="onRecordSwitch"
      />

      <!-- 关注 / 粉丝 -->
      <user-follows v-show="activeTab === 'follow'" />

      <!-- 动态 -->
      <user-event v-show="activeTab === 'event'" />

      <!-- 云盘 -->
      <user-cloud v-show="activeTab === 'cloud'" />
    </div>

    <user-edit-dialog v-model:visible="editVisible" :detail="detail" @saved="onSaved" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import type { ApiRawResponse } from '@/apis/types';

import { useUserCenter } from './hooks/useUserCenter';
import { UC_UserDetail, UC_Playlist, UC_UserLevel, UC_UserSubcount, UC_Record } from '@/apis/user/user.api';
import { useUserStore } from '@/store/user';

import UserProfile from './components/user-profile.vue';
import UserPlaylists from './components/user-playlists.vue';
import UserLevel from './components/user-level.vue';
import UserRecord from './components/user-record.vue';
import UserFollows from './components/user-follows.vue';
import UserEvent from './components/user-event.vue';
import UserCloud from './components/user-cloud.vue';
import UserEditDialog from './components/user-edit-dialog.vue';

const { uid, loading, recordType, reloadRecord, loadAll, init, userDetail$, playlists$, level$, subcount$, record$ } = useUserCenter();

const detail = ref<UC_UserDetail>({ profile: {} as ApiRawResponse });
const playlists = ref<UC_Playlist[]>([]);
const level = ref<UC_UserLevel>({ level: 0, progress: 0 });
const subcount = ref<UC_UserSubcount>({
  programCount: 0,
  djRadioCount: 0,
  mvCount: 0,
  artistCount: 0,
  newProgramCount: 0,
  createDjRadioCount: 0,
  createdPlaylistCount: 0,
  subPlaylistCount: 0,
});
const record = ref<UC_Record>({ allData: [], weekData: [] });

const editVisible = ref(false);
const activeTab = ref<'home' | 'record' | 'follow' | 'event' | 'cloud'>('home');

const tabs = [
  { key: 'home', label: '主页' },
  { key: 'record', label: '听歌排行' },
  { key: 'follow', label: '关注' },
  { key: 'event', label: '动态' },
  { key: 'cloud', label: '云盘' },
] as const;

const canEdit = computed(() => {
  const id = useUserStore().profile?.userId;
  return !!id && id === uid.value;
});

const goTab = (key: string) => {
  if (key === 'event' || key === 'follow' || key === 'cloud' || key === 'record' || key === 'home') {
    activeTab.value = key as ApiRawResponse;
  }
};

const onRecordSwitch = (t: number) => {
  recordType.value = t;
  reloadRecord(t);
};

const onSaved = () => {
  loadAll();
};

const goLogin = () => {
  import('@/views/header/header-loginform/hooks/useLogin').then((m) => m.useLogin().show());
};

// 订阅用户中心各状态，immediate 保证首屏同步到当前值
watch(userDetail$, (v) => (detail.value = v), { immediate: true });
watch(playlists$, (v) => (playlists.value = v), { immediate: true });
watch(level$, (v) => (level.value = v), { immediate: true });
watch(subcount$, (v) => (subcount.value = v), { immediate: true });
watch(record$, (v) => (record.value = v), { immediate: true });

onMounted(() => {
  // 重新读取路由 uid（单例已创建，这里刷新一次）
  init();
});
</script>

<style scoped lang="less">
.user {
  width: 100%;
  min-height: 400px;

  .user-empty {
    padding: 120px 0;
    text-align: center;
    color: var(--color-text-secondary);
    font-size: 15px;

    .user-link {
      color: var(--color-primary);
      cursor: pointer;
    }
  }

  .user-main {
    padding-top: 24px;
  }

  .user-tabs {
    display: flex;
    gap: 32px;
    border-bottom: 1px solid #eee;
    margin-bottom: 24px;

    span {
      cursor: pointer;
      font-size: 16px;
      color: var(--color-text-secondary);
      padding-bottom: 12px;

      &.active {
        color: var(--color-primary);
        font-weight: 600;
        border-bottom: 2px solid var(--color-primary);
      }
    }
  }
}
</style>
