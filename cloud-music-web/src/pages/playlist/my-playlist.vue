<template>
  <div class="my-playlist" v-loading="loading">
    <div class="mp-header">
      <h3>我的收藏</h3>
      <el-button type="primary" @click="openCreate">新建歌单</el-button>
    </div>

    <div class="mp-tip" v-if="!loading && !playlists.length">
      暂无收藏的歌单，去 <router-link to="/playlist">歌单分类</router-link> 收藏喜欢的歌单吧～
    </div>

    <div class="mp-grid" v-else>
      <cm-playlist-card
        v-for="item in playlists"
        :key="'my_' + item.id"
        :title="item.name"
        :id="item.id"
        :coverImageUrl="item.coverImgUrl"
        :playCount="item.playCount"
        :creator="item.creator?.nickname"
      ></cm-playlist-card>
    </div>

    <playlist-form-dialog v-model="createVisible" mode="create" @success="onCreated" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { getPlaylistMylike, PM_IPlaylistVO } from '@/services/playlist-manage.api';
import PlaylistFormDialog from './components/playlist-form-dialog.vue';

const loading = ref(false);
const playlists = ref<PM_IPlaylistVO[]>([]);
const createVisible = ref(false);

const openCreate = () => {
  createVisible.value = true;
};

const onCreated = () => {
  window.location.href = '/playlist/my';
};

const fetchMylike = async () => {
  loading.value = true;
  try {
    const res = await getPlaylistMylike({ limit: '30' });
    const list = res?.playlistList || res?.data?.playlistList || [];
    playlists.value = list;
  } catch (e) {
    playlists.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchMylike();
});
</script>

<style scoped lang="less">
.my-playlist {
  width: 1400px;
  margin: 0 auto;
  padding-top: 40px;

  .mp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      font-size: 28px;
      font-weight: 600;
    }
  }

  .mp-tip {
    margin-top: 40px;
    font-size: 15px;
    color: #999;

    a {
      color: var(--color-primary, #c20c0c);
    }
  }

  .mp-grid {
    display: grid;
    grid-template-columns: repeat(5, 262px);
    gap: 24px 24px;
    margin-top: 24px;
  }
}
</style>
