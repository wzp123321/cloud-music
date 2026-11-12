<template>
  <div id="dj-program-detail" class="dj-program-detail">
    <cm-error v-if="detail.error" :text="'节目信息加载失败'"></cm-error>
    <div v-else-if="detail.program" class="dj-program-detail--body">
      <!-- 左栏：封面 + 播放 -->
      <section class="pd-cover">
        <cm-image :src="detail.program.coverUrl" alt="" loading="lazy" />
        <cm-button primary @click="playCurrent"><cm-icon name="icon-24gf-play"></cm-icon><span>播放节目</span></cm-button>
      </section>

      <!-- 右栏：信息 -->
      <div class="pd-info">
        <h5>{{ detail.program.name }}</h5>

        <p class="pd-radio mt16" @click="linkToRadio(detail.program.radio.id)">
          所属电台：{{ detail.program.radio.name }}
        </p>
        <p class="pd-anchor mt16" @click="linkToUser(detail.program.dj.userId)">
          主播：{{ detail.program.dj.nickname }}
        </p>

        <div class="pd-meta mt16">
          <label>分类：</label>
          <span class="mr48">{{ detail.program.categoryName || '未知' }}</span>
          <label>发布：</label>
          <span>{{ formatDate(detail.program.createTime, 'YYYY-MM-DD') }}</span>
        </div>

        <section class="flex-row-start-center mt16 pd-stats">
          <span>收听 {{ formatCount(detail.program.listenerCount) }}</span>
          <span class="ml24">点赞 {{ formatCount(detail.program.likedCount) }}</span>
          <span class="ml24">评论 {{ formatCount(detail.program.commentCount) }}</span>
          <span class="ml24">{{ formatDuration(detail.program.duration) }}</span>
        </section>

        <h6 class="pd-desc-title mt36 mb16">节目简介</h6>
        <p class="pd-desc">{{ detail.program.description || '暂无简介' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useDjProgramDetail } from './hooks/useDjProgramDetail';
import { formatDate, formatDuration } from '../../core/utils';
import { usePlayerStore } from '@/store/player';
import { Common_IMusic } from '@/apis/common/index.api';

defineOptions({ name: 'DjProgramDetail' });
const detail = useDjProgramDetail();
const router = useRouter();
const player = usePlayerStore();

onMounted(() => {
  detail.query();
});

/** 大数字缩写：1.2万 / 3.4亿 */
const formatCount = (n?: number): string => {
  if (n == null) return '0';
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return String(n);
};

const linkToRadio = (rid?: number) => {
  if (!rid) return;
  router.push({ path: '/dj-radio-detail', query: { rid: String(rid) } });
};

const linkToUser = (userId?: number) => {
  if (!userId) return;
  router.push({ path: '/user', query: { id: String(userId) } });
};

/** 播放当前节目：节目音频即其 mainSong（歌曲），复用现有播放器 */
const playCurrent = () => {
  const p = detail.program;
  if (!p?.mainSong?.id) return;
  const music: Common_IMusic = {
    id: p.mainSong.id,
    name: p.name,
    dt: p.mainSong.duration,
    url: '',
    alName: p.radio.name,
    artist: p.dj.nickname,
    picUrl: p.coverUrl,
  };
  player.play(music);
};
</script>

<style lang="less" scoped>
.dj-program-detail {
  width: 100%;
  height: 100%;
  padding-top: 36px;

  &--body {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 64px;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
      gap: 24px;
    }
  }

  .pd-cover {
    text-align: center;

    img {
      width: 100%;
      border-radius: 8px;
    }

    button {
      width: 240px;
      border-radius: 32px;
      margin-top: 12px;
    }
  }

  .pd-info {
    h5 {
      word-break: break-all;
      font-size: 30px;
      font-weight: 700;
      line-height: 42px;
      color: var(--color-text);
      margin-top: 42px;
    }

    p {
      cursor: pointer;
      margin-right: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--color-text-primary);

      &.pd-radio:hover,
      &.pd-anchor:hover {
        color: var(--color-primary, #c20c0c);
      }
    }

    .pd-meta {
      font-size: 14px;
      color: var(--color-text-secondary);

      label {
        display: inline-block;
        height: 22px;
        line-height: 22px;
      }
    }

    .pd-stats {
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .pd-desc-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-title, #333);
    }

    .pd-desc {
      font-size: 14px;
      color: #666;
      line-height: 22px;
      white-space: pre-wrap;
    }
  }
}
</style>
