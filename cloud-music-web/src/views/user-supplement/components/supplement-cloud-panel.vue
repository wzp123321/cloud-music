<template>
  <!-- 6.2 云盘：列表取 songId → 详情 / 删除 -->
  <div class="user-supplement--panel">
    <p class="user-supplement--panel-tip">
      云盘列表（<code>/user/cloud</code>，上游 id 来源）点选后 songId 自动填入
      <code>user_cloud_detail</code> 与 <code>user_cloud_del</code>；也可手填。
    </p>

    <div class="user-supplement--grid grid-cols-2">
      <section class="user-supplement--block user-supplement--block--wide">
        <h3 class="user-supplement--block-title">
          上游列表来源 · 我的云盘
          <code class="user-supplement--module">/user/cloud</code>（songId 来源）
        </h3>
        <p v-if="!hasLogin" class="user-supplement--degrade">登录后可用（已降级，不发请求）</p>
        <div class="user-supplement--block-actions">
          <button class="user-supplement--btn" @click="loadCloudList">加载我的云盘</button>
          <span class="user-supplement--count">{{ cloudList.length }} 个文件</span>
        </div>
        <div v-if="cloudList.length" class="user-supplement--list">
          <div
            v-for="(item, idx) in cloudList"
            :key="'cloud_' + idx"
            class="user-supplement--item"
            @click="onCloudClick(item)"
          >
            <span class="user-supplement--item-title">{{ item.title }}</span>
            <span class="user-supplement--item-sub">{{ item.subtitle }}</span>
            <span v-if="item.id" class="user-supplement--item-id">songId {{ item.id }}</span>
          </div>
        </div>
        <p v-else class="user-supplement--empty">云盘暂无文件（可在下方输入框手填 songId）</p>
      </section>

      <section class="user-supplement--block">
        <h3 class="user-supplement--block-title">
          <code class="user-supplement--module">user_cloud_detail</code> 云盘歌曲详情（songId ←
          云盘点选或手填）
        </h3>
        <div class="user-supplement--form">
          <label
            >songId<input v-model="cloudSongId" placeholder="点选上方云盘文件自动填入，或手填"
          /></label>
          <button class="user-supplement--btn" @click="loadCloudDetail">查看云盘详情</button>
        </div>
        <div v-if="cloudDetailList.length" class="user-supplement--list">
          <div
            v-for="(item, idx) in cloudDetailList"
            :key="'cd_' + idx"
            class="user-supplement--item"
          >
            <span class="user-supplement--item-title">{{ item.title }}</span>
            <span class="user-supplement--item-sub">{{ item.subtitle }}</span>
          </div>
        </div>
        <p v-else class="user-supplement--empty">暂无云盘详情</p>
      </section>

      <section class="user-supplement--block">
        <h3 class="user-supplement--block-title">
          <code class="user-supplement--module">user_cloud_del</code> 删除云盘歌曲（写操作）
        </h3>
        <div class="user-supplement--form">
          <label>songId<input v-model="cloudSongId" placeholder="与详情共享 songId" /></label>
          <button
            class="user-supplement--btn user-supplement--btn--write"
            @click="doDelCloud"
          >
            删除云盘歌曲
          </button>
        </div>
      </section>
    </div>

    <div v-if="writeResult" class="user-supplement--result">{{ writeResult }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import userSupplementService from '../../../apis/user-supplement/user-supplement.service';
import {
  pickSongId,
  toList,
  useSupplementGuard,
  useWriteRunner,
  type SupplementCard,
} from '../use-supplement';

const props = defineProps<{
  /** 登录态：未登录时云盘列表降级、写操作不发请求 */
  hasLogin: boolean;
}>();

const emit = defineEmits<{
  (e: 'toast', message: string): void;
}>();

const cloudList = ref<SupplementCard[]>([]);
const cloudSongId = ref<string>('');
const cloudDetailList = ref<SupplementCard[]>([]);
const writeResult = ref<string>('');

const { requireLogin, writeGuard } = useSupplementGuard({
  hasLogin: () => props.hasLogin,
  setToast: (message) => emit('toast', message),
});
const runWrite = useWriteRunner(writeResult, writeGuard);

/** 上游列表来源：/user/cloud（songId 来源，不计入接口清单统计） */
const loadCloudList = async () => {
  if (!requireLogin()) return;
  try {
    const res = await userSupplementService.getCloudList({ limit: 30 });
    cloudList.value = toList(res);
    emit('toast', `云盘已加载 ${cloudList.value.length} 个文件`);
  } catch {
    cloudList.value = [];
    emit('toast', '接口请求失败，已返回空值');
  }
};

/** 点选云盘文件 → 回填 songId，供详情与删除共用 */
const onCloudClick = (item: SupplementCard) => {
  const songId = pickSongId(item.raw) || item.id;
  if (!songId) return;
  cloudSongId.value = String(songId);
  emit('toast', `已选择云盘文件 songId=${songId}，可用于 user_cloud_detail / user_cloud_del`);
};

/** 6.2 user_cloud_detail 调用点（songId ← 云盘点选或输入） */
const loadCloudDetail = async () => {
  try {
    const res = await userSupplementService.getUserCloudDetail({
      songId: cloudSongId.value,
      id: cloudSongId.value,
    });
    cloudDetailList.value = toList(res);
    emit('toast', `云盘详情已加载 ${cloudDetailList.value.length} 条`);
  } catch {
    cloudDetailList.value = [];
    emit('toast', '接口请求失败，已返回空值');
  }
};

/** 6.2 user_cloud_del 写操作调用点 */
const doDelCloud = () =>
  runWrite('user_cloud_del 删除云盘歌曲', () =>
    userSupplementService.delUserCloud({ songId: cloudSongId.value, id: cloudSongId.value }),
  );

/** 进面板先拉一次云盘列表，便于直接点选 songId */
onMounted(() => {
  loadCloudList();
});
</script>
