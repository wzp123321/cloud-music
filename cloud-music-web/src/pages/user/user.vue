<template>
  <div class="user" id="user">
    <cm-loading v-if="userCenterService.loading"></cm-loading>
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
import { ref, computed, onMounted } from 'vue';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import userCenterService from './user.service';
import { UC_IUserDetail, UC_IPlaylist, UC_IUserLevel, UC_IUserSubcount, UC_IRecord } from '@/services/user.api';
import { FGetCookie } from '@/core/token';

import UserProfile from './components/user-profile.vue';
import UserPlaylists from './components/user-playlists.vue';
import UserLevel from './components/user-level.vue';
import UserRecord from './components/user-record.vue';
import UserFollows from './components/user-follows.vue';
import UserEvent from './components/user-event.vue';
import UserCloud from './components/user-cloud.vue';
import UserEditDialog from './components/user-edit-dialog.vue';

const destroy$ = new Subject<void>();

const detail = ref<UC_IUserDetail>({ profile: {} as any });
const playlists = ref<UC_IPlaylist[]>([]);
const level = ref<UC_IUserLevel>({ level: 0, progress: 0 });
const subcount = ref<UC_IUserSubcount>({
  programCount: 0,
  djRadioCount: 0,
  mvCount: 0,
  artistCount: 0,
  newProgramCount: 0,
  createDjRadioCount: 0,
  createdPlaylistCount: 0,
  subPlaylistCount: 0,
});
const record = ref<UC_IRecord>({ allData: [], weekData: [] });

const uid = ref(0);
const recordType = ref(1);
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
  const cookie = FGetCookie('cloud-userInfo');
  try {
    const id = cookie ? JSON.parse(cookie)?.profile?.userId : undefined;
    return !!id && id === uid.value;
  } catch {
    return false;
  }
});

const goTab = (key: string) => {
  if (key === 'event' || key === 'follow' || key === 'cloud' || key === 'record' || key === 'home') {
    activeTab.value = key as any;
  }
};

const onRecordSwitch = (t: number) => {
  recordType.value = t;
  userCenterService.reloadRecord(t);
};

const onSaved = () => {
  userCenterService.loadAll();
};

const goLogin = () => {
  import('@/views/header/header-loginform/header-loginform.service').then((m) => m.default.show());
};

onMounted(() => {
  userCenterService.userDetail$.pipe(takeUntil(destroy$)).subscribe((v) => (detail.value = v));
  userCenterService.playlists$.pipe(takeUntil(destroy$)).subscribe((v) => (playlists.value = v));
  userCenterService.level$.pipe(takeUntil(destroy$)).subscribe((v) => (level.value = v));
  userCenterService.subcount$.pipe(takeUntil(destroy$)).subscribe((v) => (subcount.value = v));
  userCenterService.record$.pipe(takeUntil(destroy$)).subscribe((v) => (record.value = v));

  // 重新读取路由 uid（单例已创建，这里刷新一次）
  userCenterService.init();
  uid.value = userCenterService.uid;
});
</script>

<style scoped lang="less">
.user {
  width: 100%;
  min-height: 400px;

  .user-empty {
    padding: 120px 0;
    text-align: center;
    color: #999;
    font-size: 15px;

    .user-link {
      color: #c20c0c;
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
      color: #666;
      padding-bottom: 12px;

      &.active {
        color: #c20c0c;
        font-weight: 600;
        border-bottom: 2px solid #c20c0c;
      }
    }
  }
}
</style>
