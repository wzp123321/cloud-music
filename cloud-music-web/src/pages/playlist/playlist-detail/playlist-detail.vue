<template>
  <cm-loading v-if="playListDetailService.loading"></cm-loading>
  <div class="playlist-detail" id="playlist-detail" v-if="!playListDetailService.loading">
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
      <div class="pd-musiclist-tags mt6 mb24" v-if="playListDetail?.tags?.length">
        <span v-for="(item, index) in playListDetail?.tags" :key="'tag_' + index"> {{ item }}</span>
      </div>

      <!-- 歌曲 -->
      <cm-table :dataSource="musicList"></cm-table>

      <div class="pd-musiclist-header" v-if="commentRes?.hotComments?.length">
        <h5>热门评论</h5>
        <span>{{ commentRes?.hotComments?.length }}条</span>
      </div>
      <cm-comment
        v-for="(item, index) in commentRes?.hotComments"
        :key="'comment-' + index"
        :commentVO="item"
      ></cm-comment>
      <div class="pd-musiclist-header mt60" v-if="commentRes?.comments?.length">
        <h5>最新评论</h5>
        <span>{{ commentRes?.comments?.length }}条</span>
      </div>
      <cm-comment
        v-for="(item, index) in commentRes?.comments"
        :key="'comment-' + index"
        :commentVO="item"
      ></cm-comment>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import PlayListDetailService from './playlist-detail.service';
import { PD_IPlaylistDetail } from './playlist-detail.api';
import { Common_IMusic } from '../../../services/common-api/common-api';
import { MP_IMVCommentRes } from '../../mvplay/mvplay.api';

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
  tracks: [],
});
const musicList = ref<Common_IMusic[]>([]);
const commentRes = ref<MP_IMVCommentRes>({
  comments: [],
  hotComments: [],
});

onMounted(() => {
  playListDetailService.playListResult$.pipe(takeUntil(destroy$)).subscribe((v) => {
    playListDetail.value = v;
  });

  playListDetailService.playListCommentResult$.pipe(takeUntil(destroy$)).subscribe((v) => {
    commentRes.value = v;
  });

  playListDetailService.playListMusicListResult$.pipe(takeUntil(destroy$)).subscribe((v) => {
    musicList.value = v?.map((item) => {
      return {
        dt: item.dt,
        url: '',
        name: item.name,
        alName: item.al?.name,
        artist: item.ar?.[0]?.name,
        picUrl: item.al.picUrl,
        id: item.id,
      };
    });
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

    &-tags {
      span {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;

        background-color: rgba(0, 0, 0, 0.08);
      }

      span + span {
        margin-left: 12px;
      }
    }

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
