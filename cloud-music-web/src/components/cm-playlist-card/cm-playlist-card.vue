<template>
<div class="cm-playlist-card" :style="{ '--card-size': size + 'px' }" @click="linkToDetailPage(id)">
  <div class="cm-playlist-card--cover">
    <cm-skeleton width="100%" :height="size + 'px'" :image-url="coverImageUrl" source-type="image"> </cm-skeleton>
    <span v-if="tag" class="cm-playlist-card--tag">{{ tag }}</span>
  </div>
  <h6 :title="title">{{ title }}</h6>
  <div class="cm-playlist-card--play-count">
    <i class="iconfont icon-z"></i>
    <span>{{ playCount }}</span>
  </div>
  <p v-if="creator" class="cm-playlist-card--creator">by {{ creator }}</p>
</div>

</template>

<script setup lang="ts">

/*
 * @Descrption: 歌单卡片
 * @Author: wanzp
 * @Date: 2022-06-12 19:42:40
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-06-12 20:43:33
 */
import { useRouter } from 'vue-router';
defineOptions({ name: 'CMPlayListCard' });
defineProps({
    coverImageUrl: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    playCount: {
      type: Number,
      default: 0,
    },
    id: {
      type: Number,
      default: 0,
    },
    // 扩展：创作者名称（分类/精品浏览展示）
    creator: {
      type: String,
      default: '',
    },
    // 扩展：分类/标签角标
    tag: {
      type: String,
      default: '',
    },
    // 封面边长；首页等信息密度高的场景可传小尺寸，其他页面保持 262px 默认值
    size: {
      type: Number,
      default: 262,
    },
  });
const router = useRouter();
    const linkToDetailPage = (id: number) => {
      router.push({
        path: '/playlist_detail',
        query: {
          id: String(id),
        },
      });
    };

    // props 在模板中可直接访问，无需再用 toRef 转发一次
    ;
</script>

<style lang="less" scoped>
.cm-playlist-card {
  width: var(--card-size, 262px);
  min-height: calc(var(--card-size, 262px) + 88px);
  overflow: hidden;
  margin-bottom: 24px;

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
    width: var(--card-size, 262px);
    height: var(--card-size, 262px);
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

  &--tag {
    position: absolute;
    left: 0;
    top: 0;
    padding: 2px 8px;
    background-color: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 12px;
  }

  &--creator {
    margin-top: 6px;
    font-size: 12px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

</style>
