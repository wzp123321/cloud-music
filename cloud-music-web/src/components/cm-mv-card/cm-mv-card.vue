<template>
<div class="cm-mv-card" @click="linkToMvPlay">
  <div class="cm-mv-card--cover">
    <cm-skeleton width="100%" :height="''" :image-url="coverImageUrl" source-type="image"> </cm-skeleton>
    <div class="duration flex-row-justify-center">
      <span><cm-icon name="icon-z" class="mr2"></cm-icon>{{ formatPlayCount(playCount) }}</span>
      <span>{{ formatDuration(duration) }}</span>
    </div>
  </div>
  <h6 :title="title">{{ title }}</h6>
  <div class="cm-mv-card--play-count">
    <span>{{ publishTime ?? '' }}</span>
  </div>
  <div class="cm-mv-card--icon">
    <cm-icon name="icon-24gf-play"></cm-icon>
  </div>
</div>

</template>

<script setup lang="ts">

// MV


import { formatPlayCount, formatDuration } from '@/core/utils';
import { useRouter } from 'vue-router';
defineOptions({ name: 'CMAMVCard' });
const props = defineProps({
    coverImageUrl: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    publishTime: {
      type: String,
      default: '',
    },
    id: {
      type: Number,
      default: 0,
    },
    playCount: {
      type: Number,
      default: 0,
    },
    // 时长（毫秒），配合 core/utils 的 formatDuration 使用
    duration: {
      type: Number,
      default: 0,
    },
  });
const router = useRouter();
    const linkToMvPlay = () => {
      router.push({
        path: '/mvplay',
        query: {
          mvid: props.id,
        },
      });
    };

    // props 在模板中可直接访问，无需再用 toRef 转发一次
    ;
</script>

<style lang="less" scoped>
.cm-mv-card {
  position: relative;
  width: 320px;
  overflow: hidden;

  h6 {
    color: var(--color-text-primary);
    font-weight: 400;
    font-size: 16px;
    height: 22px;
    line-height: 22px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 16px;
  }

  &--cover {
    position: relative;
    width: 320px;
    height: auto;
    aspect-ratio: 16 / 9;
    transition: all 0.75s;
    overflow: hidden;
    border: 1px solid var(--color-text-background);

    :deep(.cm-skeleton) img {
      width: 100%;
      height: 100%;
      transition: transform 0.75s;
    }

    &:hover :deep(.cm-skeleton) img {
      cursor: pointer;
      transform: scale(1.17);
      transform-origin: center center;
      transition: transform 0.75s cubic-bezier(0, 1, 0.75, 1);
    }

    .duration {
      width: 100%;
      height: 28px;
      line-height: 28px;
      padding: 3px 4px;
      position: absolute;
      bottom: 0;
      left: 0;
      color: var(--color-default);
      font-size: 14px;
      z-index: 1;
    }
  }

  &--play-count {
    margin-top: 10px;

    .iconfont.icon-z {
      font-size: 18px;
      margin-right: 4px;
    }

    span,
    .iconfont {
      color: #999;
    }
  }

  &--icon {
    position: absolute;
    left: 50%;
    top: 40%;
    transform: translate(-50%, -50%);
    width: 50px;
    height: 50px;
    text-align: center;
    background-color: var(--color-default);
    border-radius: 50%;
    cursor: pointer;
    display: none;
    transition: all 333ms;

    .iconfont {
      position: relative;
      top: 15px;
      color: var(--color-text-title);
      font-size: 24px;
    }
  }

  &:hover {
    .cm-mv-card--cover::after {
      content: '';
      width: 320px;
      height: 210px;
      position: absolute;
      top: 0;
      left: 0;
      background-color: rgba(0, 0, 0, 0.15);
      z-index: 1;
    }

    .cm-mv-card--icon {
      display: inline-block;
      transition: all 333ms;
    }
  }
}

</style>
