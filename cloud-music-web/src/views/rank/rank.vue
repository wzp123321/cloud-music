<template>
<div class="rank">
  <cm-navbar :title="'排行榜'" :has-load-more="false"></cm-navbar>

  <!-- 所有榜单 toplist -->
  <section class="rank--section">
    <h3 class="rank--heading">官方榜单</h3>
    <cm-error v-if="!portal.toplist.length" :title="'暂无榜单'"></cm-error>
    <div v-else class="rank--toplist">
      <div
        v-for="item in portal.toplist"
        :key="'tl_' + item.id"
        :class="['rank--toplist-item', portal.selectedRankId === item.id ? 'active' : '']"
        @click="selectRank(item.id)"
      >
        <cm-skeleton
          width="100%"
          :height="'120px'"
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
    <cm-error v-if="!portal.rankTrackList.length" :title="'暂无榜单歌曲'"></cm-error>
    <ul v-else class="rank--track-list">
      <li v-for="(track, index) in portal.rankTrackList" :key="'tr_' + index" class="rank--track-item">
        <span class="cell-index">{{ index + 1 }}</span>
        <span class="cell-name" :title="track.name || ''" @click="portal.linkToSong(track.id)">{{ track.name || '' }}</span>
        <span class="cell-artists" :title="formatTrackArtists(track)">{{ formatTrackArtists(track) }}</span>
        <span class="cell-album" :title="track.al?.name || ''">{{ track.al?.name || '' }}</span>
      </li>
    </ul>
  </section>

  <!-- 精品歌单 top_playlist_highquality -->
  <section class="rank--section">
    <h3 class="rank--heading">精品歌单</h3>
    <cm-error v-if="!portal.highqualityList.length" :title="'暂无精品歌单'"></cm-error>
    <div v-else class="rank--grid flex-row-justify-start flex-wrap">
      <cm-playlist-card
        v-for="item in portal.highqualityList"
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
    <cm-error v-if="!portal.topSongList.length" :title="'暂无新歌'"></cm-error>
    <ul v-else class="rank--track-list">
      <li v-for="(song, index) in portal.topSongList" :key="'ts_' + index" class="rank--track-item">
        <span class="cell-index">{{ index + 1 }}</span>
        <span class="cell-name" :title="song.name || ''" @click="portal.linkToSong(song.id)">{{ song.name || '' }}</span>
        <span class="cell-artists" :title="formatSongArtists(song)">{{ formatSongArtists(song) }}</span>
        <span class="cell-album" :title="song.album?.name || ''">{{ song.album?.name || '' }}</span>
      </li>
    </ul>
  </section>

  <!-- MV 排行榜 top_mv -->
  <section class="rank--section">
    <h3 class="rank--heading">MV 排行榜</h3>
    <cm-error v-if="!portal.topMvList.length" :title="'暂无 MV'"></cm-error>
    <div v-else class="rank--mv-grid">
      <div
        v-for="(mv, index) in portal.topMvList"
        :key="'mv_' + index"
        class="rank--mv-item"
        @click="portal.linkToMv(mv.id)"
      >
        <cm-skeleton width="100%" :height="'140px'" :image-url="mv.cover || ''" :border-radius="'6px'"></cm-skeleton>
        <p class="rank--mv-name" :title="mv.name || ''">{{ mv.name || '' }}</p>
        <p class="rank--mv-artist" :title="formatMvArtists(mv)">{{ formatMvArtists(mv) }}</p>
      </div>
    </div>
  </section>
</div>

</template>

<script setup lang="ts">

/*
 * @Description: 排行榜页（含榜单详情）
 * @Author: home-recommendation
 */
import {  onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { usePortal } from '../portal/hooks/usePortal';
import { TopListTrack, TopSongItem, TopMvItem } from '../../apis/portal/portal-api';

const portal = usePortal();
defineOptions({ name: 'Rank' });
const route = useRoute();

    onMounted(() => {
      portal.queryToplist();
      portal.queryTopPlaylistHighquality();
      portal.queryTopSong();
      portal.queryTopMv();
      // /rank_detail?id=xxx 时预选对应榜单（queryRankDetail 会同步写入 selectedRankId，
      // 不会被 queryToplist 的默认选中逻辑覆盖）
      const id = Number(route.query.id);
      if (id) {
        portal.queryRankDetail(id);
      }
    });

    // 切换榜单：复用状态层的 queryRankDetail(top_list)
    const selectRank = (id?: number) => {
      if (id == null) return;
      portal.queryRankDetail(id);
    };

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
  width: 1400px;
  margin: 0 auto;
  padding: 24px 0 48px;

  &--section {
    margin-top: 24px;
    background-color: var(--color-default);
    border-radius: 8px;
    padding: 16px 20px;
  }

  &--heading {
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }

  &--toplist {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;
    margin-top: 16px;
  }

  &--toplist-item {
    padding: 8px;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.03);
    }

    &.active {
      border-color: var(--color-primary, #c20c0c);
      background-color: rgba(194, 12, 12, 0.05);
    }
  }

  &--toplist-name {
    margin-top: 8px;
    font-size: 14px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &--toplist-freq {
    margin-top: 4px;
    font-size: 12px;
    color: #999;
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
    color: #333;
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
      color: #999;
    }

    .cell-name {
      flex: 2;
      cursor: pointer;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;

      &:hover {
        color: var(--color-primary, #c20c0c);
      }
    }

    .cell-artists {
      flex: 1.5;
      color: #666;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .cell-album {
      flex: 1.5;
      color: #999;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  &--mv-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    margin-top: 16px;
  }

  &--mv-item {
    cursor: pointer;
    transition: transform 233ms;

    &:hover {
      transform: translateY(-4px);
    }
  }

  &--mv-name {
    margin-top: 8px;
    font-size: 14px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &--mv-artist {
    margin-top: 4px;
    font-size: 12px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

</style>
