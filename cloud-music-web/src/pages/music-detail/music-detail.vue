<template>
  <div id="music-detail" class="music-detail">
    <section class="md-cover">
      <cm-skeleton
        width="100%"
        :height="'320px'"
        :image-url="musicDetail?.al?.picUrl"
        source-type="image"
        :border-radius="'none'"
      >
      </cm-skeleton>
      <button primary><i class="iconfont icon-xiazai mr6"></i> 下载这首歌</button>
    </section>
    <div class="md-info">
      <h5>{{ musicDetail?.al?.name }}</h5>
      <p class="mt16">{{ musicDetail?.ar?.[0]?.name }}</p>
      <p class="mt16 time">
        <label>发行时间：</label>
        <span>{{ formatDate(musicDetail?.publishTime, 'YYYY-MM-DD') }}</span>
      </p>
      <section class="flex-row-start-center mt16">
        <button primary><i class="iconfont icon-24gf-play"></i><span>播放歌曲</span></button>
        <button><i class="iconfont icon-tianjia"></i><span>添加</span></button>
        <button><i class="iconfont icon-jushoucang"></i><span>收藏</span></button>
        <button><i class="iconfont icon-fenxiang"></i><span>分享</span></button>
        <button><i class="iconfont icon-pinglun"></i><span>评论</span></button>
      </section>

      <!-- 评论区：comment_music -->
      <cm-comment :id="musicDetail?.id" type="music"></cm-comment>
      <!-- 相似推荐：simi_song / simi_user -->
      <cm-simi :id="musicDetail?.id" type="song"></cm-simi>
      <cm-simi :id="musicDetail?.id" type="user"></cm-simi>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, watch } from 'vue';

import { AD_IMusicVO } from '../artist/artist-detail/services/artist-detail-api';
import { useMusicDetail } from './music-detail.service';

import { formatDate } from '../../core/utils';
import { useRequest } from '@/composables/useRequest';

const musicDetailService = useMusicDetail();
// 统一经 useRequest 发起请求，loading / error 状态由通用 composable 收敛
const { run: runQuery } = useRequest(() => musicDetailService.query());
runQuery();

const musicDetail = ref<AD_IMusicVO>({
  name: '',
  id: 0,
  ar: [],
  alia: [],
  al: {
    id: 0,
    name: '',
    picUrl: '',
    pic_str: '',
    pic: 0,
  },
  dt: 0,
  copyright: 0,
  mark: 0,
  publishTime: 0,
});

// 订阅歌曲详情状态，immediate 保证首屏同步到当前值
watch(
  musicDetailService.musicDetail$,
  (v) => {
    musicDetail.value = v;
  },
  { immediate: true },
);
</script>
<style lang="less" scoped>
#music-detail {
  width: 100%;
  height: 100%;

  padding-top: 36px;

  display: grid;
  grid-template-columns: 320px 1fr;

  gap: 64px;

  .md-cover {
    text-align: center;

    img {
      width: 100%;
    }

    button {
      width: 240px;
      border-radius: 32px;

      margin-top: 12px;
    }
  }

  .md-info {
    h5 {
      word-break: break-all;
      font-size: 30px;
      font-weight: 600;
      line-height: 42px;

      color: var(--color-text);
      font-weight: 700;

      margin-top: 42px;
    }

    p {
      cursor: pointer;
      margin-right: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      color: var(--color-text-primary);

      &.time {
        label {
          color: var(--color-text-secondary);
        }

        font-size: 14px;
      }
    }

    section {
      button {
        border-radius: 32px;

        color: var(--color-text-primary);
        font-size: 16px;

        line-height: 22px;

        display: flex;
        align-items: center;

        i {
          margin-right: 6px;
        }
      }

      button:not([primary]) {
        background: #f2f2f2;

        border: none;

        padding-left: 24px;
        padding-right: 24px;
      }

      button + button {
        margin-left: 16px;
      }
    }
  }
}
</style>
