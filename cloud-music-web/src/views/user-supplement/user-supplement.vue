<template>
  <div class="user-supplement">
    <cm-navbar title="用户资料 · 云盘 · 歌单编辑" :has-load-more="false"></cm-navbar>

    <div v-if="!hasLogin" class="user-supplement--loginbar">
      当前未登录：<code>user_account</code> / <code>user_audio</code> / <code>user_dj</code> /
      <code>user_comment_history</code> 读取型接口已降级；全部写操作不可用
    </div>
    <div v-if="toast" class="user-supplement--toast" @click="clearToast">{{ toast }}（点击关闭）</div>

    <!-- 三个面板按接口清单分组，切换即挂载，各自持有自己的表单与结果态 -->
    <div class="user-supplement--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['user-supplement--tab', activeTab === tab.code ? 'active' : '']"
        @click="activeTab = tab.code"
      >
        {{ tab.name }}
      </button>
    </div>

    <supplement-read-panel
      v-if="activeTab === 'c6_1'"
      :has-login="hasLogin"
      :uid="uid"
      @toast="showToast"
    ></supplement-read-panel>

    <supplement-cloud-panel
      v-if="activeTab === 'c6_2'"
      :has-login="hasLogin"
      @toast="showToast"
    ></supplement-cloud-panel>

    <supplement-playlist-panel
      v-if="activeTab === 'c6_3'"
      v-model:uid="uid"
      :has-login="hasLogin"
      @toast="showToast"
    ></supplement-playlist-panel>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { FGetCookie } from '@/core/token';
import { hasLogin as checkLogin } from '@/apis/content-enhance/content-enhance.service';

import SupplementReadPanel from './components/supplement-read-panel.vue';
import SupplementCloudPanel from './components/supplement-cloud-panel.vue';
import SupplementPlaylistPanel from './components/supplement-playlist-panel.vue';

/** 与 api-inventory-plain.md「P1 用户与歌单补充」6.1~6.3 一一对应 */
const tabs = [
  { code: 'c6_1', name: '6.1 用户补充（5）' },
  { code: 'c6_2', name: '6.2 云盘（2）' },
  { code: 'c6_3', name: '6.3 歌单编辑（9）' },
];

/** 从 cookie 里取当前登录 uid，取不到留空由用户手填 */
const resolveUid = (): number => {
  try {
    const raw = FGetCookie('cloud-userInfo');
    return raw ? (JSON.parse(raw)?.profile?.userId ?? 0) : 0;
  } catch {
    return 0;
  }
};

const hasLogin = ref<boolean>(checkLogin());
const activeTab = ref<string>('c6_1');
const toast = ref<string>('');
const uid = ref<string>(String(resolveUid() || ''));

/** 子面板的提示统一在页面顶部展示，避免每个面板各写一份 */
const showToast = (message: string) => {
  toast.value = message;
};

const clearToast = () => {
  toast.value = '';
};
</script>

<style lang="less">
@import './user-supplement.less';
</style>
