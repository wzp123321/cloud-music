<template>
  <div id="mv-player" class="mv-player">
    <div v-loading="mvPlayer.loading" class="mp-container">
      <cm-video :src="url" preload="auto" autoplay controls muted></cm-video>
      <div class="mp-info">
        <h5>{{ mvDetail?.name }}</h5>
        <span>-</span>
        <h5>{{ mvDetail?.artistName }}</h5>
      </div>
      <div class="mp-data">
        <cm-icon name="icon-24gf-play"></cm-icon>
        <span>播放量：{{ mvDetail?.playCount ?? 0 }}</span>
        <!-- MV 互动数据：mv_detail_info；收藏：mv_sub -->
        <span class="mp-data--stat">点赞 {{ mvStat.likedCount ?? 0 }}</span>
        <span class="mp-data--stat">评论 {{ mvStat.commentCount ?? 0 }}</span>
        <span class="mp-data--stat">分享 {{ mvStat.shareCount ?? 0 }}</span>
        <cm-button class="mp-data--sub-btn" :class="isSubed ? 'subed' : ''" :disabled="subLoading" @click="toggleMvSub">
          {{ isSubed ? '已收藏' : '收藏 MV' }}
        </cm-button>
        <span v-if="subTip" class="mp-data--tip">{{ subTip }}</span>
      </div>
    </div>

    <div class="mp-comment mt36">
      <div class="mp-comment-header">
        <h5>热门评论</h5>
        <span>{{ commentRes?.hotComments?.length }}条</span>
      </div>
      <cm-comment
        v-for="(item, index) in commentRes?.hotComments"
        :id="mvDetail?.id"
        :key="'comment-' + index"
        :comment-v-o="item"
        type="mv"
      ></cm-comment>
      <div class="mp-comment-header mt60">
        <h5>最新评论</h5>
        <span>{{ mvDetail?.commentCount }}条</span>
      </div>
      <cm-comment
        v-for="(item, index) in commentRes?.comments"
        :id="mvDetail?.id"
        :key="'comment-' + index"
        :comment-v-o="item"
        type="mv"
      ></cm-comment>
    </div>

    <!-- 相似推荐：simi_mv -->
    <cm-simi :id="mvDetail?.id" type="mv"></cm-simi>
  </div>
</template>

<script lang="ts" setup>
import { useMvplayView } from './hooks/useMvplayView';

const {
  mvPlayer,
  url,
  mvDetail,
  mvStat,
  isSubed,
  subLoading,
  subTip,
  commentRes,
  toggleMvSub,
} = useMvplayView();
</script>

<style scoped lang="less">
.mv-player {
  .mp-container {
    overflow: hidden;
    background: #262626;

    max-width: 1100px;
    padding-bottom: 24px;
    margin: 0 auto;

    video {
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 8px;
      background: #000;
    }

    .mp-info {
      display: flex;
      flex-direction: row;
      align-items: center;

      padding: 24px 24px 8px;
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
      padding: 0 24px;

      .iconfont {
        margin-right: 6px;
      }

      span,
      .iconfont {
        color: hsla(0, 0%, 100%, 0.6);
        font-size: 14px;
      }

      .mp-data--stat {
        margin-left: 16px;
      }

      .mp-data--sub-btn {
        margin-left: 20px;
        padding: 5px 16px;
        border: 1px solid var(--color-primary, #c20c0c);
        border-radius: 16px;
        background: var(--color-primary, #c20c0c);
        color: #fff;
        font-size: 13px;
        cursor: pointer;

        &.subed {
          background: transparent;
          color: #fff;
          border-color: hsla(0, 0%, 100%, 0.5);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .mp-data--tip {
        margin-left: 10px;
        font-size: 12px;
        color: hsla(0, 0%, 100%, 0.5);
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
