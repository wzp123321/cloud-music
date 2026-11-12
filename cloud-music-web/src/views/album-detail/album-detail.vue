<template>
<div id="album-detail">
  <div class="album-detail--left">
    <cm-image :src="albumDetail?.info?.picUrl" alt="" />
    <h5 class="mt48 mb16">专辑简介</h5>
    <p>{{ albumDetail?.info?.description }}</p>
  </div>
  <div class="album-detail--right">
    <h5 class="mt16 mb16">{{ albumDetail?.info?.name }}</h5>
    <p>{{albumDetail?.info?.artist?.name}}</p>
    <div class="flex-row-start-center mt12">
      <label>发行时间：</label>
      <span class="mr48">{{ formatDate(albumDetail?.info?.publishTime, 'YYYY-MM-DD') }}</span>
      <label>评论：</label>
      <span class="mr48">{{ albumDetail?.info?.info?.commentCount }}</span>
      <label>分享：</label>
      <span>{{ albumDetail?.info?.info?.shareCount }}</span>
    </div>
    <!-- 专辑动态：album_detail_dynamic；订阅：album_sub -->
    <div class="album-detail--dynamic mt12">
      <span>动态评论 {{ albumDetail.dynamic.commentCount ?? 0 }}</span>
      <span>点赞 {{ albumDetail.dynamic.likedCount ?? 0 }}</span>
      <span>分享 {{ albumDetail.dynamic.shareCount ?? 0 }}</span>
      <span>收藏 {{ albumDetail.dynamic.subCount ?? 0 }}</span>
      <cm-button
        class="album-detail--sub-btn"
        :class="albumDetail.dynamic.isSub ? 'subed' : ''"
        :disabled="albumDetail.subLoading"
        @click="albumDetail.toggleSub()"
      >
        {{ albumDetail.dynamic.isSub ? '已订阅' : '订阅专辑' }}
      </cm-button>
      <span v-if="albumDetail.actionTip" class="album-detail--tip">{{ albumDetail.actionTip }}</span>
    </div>

    <cm-button radius primary style="width: 180px" class="mt12">
      <cm-icon name="icon-24gf-play" class="mr6"></cm-icon>播放全部歌曲
    </cm-button>

    <!-- 歌曲列表复用 cm-table：封面、歌名跳转、播放、操作按钮统一由组件提供 -->
    <cm-table :data-source="songList"></cm-table>

    <!-- 已收藏专辑：album_sublist（需登录，未登录降级提示） -->
    <div class="album-detail--sublist mt36">
      <h5 class="mb16">我收藏的专辑</h5>
      <p v-if="albumDetail.sublistNeedLogin" class="album-detail--tip">登录后查看已收藏专辑</p>
      <cm-error v-else-if="!albumDetail.subAlbums.length" :title="'暂无收藏专辑'"></cm-error>
      <div v-else class="album-detail--sublist-grid grid-cols-6">
        <div
          v-for="(item, index) in albumDetail.subAlbums"
          :key="'sub_' + index"
          class="album-detail--sublist-item"
          @click="linkToAlbum(item.id)"
        >
          <cm-image :src="item.picUrl" alt="" loading="lazy" />
          <p :title="item.name">{{ item.name }}</p>
        </div>
      </div>
    </div>

    <!-- 评论区：comment_album，支持点赞/热评/楼层/发评 -->
    <cm-comment :id="resourceId" type="album"></cm-comment>
    <!-- 相似推荐：simi_song（取专辑内歌曲） -->
    <cm-simi :id="albumDetail?.songs?.[0]?.id" type="song" title="相似歌曲"></cm-simi>
  </div>
</div>

</template>

<script setup lang="ts">

// 专辑详情
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { FGetQueryParam } from '@/core/token';
import { useAlbumDetail } from './hooks/useAlbumDetail';

import { formatDate } from '../../core/utils';
import type { Common_IMusic } from '../../apis/common/index.api';

const albumDetail = useAlbumDetail();
defineOptions({ name: 'AlbumDetail' });
const router = useRouter();

    onMounted(() => {
      albumDetail.query();
    });

    const resourceId = Number(FGetQueryParam('id') ?? 0);

    /** 接口原始歌曲结构 → cm-table / 播放器使用的扁平结构 */
    const songList = computed<Common_IMusic[]>(() =>
      (albumDetail.songs ?? []).map((song) => ({
        id: song.id,
        name: song.name,
        dt: song.dt,
        url: '',
        alName: song.al?.name ?? '',
        artist: song.ar?.map((item) => item.name).join('/') ?? '',
        picUrl: song.al?.picUrl ?? '',
      })),
    );

    /** 收藏专辑列表 → 专辑详情，参数 id ← album_sublist.data[].id */
    const linkToAlbum = (id?: number) => {
      if (!id) return;
      router.push({ path: '/album_detail', query: { id: String(id) } });
    };

    ;
</script>

<style lang="less" scoped>
#album-detail {
  display: grid;
  grid-template-columns: 280px auto;
  column-gap: 128px;
  width: 100%;
  height: 100%;
  padding: 48px 0 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    column-gap: 0;
  }

  .album-detail--left {
    position: relative;

    &::before {
      content: url('../../assets/images/album/album-cover.png');
      position: absolute;
      right: -64px;
      top: 0;
    }

    > img {
      width: 100%;
      height: auto;
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
    }
  }

  .album-detail--right {
    h5 {
      overflow: hidden;
      word-break: break-all;
      font-size: 30px;
      font-weight: 600;
      line-height: 42px;
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
    }

    p {
      word-break: break-all;
      margin-top: 14px;
      font-size: 18px;
      color: #666;
      line-height: 25px;
    }

    span,
    label {
      display: inline-block;
      height: 22px;
      line-height: 22px;
      color: var(--color-text-secondary);
    }

    button {
      font-size: 16px;
    }

  }
}

.album-detail--dynamic {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: var(--color-text-secondary, #666);
}

.album-detail--sub-btn {
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

.album-detail--tip {
  font-size: 12px;
  color: #999;
}

.album-detail--sublist {
  h5 {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-title, #333);
  }
}

.album-detail--sublist-grid {
  display: grid;
  gap: 16px;
}

.album-detail--sublist-item {
  cursor: pointer;

  img {
    width: 100%;
    border-radius: 6px;
  }

  p {
    margin-top: 6px;
    font-size: 13px;
    color: #666;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

</style>
