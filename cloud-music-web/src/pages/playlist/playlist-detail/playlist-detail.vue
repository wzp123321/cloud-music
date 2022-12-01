<template>
  <div class="playlist-detail" id="playlist-detail">
    <section class="pd-cover">
      <img :src="playListDetail?.coverImgUrl" alt="" />
      <h5>歌单简介</h5>
      <p>{{ playListDetail?.description ?? '' }}</p>
    </section>
    <section class="pd-musiclist">
      <h5>{{ playListDetail?.name }}</h5>
      <div class="pd-musiclist-author">
        <img :src="playListDetail?.creator?.avatarUrl" alt="" />
        <span>{{ playListDetail?.creator?.nickname }}</span>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import PlayListDetailService from './playlist-detail.service';
import { PD_IPlaylistDetail } from './playlist-detail.api';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const destroy$ = new Subject<void>();
const playListDetailService = new PlayListDetailService();

const playListDetail = ref<PD_IPlaylistDetail>({
  backgroundCoverUrl: '',
  bannedTrackIds: '',
  cloudTrackCount: '',
  commentCount: '',
  commentThreadId: '',
  copied: false,
  coverImgId: '',
  coverImgId_str: '',
  coverImgUrl: '',
  createTime: '',
  description: '',
  englishTitle: '',
  gradeStatus: '',
  highQuality: false,
  historySharedUsers: '',
  id: '',
  name: '',
  newImported: '',
  officialPlaylistType: '',
  opRecommend: '',
  ordered: '',
  playCount: '',
  privacy: '',
  remixVideo: '',
  score: '',
  shareCount: '',
  tags: [],
  titleImage: '',
  titleImageUrl: '',
  trackCount: '',
});

onMounted(() => {
  playListDetailService.playListResult$.pipe(takeUntil(destroy$)).subscribe((v) => {
    playListDetail.value = v;
  });
});
</script>

<style scoped lang="less">
#playlist-detail {
  width: 100%;
  height: 100%;

  padding-top: 40px;

  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 56px;

  .pd-cover {
    img {
      width: 100%;
    }

    h5 {
      margin-top: 40px;
      margin-bottom: 10px;
      font-size: 22px;
      font-weight: 600;
      height: 30px;
      line-height: 30px;

      color: var(--color-text);
    }

    p {
      width: 100%;
      font-size: 14px;
      color: #666;
      line-height: 21px;
    }
  }

  .pd-musiclist {
    h5 {
      word-break: break-all;
      font-size: 30px;
      font-weight: 600;
      line-height: 42px;
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;

      margin-top: 24px;
    }

    &-author {
      display: flex;
      align-items: center;
      margin-top: 12px;

      img {
        width: 24px;
        height: 24px;

        border-radius: 50%;
      }

      span {
        font-size: 18px;
        height: 25px;
        color: #666;
        line-height: 25px;
        font-weight: 400;

        margin-left: 8px;
      }
    }
  }
}
</style>
