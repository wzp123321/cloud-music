<template>
<div class="cm-album-card">
  <div class="cm-album-card--cover">
    <cm-skeleton width="100%" :height="'236px'" :image-url="coverImageUrl" source-type="image"> </cm-skeleton>
  </div>
  <h6 :title="title">{{ title }}</h6>
  <div class="cm-album-card--play-count">
    <span>{{ formatDate(publishTime, 'YYYY-MM-DD') }}</span>
  </div>
  <div class="cm-album-card--icon">
    <i class="iconfont icon-24gf-play"></i>
  </div>
</div>

</template>

<script lang="ts">
/*
 * @Descrption: 专辑卡片
 * @Author: wanzp
 * @Date: 2022-06-12 19:42:40
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-06-12 20:43:33
 */
import { defineComponent } from 'vue';

import { formatDate } from '@/core/utils';

export default defineComponent({
  name: 'CMAlbumCard',
  props: {
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
  },
  // props 在模板中可直接访问，无需再用 toRef 转发一次
  setup() {
    return {
      formatDate,
    };
  },
});

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
