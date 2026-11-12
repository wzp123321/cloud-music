<template>
  <div id="dj-radio-detail" class="dj-radio-detail">
    <cm-error v-if="detail.error" :text="'电台信息加载失败'"></cm-error>
    <div v-else-if="detail.radio" class="dj-radio-detail--body">
      <!-- 左栏：封面 + 简介 -->
      <div class="dj-radio-detail--left">
        <cm-image :src="detail.radio.picUrl" alt="" loading="lazy" />
        <h5 class="mt48 mb16">电台简介</h5>
        <p>{{ detail.radio.desc || '暂无简介' }}</p>
      </div>

      <!-- 右栏：信息 + 节目列表 -->
      <div class="dj-radio-detail--right">
        <h5 class="mt16 mb16">{{ detail.radio.name }}</h5>
        <div class="dj-radio-detail--anchor" @click="linkToUser(detail.radio.dj.userId)">
          <cm-image :src="detail.radio.dj.avatarUrl" alt="" />
          <span>{{ detail.radio.dj.nickname }}</span>
        </div>

        <div class="dj-radio-detail--meta">
          <label>分类：</label>
          <span class="mr48">{{ detail.radio.category }}{{ detail.radio.secondCategory ? ' / ' + detail.radio.secondCategory : '' }}</span>
          <label>创建：</label>
          <span>{{ formatDate(detail.radio.createTime, 'YYYY-MM-DD') }}</span>
        </div>

        <div class="dj-radio-detail--stats">
          <span>订阅 {{ formatCount(detail.radio.subCount) }}</span>
          <span>节目 {{ detail.radio.programCount }}</span>
          <span>评论 {{ formatCount(detail.radio.commentCount) }}</span>
          <span>播放 {{ formatCount(detail.radio.playCount) }}</span>
        </div>

        <cm-button
          class="dj-radio-detail--sub-btn"
          :class="detail.isSub ? 'subed' : ''"
          :disabled="detail.subLoading"
          @click="onSub"
        >
          {{ detail.isSub ? '已订阅' : '订阅电台' }}
        </cm-button>

        <h6 class="dj-radio-detail--list-title mt36 mb16">节目列表（{{ detail.programs.length }}）</h6>
        <ul class="dj-radio-detail--programs">
          <li
            v-for="(p, idx) in detail.programs"
            :key="'program_' + p.id"
            class="dj-radio-detail--program"
            @click="linkToProgram(p.id)"
          >
            <span class="sort">{{ p.serialNum || idx + 1 }}</span>
            <cm-image class="cover" :src="p.coverUrl" alt="" loading="lazy" />
            <div class="info">
              <p class="name" :title="p.name">{{ p.name }}</p>
              <p class="sub">
                <span>收听 {{ formatCount(p.listenerCount) }}</span>
                <span class="ml16">{{ formatDuration(p.duration) }}</span>
              </p>
            </div>
            <cm-icon name="icon-24gf-play" class="play" @click.stop="playProgram(p)"></cm-icon>
          </li>
          <li v-if="!detail.programs.length" class="dj-radio-detail--empty">该电台暂无节目</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useDjRadioDetail } from './hooks/useDjRadioDetail';
import { formatDate, formatDuration } from '../../core/utils';
import { usePlayerStore } from '@/store/player';
import { Common_IMusic } from '@/apis/common/index.api';
import message from '@/utils/message';

import { hasLogin } from '@/apis/content-enhance/content-enhance.service';

defineOptions({ name: 'DjRadioDetail' });
const detail = useDjRadioDetail();
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

const linkToUser = (userId?: number) => {
  if (!userId) return;
  router.push({ path: '/user', query: { id: String(userId) } });
};

const linkToProgram = (id?: number) => {
  if (!id) return;
  router.push({ path: '/dj-program-detail', query: { id: String(id) } });
};

/** 播放单个节目：节目音频即其 mainSong（歌曲），复用现有播放器 */
const playProgram = (p: { id: number; name: string; coverUrl: string; duration: number; mainSong: { id: number; name: string; duration: number } }) => {
  if (!p?.mainSong?.id) return;
  const music: Common_IMusic = {
    id: p.mainSong.id,
    name: p.name,
    dt: p.mainSong.duration,
    url: '',
    alName: detail.radio?.name ?? '',
    artist: detail.radio?.dj?.nickname ?? '',
    picUrl: p.coverUrl,
  };
  player.play(music);
};

const onSub = () => {
  if (!hasLogin()) {
    message.info('登录后可使用订阅功能');
    return;
  }
  detail.toggleSub();
};
</script>

<style lang="less" scoped>
.dj-radio-detail {
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

  &--left {
    > img {
      width: 100%;
      border-radius: 8px;
    }

    > h5 {
      font-size: 22px;
      font-weight: 600;
      height: 30px;
      line-height: 30px;
      color: var(--color-text-title);
    }

    > p {
      font-size: 14px;
      color: #666;
      line-height: 21px;
      text-indent: 2em;
      white-space: pre-wrap;
    }
  }

  &--right {
    h5 {
      overflow: hidden;
      word-break: break-all;
      font-size: 30px;
      font-weight: 700;
      line-height: 42px;
      color: var(--color-text);
    }

    .dj-radio-detail--anchor {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-top: 16px;
      cursor: pointer;

      img {
        width: 36px;
        height: 36px;
        border-radius: 50%;
      }

      span {
        font-size: 16px;
        color: var(--color-text-primary);
      }

      &:hover span {
        color: var(--color-primary, #c20c0c);
      }
    }

    .dj-radio-detail--meta {
      margin-top: 16px;
      font-size: 14px;
      color: var(--color-text-secondary);

      label {
        display: inline-block;
        height: 22px;
        line-height: 22px;
      }
    }

    .dj-radio-detail--stats {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 16px;
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .dj-radio-detail--sub-btn {
      margin-top: 16px;
      padding: 5px 16px;
      border: 1px solid var(--color-primary, #c20c0c);
      border-radius: 16px;
      background: var(--color-primary, #c20c0c);
      color: #fff;
      font-size: 14px;
      cursor: pointer;

      &.subed {
        background: transparent;
        color: var(--color-primary, #c20c0c);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .dj-radio-detail--list-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-title, #333);
    }
  }

  &--programs {
    list-style: none;
    padding: 0;
  }

  &--program {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 6px;
    border-bottom: 1px solid #f3f3f3;
    cursor: pointer;

    &:hover {
      background: #fafafa;

      .play {
        opacity: 1;
      }
    }

    .sort {
      width: 28px;
      text-align: center;
      color: #aaa;
      font-size: 13px;
    }

    .cover {
      width: 56px;
      height: 56px;
      border-radius: 6px;
      object-fit: cover;
    }

    .info {
      flex: 1;
      min-width: 0;

      .name {
        font-size: 15px;
        color: #333;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .sub {
        margin-top: 6px;
        font-size: 12px;
        color: #999;
      }
    }

    .play {
      font-size: 20px;
      color: var(--color-primary, #c20c0c);
      opacity: 0.55;
      cursor: pointer;
      transition: opacity 233ms;
    }
  }

  &--empty {
    padding: 20px 0;
    color: #bbb;
    font-size: 13px;
  }
}
</style>
