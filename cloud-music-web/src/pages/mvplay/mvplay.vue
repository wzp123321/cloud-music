<template>
  <div class="mv-player" id="mv-player">
    <div class="mp-container" v-loading="mvPlayer.loading">
      <video :src="url" preload="auto" autoplay controls muted></video>
      <div class="mp-info">
        <h5>{{ mvDetail?.name }}</h5>
        <span>-</span>
        <h5>{{ mvDetail?.artistName }}</h5>
      </div>
      <div class="mp-data">
        <i class="iconfont icon-24gf-play"></i>
        <span>播放量：{{ mvDetail?.playCount ?? 0 }}</span>
      </div>
    </div>

    <div class="mp-comment mt36">
      <div class="mp-comment-header">
        <h5>热门评论</h5>
        <span>{{ mvDetail?.commentCount }}条</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import MvPlayerService from './mvplay.service';
import { MP_IMvDetail } from './mvplay.api';

const mvPlayer = new MvPlayerService();
const destroy$ = new Subject<void>();

const mvDetail = ref<MP_IMvDetail>({
  artistId: 0,
  artistName: '',
  artists: {
    followed: '',
    id: '',
    img1v1Url: '',
    name: '',
  },
  commentCount: '',
  commentThreadId: '',
  cover: '',
  coverId: '',
  coverId_str: '',
  desc: '',
  duration: '',
  id: '',
  nType: '',
  name: '',
  playCount: '',
  price: '',
  publishTime: '',
  shareCount: '',
  subCount: '',
});

const url = ref<string>('');

onMounted(() => {
  mvPlayer.mvDetailResult$.pipe(takeUntil(destroy$)).subscribe((v) => {
    mvDetail.value = v;
  });

  mvPlayer.mvUrlResult$.pipe(takeUntil(destroy$)).subscribe((v) => {
    url.value = v;
  });
});

onUnmounted(() => {
  destroy$.next();
  destroy$.complete();
});
</script>

<style scoped lang="less">
.mv-player {
  .mp-container {
    overflow: hidden;
    background: #262626;

    min-width: 1180px;
    max-width: 1640px;
    padding: 0 120px 24px 120px;
    margin: 0 auto;

    video {
      width: 100%;
    }

    .mp-info {
      display: flex;
      flex-direction: row;
      align-items: center;

      margin-top: 24px;
      margin-bottom: 4px;
      color: hsla(0, 0%, 100%, 0.8);
      font-weight: 300;

      span {
        font-size: 16px;
        margin: 0 8px;
      }

      h5 {
        font-size: 24px;
        color: hsla(0, 0%, 100%, 0.6);
        font-weight: 600;
      }
    }

    .mp-data {
      display: flex;
      flex-direction: row;
      align-items: center;

      .iconfont {
        margin-right: 6px;
      }

      span,
      .iconfont {
        color: hsla(0, 0%, 100%, 0.6);
        font-size: 14px;
      }
    }
  }

  .mp-comment {
    &-header {
      display: flex;
      align-items: flex-end;

      h5 {
        font-size: 22px;
        line-height: 30px;
        font-weight: 600;
      }

      span {
        margin-left: 8px;
        font-weight: 300;
        font-size: 14px;
      }
    }
  }
}
</style>
