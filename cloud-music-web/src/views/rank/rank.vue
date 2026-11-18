<template>
<div class="rank">
  <cm-navbar :title="'排行榜'" :has-load-more="false"></cm-navbar>

  <!-- 所有榜单 toplist -->
  <section class="rank--section">
    <h3 class="rank--heading">官方榜单</h3>
    <cm-state v-if="! toplist.length" empty :empty-text="'暂无榜单'"></cm-state>
    <div v-else class="rank--toplist grid-cols-5">
      <div
        v-for="item in  toplist"
        :key="'tl_' + item.id"
        :class="['rank--toplist-item',  selectedRankId === item.id ? 'active' : '']"
        @click="goRankDetail(item.id)"
      >
        <cm-skeleton
          width="100%"
          :height="''"
          :image-url="item.coverImgUrl || ''"
          :border-radius="'6px'"
        ></cm-skeleton>
        <p class="rank--toplist-name" :title="item.name || ''">{{ item.name || '' }}</p>
        <p class="rank--toplist-freq">{{ item.updateFrequency || '' }}</p>
      </div>
    </div>
  </section>

  <!-- 榜单详情 top_list -->
  <section class="rank--section">
    <h3 class="rank--heading">榜单详情</h3>
    <cm-state v-if="! rankTrackList.length" empty :empty-text="'暂无榜单歌曲'"></cm-state>
    <ul v-else class="rank--track-list">
      <li v-for="(track, index) in  rankTrackList" :key="'tr_' + index" class="rank--track-item">
        <span class="cell-index">{{ index + 1 }}</span>
        <span class="cell-name" :title="track.name || ''" @click=" linkToSong(track.id)">{{ track.name || '' }}</span>
        <span class="cell-artists" :title="formatTrackArtists(track)">{{ formatTrackArtists(track) }}</span>
        <span class="cell-album" :title="track.al?.name || ''">{{ track.al?.name || '' }}</span>
      </li>
    </ul>
  </section>

  <!-- 精品歌单 top_playlist_highquality -->
  <section class="rank--section">
    <h3 class="rank--heading">精品歌单</h3>
    <cm-state v-if="! highqualityList.length" empty :empty-text="'暂无精品歌单'"></cm-state>
    <div v-else class="rank--grid flex-row-justify-start flex-wrap">
      <cm-playlist-card
        v-for="item in  highqualityList"
        :id="item.id || 0"
        :key="'hq_' + item.id"
        :title="item.name || ''"
        :cover-image-url="item.coverImgUrl || ''"
        :play-count="item.playCount || 0"
      ></cm-playlist-card>
    </div>
  </section>

  <!-- 新歌速递 top_song -->
  <section class="rank--section">
    <h3 class="rank--heading">新歌速递</h3>
    <cm-state v-if="! topSongList.length" empty :empty-text="'暂无新歌'"></cm-state>
    <ul v-else class="rank--track-list">
      <li v-for="(song, index) in  topSongList" :key="'ts_' + index" class="rank--track-item">
        <span class="cell-index">{{ index + 1 }}</span>
        <span class="cell-name" :title="song.name || ''" @click=" linkToSong(song.id)">{{ song.name || '' }}</span>
        <span class="cell-artists" :title="formatSongArtists(song)">{{ formatSongArtists(song) }}</span>
        <span class="cell-album" :title="song.album?.name || ''">{{ song.album?.name || '' }}</span>
      </li>
    </ul>
  </section>

  <!-- MV 排行榜 top_mv -->
  <section class="rank--section">
    <h3 class="rank--heading">MV 排行榜</h3>
    <cm-state v-if="! topMvList.length" empty :empty-text="'暂无 MV'"></cm-state>
    <div v-else class="rank--mv-grid grid-cols-4">
      <div
        v-for="(mv, index) in  topMvList"
        :key="'mv_' + index"
        class="rank--mv-item"
        @click=" linkToMv(mv.id)"
      >
        <cm-skeleton width="100%" :height="''" :image-url="mv.cover || ''" :border-radius="'6px'"></cm-skeleton>
        <p class="rank--mv-name" :title="mv.name || ''">{{ mv.name || '' }}</p>
        <p class="rank--mv-artist" :title="formatMvArtists(mv)">{{ formatMvArtists(mv) }}</p>
      </div>
    </div>
  </section>
</div>

</template>

<script setup lang="ts">

// 排行榜页（含榜单详情）
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { usePortal } from '../portal/hooks/usePortal';
import { TopListTrack, TopSongItem, TopMvItem } from '../../apis/portal/portal-api';
import message from '@/utils/message';
import CmState from '@/components/cm-state/cm-state.vue';

const { highqualityList, linkToMv, linkToSong, queryRankDetail, queryTopMv, queryTopPlaylistHighquality, queryTopSong, queryToplist, rankTrackList, selectedRankId, topMvList, topSongList, toplist } = usePortal();
defineOptions({ name: 'Rank' });
const route = useRoute();
const router = useRouter();

    onMounted(() => {
       queryToplist();
       queryTopPlaylistHighquality();
       queryTopSong();
       queryTopMv();
      // /rank_detail?id=xxx 时预选对应榜单（queryRankDetail 会同步写入 selectedRankId，
      // 不会被 queryToplist 的默认选中逻辑覆盖）
      const id = Number(route.query.id);
      if (id) {
         queryRankDetail(id);
      }
    });

    // 榜单卡片点击：榜单本质是一张歌单，跳转独立歌单详情页。
    // 不能复用 /rank_detail（它指向本组件，跳完首屏无变化，看起来像没点动）。
    const goRankDetail = (id?: number) => {
      if (id == null) {
        message.info('该内容暂无详情信息');
        return;
      }
      router.push({ path: '/playlist_detail', query: { id: String(id) } });
    };

    // 在同一组件内从 /rank 切到 /rank_detail（或不同 id）时，onMounted 不会重跑，
    // 用 watch 保证 query.id 变化也能预选对应榜单
    watch(
      () => route.query.id,
      (id) => {
        const nid = Number(id);
        if (nid) {
           queryRankDetail(nid);
        }
      },
    );

    const formatTrackArtists = (track: TopListTrack): string => {
      return (track.ar || []).map((artist) => artist.name || '').join(' / ');
    };

    const formatSongArtists = (song: TopSongItem): string => {
      return (song.artists || []).map((artist) => artist.name || '').join(' / ');
    };

    const formatMvArtists = (mv: TopMvItem): string => {
      return (mv.artists || []).map((artist) => artist.name || '').join(' / ');
    };

    ;
</script>

<style lang="less" scoped>
.rank {
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 24px 24px 48px;

  &--section {
    margin-top: 24px;
    background-color: var(--color-default);
    border-radius: 8px;
    padding: 16px 20px;
  }

  &--heading {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &--toplist {
    display: grid;
    gap: 20px;
    margin-top: 16px;
  }

  &--toplist-item {
    padding: 8px;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    // 榜单封面为正方形，跟随列宽缩放
    :deep(.cm-skeleton) {
      height: auto;
      aspect-ratio: 1;
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.03);
    }

    &.active {
      border-color: var(--color-primary);
      background-color: rgba(194, 12, 12, 0.05);
    }
  }

  &--toplist-name {
    margin-top: 8px;
    font-size: 14px;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &--toplist-freq {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  &--grid {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    margin-top: 16px;
  }

  &--track-list {
    margin-top: 12px;
  }

  &--track-item {
    display: flex;
    align-items: center;
    height: 44px;
    padding: 0 12px;
    font-size: 14px;
    color: var(--color-text-primary);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    &:nth-child(odd) {
      background-color: rgba(0, 0, 0, 0.02);
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }

    .cell-index {
      width: 40px;
      flex-shrink: 0;
      color: var(--color-text-secondary);
    }

    .cell-name {
      flex: 2;
      cursor: pointer;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;

      &:hover {
        color: var(--color-primary);
      }
    }

    .cell-artists {
      flex: 1.5;
      color: var(--color-text-secondary);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .cell-album {
      flex: 1.5;
      color: var(--color-text-secondary);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  &--mv-grid {
    display: grid;
    gap: 24px;
    margin-top: 16px;
  }

  &--mv-item {
    cursor: pointer;
    transition: transform 233ms;

    // MV 封面为 16:9，跟随列宽缩放
    :deep(.cm-skeleton) {
      height: auto;
      aspect-ratio: 16 / 9;
    }

    &:hover {
      transform: translateY(-4px);
    }
  }

  &--mv-name {
    margin-top: 8px;
    font-size: 14px;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &--mv-artist {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

</style>
