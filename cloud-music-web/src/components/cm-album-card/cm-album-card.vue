<template>
<div class="cm-album-card" @click="linkToAlbumDetail">
  <div class="cm-album-card--cover">
    <cm-skeleton width="100%" :height="'236px'" :image-url="coverImageUrl" source-type="image"> </cm-skeleton>
  </div>
  <h6 :title="title">{{ title }}</h6>
  <div class="cm-album-card--play-count">
    <span>{{ formatDate(publishTime, 'YYYY-MM-DD') }}</span>
  </div>
  <div class="cm-album-card--icon">
    <cm-icon name="icon-24gf-play"></cm-icon>
  </div>
</div>

</template>

<script setup lang="ts">

// 专辑卡片


import { formatDate } from '@/core/utils';
import { useRouter } from 'vue-router';
defineOptions({ name: 'CMAlbumCard' });
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
      type: Number,
      default: 0,
    },
    id: {
      type: Number,
      default: 0,
    },
  });

const router = useRouter();
// 专辑卡原先没有任何点击跳转，点封面/卡片无反应；此处补齐跳转到专辑详情
const linkToAlbumDetail = () => {
  if (props.id == null) return;
  router.push({ path: '/album_detail', query: { id: String(props.id) } });
};
;
</script>

<style lang="less" scoped>
.cm-album-card {
  position: relative;
  width: 251px;
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
    width: 251px;
    height: 195px;
    transition: all 0.75s;
    overflow: hidden;

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
    .cm-album-card--cover::after {
      content: '';
      width: 251px;
      height: 195px;
      position: absolute;
      top: 0;
      left: 0;
      background-color: rgba(0, 0, 0, 0.15);
      z-index: 1;
    }

    .cm-album-card--icon {
      display: inline-block;
      transition: all 333ms;
    }
  }
}

</style>
