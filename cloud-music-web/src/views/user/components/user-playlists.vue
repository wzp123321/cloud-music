<template>
  <section class="up-playlists">
    <div class="up-block-title">
      <span>创建的歌单</span>
      <span class="up-count">{{ playlists?.length || 0 }}</span>
    </div>
    <div v-if="playlists?.length" class="up-grid">
      <div v-for="item in playlists" :key="item.id" class="up-card" @click="openPlaylist(item.id)">
        <div class="up-cover">
          <img :src="item.coverImgUrl" alt="" />
          <span class="up-playcount">{{ formatPlayCount(item.playCount) }}</span>
        </div>
        <div class="up-card-name" :title="item.name">{{ item.name }}</div>
      </div>
    </div>
    <div v-else class="up-empty">暂无歌单</div>
  </section>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { UC_IPlaylist } from '@/apis/user.api';

defineProps<{
  playlists: UC_IPlaylist[];
}>();

const router = useRouter();

const openPlaylist = (id: number) => {
  router.push({ path: '/playlist_detail', query: { id } });
};

const formatPlayCount = (count: number) => {
  if (!count) return '';
  return count > 10000 ? `${Math.floor(count / 10000)}万` : `${count}`;
};
</script>

<style scoped lang="less">
.up-playlists {
  margin-top: 24px;

  .up-block-title {
    display: flex;
    align-items: baseline;
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;

    .up-count {
      margin-left: 8px;
      font-size: 13px;
      font-weight: 400;
      color: #999;
    }
  }

  .up-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;
  }

  .up-card {
    cursor: pointer;

    .up-cover {
      position: relative;
      width: 100%;
      padding-top: 100%;
      border-radius: 6px;
      overflow: hidden;
      background: #f2f2f2;

      img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .up-playcount {
        position: absolute;
        top: 4px;
        right: 6px;
        font-size: 12px;
        color: #fff;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }
    }

    .up-card-name {
      margin-top: 8px;
      font-size: 13px;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .up-empty {
    padding: 40px 0;
    text-align: center;
    color: #999;
    font-size: 14px;
  }
}
</style>
