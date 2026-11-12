<template>
<div class="daily-recommend">
  <cm-navbar :title="'每日推荐'" :has-load-more="false"></cm-navbar>

  <!-- 每日推荐歌曲 recommend_songs -->
  <section class="daily-recommend--section">
    <h3 class="daily-recommend--heading">每日推荐歌曲</h3>
    <cm-error v-if="!portal.recommendSongList.length" :title="'暂无推荐歌曲'"></cm-error>
    <ul v-else class="daily-recommend--song-list">
      <li
        v-for="(song, index) in portal.recommendSongList"
        :key="'daily_song_' + index"
        class="daily-recommend--song-item"
      >
        <span class="cell-index">{{ index + 1 }}</span>
        <span class="cell-name" :title="song.name || ''" @click="portal.linkToSong(song.id)">{{ song.name || '' }}</span>
        <span class="cell-artists" :title="formatArtists(song)">{{ formatArtists(song) }}</span>
        <span class="cell-album" :title="song.album?.name || ''">{{ song.album?.name || '' }}</span>
        <span class="cell-dislike" @click="handleDislike(song.id)">不感兴趣</span>
      </li>
    </ul>
  </section>

  <!-- 每日推荐歌单 recommend_resource -->
  <section class="daily-recommend--section">
    <h3 class="daily-recommend--heading">每日推荐歌单</h3>
    <cm-error v-if="!portal.recommendResourceList.length" :title="'暂无推荐歌单'"></cm-error>
    <div v-else class="daily-recommend--grid flex-row-justify-start flex-wrap">
      <cm-playlist-card
        v-for="item in portal.recommendResourceList"
        :id="item.id || 0"
        :key="'rr_' + item.id"
        :title="item.name || ''"
        :cover-image-url="item.picUrl || ''"
        :play-count="item.playCount || 0"
      ></cm-playlist-card>
    </div>
  </section>

  <!-- 个性化推荐歌单 personalized -->
  <section class="daily-recommend--section">
    <h3 class="daily-recommend--heading">猜你喜欢</h3>
    <cm-error v-if="!portal.personalizedList.length" :title="'暂无推荐歌单'"></cm-error>
    <div v-else class="daily-recommend--grid flex-row-justify-start flex-wrap">
      <cm-playlist-card
        v-for="item in portal.personalizedList"
        :id="item.id || 0"
        :key="'p_' + item.id"
        :title="item.name || ''"
        :cover-image-url="item.picUrl || ''"
        :play-count="item.playCount || 0"
      ></cm-playlist-card>
    </div>
  </section>

  <!-- 推荐新歌 personalized_newsong -->
  <section class="daily-recommend--section">
    <h3 class="daily-recommend--heading">推荐新歌</h3>
    <cm-error v-if="!portal.newSongList.length" :title="'暂无推荐新歌'"></cm-error>
    <ul v-else class="daily-recommend--song-list">
      <li
        v-for="(item, index) in portal.newSongList"
        :key="'ns_' + index"
        class="daily-recommend--song-item"
      >
        <span class="cell-index">{{ index + 1 }}</span>
        <span class="cell-name" :title="item.name || ''" @click="portal.linkToSong(item.song?.id)">{{ item.name || '' }}</span>
        <span class="cell-artists" :title="formatNewSongArtists(item)">{{ formatNewSongArtists(item) }}</span>
        <span class="cell-album" :title="item.song?.album?.name || ''">{{ item.song?.album?.name || '' }}</span>
      </li>
    </ul>
  </section>
</div>

</template>

<script setup lang="ts">

/*
 * @Description: 每日推荐页
 * @Author: home-recommendation
 */
import {  onMounted } from 'vue';

import { usePortal } from '../portal/hooks/usePortal';
import { RecommendSongItem, PersonalizedNewSongItem } from '../../apis/portal/portal-api';

const portal = usePortal();
defineOptions({ name: 'DailyRecommend' });
// 直接访问该路由时也保证数据可用（不依赖先经过首页 init）
    onMounted(() => {
      portal.queryRecommendSongs();
      portal.queryRecommendResource();
      portal.queryPersonalized();
      portal.queryNewSong();
    });

    const formatArtists = (song: RecommendSongItem): string => {
      return (song.artists || []).map((artist) => artist.name || '').join(' / ');
    };

    const formatNewSongArtists = (item: PersonalizedNewSongItem): string => {
      return (item.song?.artists || []).map((artist) => artist.name || '').join(' / ');
    };

    // 包装一层，过滤掉可选 id，保证传入 dislikeRecommendSong 的一定为 number
    const handleDislike = (id?: number) => {
      if (id == null) return;
      portal.dislikeRecommendSong(id);
    };

    ;
</script>

<style lang="less" scoped>
.daily-recommend {
  width: 1200px;
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

  &--grid {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    margin-top: 16px;
  }

  &--song-list {
    margin-top: 12px;
  }

  &--song-item {
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

    .cell-dislike {
      width: 80px;
      flex-shrink: 0;
      text-align: right;
      color: #999;
      cursor: pointer;

      &:hover {
        color: var(--color-primary, #c20c0c);
      }
    }
  }
}

</style>
