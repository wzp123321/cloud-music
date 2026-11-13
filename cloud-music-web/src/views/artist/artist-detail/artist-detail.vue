<template>
<div v-loading="artistDetail.loading" class="artist-detail">
  <div class="artist-detail--info flex-row-start-center">
    <div class="info-bg"></div>
    <cm-skeleton
      width="230px"
      :height="'230px'"
      :image-url="artistDetail.artistVO?.artist?.img1v1Url"
      source-type="image"
      :border-radius="'50%'"
    >
    </cm-skeleton>
    <div class="flex-column ml42" ellipsis>
      <h6>{{ artistDetail.artistVO?.artist?.name }}</h6>
      <div class="flex-row-start-center mt16 mb16">
        <label>单曲：</label>
        <span class="mr40 count-value">{{ artistDetail.artistVO?.artist?.musicSize }}</span>
        <label>专辑：</label>
        <span class="mr40 count-value">{{ artistDetail.artistVO?.artist?.albumSize }}</span>
        <label>MV：</label>
        <span class="mr40 count-value">{{ artistDetail.artistVO?.artist?.mvSize }}</span>
        <!-- 粉丝数：artist_follow_count -->
        <label>粉丝：</label>
        <span class="mr40 count-value">{{ artistDetail.followCount.data?.fansCnt ?? 0 }}</span>
      </div>
      <div class="desc mt16">
        <label class="font16">简介：</label>
        <span :title="artistDetail.artistVO?.artist?.briefDesc" class="font16"
          >{{ artistDetail.artistVO?.artist?.briefDesc }}</span
        >
      </div>
      <cm-button radius primary style="width: 180px" class="mt12">
        <cm-icon name="icon-24gf-play" class="mr6"></cm-icon>播放全部歌曲
      </cm-button>
      <!-- 关注歌手：artist_sub -->
      <div class="artist-detail--follow mt12">
        <cm-button
          class="artist-detail--follow-btn"
          :class="artistDetail.followCount.data?.isFollow ? 'followed' : ''"
          :disabled="artistDetail.subLoading"
          @click="artistDetail.toggleSub()"
        >
          {{ artistDetail.followCount.data?.isFollow ? '已关注' : '关注歌手' }}
        </cm-button>
        <span v-if="artistDetail.actionTip" class="artist-detail--tip">{{ artistDetail.actionTip }}</span>
      </div>
    </div>
  </div>

  <div class="artist-detail--tabs mt60">
    <cm-navbar
      v-model:selected-code="artistDetail.selectedCode"
      class="mb24"
      :title="''"
      :navs="artistDetail.navs"
      :font-size="22"
      :has-load-more="false"
      @change="artistDetail.handleNavChange"
    ></cm-navbar>
    <!-- loading -->
    <cm-loading v-if="artistDetail.itemLoading"></cm-loading>
    <!-- error -->
    <cm-error v-if="artistDetail.is_error"></cm-error>
    <!-- 单曲 -->
    <div
      v-show="artistDetail.selectedCode === artistDetail.navs[0].code  && !artistDetail.itemLoading  && !artistDetail.is_error"
    >
      <cm-table :data-source="artistDetail.songs"></cm-table>

      <!-- 热门 50 首 / 全部歌曲：artist_top_song、artist_songs -->
      <div class="artist-detail--enhance mt36">
        <div class="artist-detail--enhance-bar">
          <cm-button
            :class="['artist-detail--switch', artistDetail.songSource === 'top' ? 'active' : '']"
            @click="artistDetail.switchSongSource('top')"
          >
            热门 50 首
          </cm-button>
          <cm-button
            :class="['artist-detail--switch', artistDetail.songSource === 'all' ? 'active' : '']"
            @click="artistDetail.switchSongSource('all')"
          >
            全部歌曲
          </cm-button>
          <template v-if="artistDetail.songSource === 'all'">
            <cm-button
              :class="['artist-detail--switch', artistDetail.songOrder === 'hot' ? 'active' : '']"
              @click="artistDetail.switchSongOrder('hot')"
            >
              最热
            </cm-button>
            <cm-button
              :class="['artist-detail--switch', artistDetail.songOrder === 'time' ? 'active' : '']"
              @click="artistDetail.switchSongOrder('time')"
            >
              最新
            </cm-button>
          </template>
        </div>
        <cm-error
          v-if="!(artistDetail.songSource === 'top' ? artistDetail.topSongs : artistDetail.allSongs).length"
          :title="'暂无歌曲'"
        ></cm-error>
        <ul v-else class="artist-detail--song-list">
          <li
            v-for="(song, index) in artistDetail.songSource === 'top' ? artistDetail.topSongs : artistDetail.allSongs"
            :key="'enhance_song_' + index"
          >
            <span class="artist-detail--song-index">{{ index + 1 }}</span>
            <span class="artist-detail--song-name" :title="song.name">{{ song.name }}</span>
            <span class="artist-detail--song-sub" :title="artistDetail.formatSongArtists(song)">
              {{ artistDetail.formatSongArtists(song) }}
            </span>
            <span class="artist-detail--song-sub">{{ song.al?.name || song.album?.name || '' }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 专辑 -->
    <div
      v-show="artistDetail.selectedCode === artistDetail.navs[1].code && !artistDetail.itemLoading && !artistDetail.is_error"
      class="album-list flex-wrap"
    >
      <cm-album-card
        v-for="(item, index) in artistDetail.albumList"
        :id="item.id"
        :key="'album_' + index"
        :cover-image-url="item.picUrl"
        :title="item.name"
        :publish-time="item.publishTime"
      ></cm-album-card>
    </div>

    <!-- MV -->
    <div
      v-show="artistDetail.selectedCode === artistDetail.navs[2].code && !artistDetail.itemLoading && !artistDetail.is_error"
      class="mv-list flex-wrap"
    >
      <cm-mv-card
        v-for="(item, index) in artistDetail.mvList"
        :id="item.id"
        :key="'album_' + index"
        :cover-image-url="item.imgurl16v9"
        :title="item.name"
        :duration="Number(item.duration)"
        :play-count="item.playCount"
        :publish-time="item.publishTime"
      ></cm-mv-card>
    </div>

    <!-- desc -->
    <div
      v-show="artistDetail.selectedCode === artistDetail.navs[3].code && !artistDetail.itemLoading && !artistDetail.is_error"
      class="desc flex-wrap"
    >
      <p class="subtitle">简介</p>
      <!-- 歌手简介是服务端富文本，只能按 HTML 渲染 -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="text" v-html="sanitizeHtml(artistDetail?.desc?.briefDesc)"></div>
      <template v-for="(item, index) in artistDetail?.desc?.introduction" :key="'desc_' + index">
        <p class="subtitle">{{ item.ti }}</p>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="text" v-html="sanitizeHtml(item.txt)"></div>
      </template>
    </div>

    <!-- 相关视频：artist_video -->
    <div
      v-show="artistDetail.selectedCode === artistDetail.navs[4].code && !artistDetail.itemLoading && !artistDetail.is_error"
      class="artist-detail--video-list flex-wrap grid-cols-4"
    >
      <cm-error v-if="!artistDetail.videos.length" :title="'暂无相关视频'"></cm-error>
      <div v-for="(video, index) in artistDetail.videos" :key="'video_' + index" class="artist-detail--video-item">
        <cm-skeleton
          width="100%"
          :height="''"
          :image-url="video.coverUrl || ''"
          :border-radius="'6px'"
        ></cm-skeleton>
        <p class="artist-detail--video-name" :title="video.title || video.content">
          {{ video.title || video.content || '相关视频' }}
        </p>
        <p class="artist-detail--video-sub">{{ video.creator?.nickname || '' }}</p>
      </div>
    </div>
  </div>

  <!-- 粉丝列表：artist_fans -->
  <div class="artist-detail--enhance mt36">
    <h5 class="artist-detail--block-title">粉丝</h5>
    <cm-error v-if="!artistDetail.fans.length" :title="'暂无粉丝数据'"></cm-error>
    <div v-else class="artist-detail--fans">
      <div v-for="(fan, index) in artistDetail.fans" :key="'fan_' + index" class="artist-detail--fan">
        <cm-image :src="fan.avatarUrl" alt="" loading="lazy" />
        <p :title="fan.nickname">{{ fan.nickname }}</p>
      </div>
    </div>
  </div>

  <!-- 评论区：复用歌曲评论(comment_music)，取歌手热门歌曲 -->
  <cm-comment :id="artistDetail.songs?.[0]?.id || 0" type="music"></cm-comment>
  <!-- 相似推荐：simi_artist -->
  <cm-simi :id="artistId" type="artist"></cm-simi>
</div>

</template>

<script setup lang="ts">

// 歌手详情
import {  onMounted } from 'vue';
import { getQueryParam } from '@/core/token';
import { sanitizeHtml } from '@/utils/sanitize';

import { useArtistDetail } from './hooks/useArtistDetail';

const artistDetail = useArtistDetail();
defineOptions({ name: 'ArtistDetail' });
artistDetail.init();

    const artistId = Number(getQueryParam('id') ?? 0);

    onMounted(() => {
      const pageEle = document.getElementsByClassName('home');
      if (pageEle) {
        (pageEle?.[0] as HTMLElement).scrollTo({
          top: 0,
        });
      }
    });

    ;
</script>

<style lang="less" scoped>
.artist-detail {
  width: 100%;
  height: 100%;

  &--info {
    height: 314px;
    position: relative;

    .info-bg {
      position: absolute;
      width: 200%;
      height: 100%;
      left: 50%;
      top: 0;
      background-color: #f5f5f5;
      transform: translateX(-50%);
      z-index: -1;
    }


    h6 {
      height: 42px;
      line-height: 42px;
      font-weight: 500;
      font-size: 30px;
    }

    label,
    span {
      color: #999;
      font-size: 18px;
      font-weight: 300;
      line-height: 25px;
    }

    span.count-value {
      color: #666;
    }

    .desc {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .font16 {
      font-size: 16px;
    }
  }

  &--tabs {
    .album-list {
      column-gap: 36px;
      row-gap: 24px;
    }

    .mv-list {
      column-gap: 40px;
      row-gap: 24px;
    }

    .desc {
      p.subtitle {
        position: relative;
        margin-bottom: 24px;
        margin-top: 49px;
        height: 25px;
        line-height: 25px;
        font-weight: 600;
        padding-left: 14px;
        font-size: 18px;
      }

      p.subtitle::before {
        content: '';
        width: 4px;
        height: 20px;
        background-color: var(--color-primary);
        position: absolute;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
      }

      .text {
        text-indent: 2em;
        font-size: 16px;
        line-height: 23px;
        color: var(--color-text-primary);
      }
    }
  }
}

.artist-detail--follow {
  display: flex;
  align-items: center;
  gap: 12px;
}

.artist-detail--follow-btn {
  padding: 6px 18px;
  border: 1px solid var(--color-primary, #c20c0c);
  border-radius: 18px;
  background: var(--color-primary, #c20c0c);
  color: #fff;
  font-size: 14px;
  cursor: pointer;

  &.followed {
    background: transparent;
    color: var(--color-primary, #c20c0c);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.artist-detail--tip {
  font-size: 12px;
  color: #999;
}

.artist-detail--enhance {
  margin-top: 36px;
}

.artist-detail--block-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-title, #333);
}

.artist-detail--enhance-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.artist-detail--switch {
  padding: 5px 14px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 14px;
  background: transparent;
  color: #666;
  font-size: 13px;
  cursor: pointer;

  &.active {
    border-color: var(--color-primary, #c20c0c);
    color: var(--color-primary, #c20c0c);
  }
}

.artist-detail--song-list {
  li {
    display: flex;
    align-items: center;
    height: 42px;
    padding: 0 12px;
    font-size: 14px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
}

.artist-detail--song-index {
  width: 40px;
  color: #999;
}

.artist-detail--song-name {
  flex: 2;
  color: #333;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.artist-detail--song-sub {
  flex: 1;
  color: #999;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.artist-detail--fans {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 16px;
}

.artist-detail--fan {
  width: 80px;
  text-align: center;

  img {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
  }

  p {
    margin-top: 6px;
    font-size: 12px;
    color: #666;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.artist-detail--video-list {
  display: grid;
  gap: 20px;
}

.artist-detail--video-item {
  cursor: pointer;

  // 视频封面为 16:9，跟随列宽缩放
  :deep(.cm-skeleton) {
    height: auto;
    aspect-ratio: 16 / 9;
  }
}

.artist-detail--video-name {
  margin-top: 8px;
  font-size: 14px;
  color: #333;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.artist-detail--video-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

</style>
