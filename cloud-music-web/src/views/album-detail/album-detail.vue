<template>
<div id="album-detail">
  <div class="album-detail--left">
    <img :src="albumDetail?.info?.picUrl" alt="" />
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
      <button
        class="album-detail--sub-btn"
        :class="albumDetail.dynamic.isSub ? 'subed' : ''"
        :disabled="albumDetail.subLoading"
        @click="albumDetail.toggleSub()"
      >
        {{ albumDetail.dynamic.isSub ? '已订阅' : '订阅专辑' }}
      </button>
      <span v-if="albumDetail.actionTip" class="album-detail--tip">{{ albumDetail.actionTip }}</span>
    </div>

    <button radius primary style="width: 180px" class="mt12">
      <i class="iconfont icon-24gf-play mr6"></i>播放全部歌曲
    </button>

    <table style="width: 100%">
      <thead>
        <tr>
          <th style="width: 10%">序号</th>
          <th style="width: 30%">歌曲</th>
          <th style="width: 30%">专辑</th>
          <th style="width: 30%">时长</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in albumDetail?.songs" :key="'song_' + index">
          <td style="width: 10%" class="sort">
            <span>{{ index + 1 }}</span>
            <img :src="item?.al?.picUrl" alt="" loading="lazy" />
          </td>
          <td ellipsis style="width: 30%">
            <span class="mname">{{ item.name }}</span>
            <span class="tag">无损</span>
            <span class="mv">mv</span>
          </td>
          <td ellipsis style="width: 30%">{{ item.al.name }}</td>
          <td ellipsis style="width: 30%">
            <span class="dt">{{ formatDuration(item.dt) }}</span>
            <div class="op-btn flex-row-start-center">
              <i class="iconfont icon-24gf-play" @click="onPlay(index)"></i>
              <i class="iconfont icon-tianjia"></i>
              <i class="iconfont icon-jushoucang"></i>
              <i class="iconfont icon-xiazai"></i>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

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
          <img :src="item.picUrl" alt="" loading="lazy" />
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

/*
 * @Descrption: 专辑详情
 * @Author: wanzp
 * @Date: 2022-07-31 13:19:17
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-07-31 15:17:23
 */
import {  onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { FGetQueryParam } from '@/core/token';
import { useAlbumDetail } from './hooks/useAlbumDetail';

import { formatDate, formatDuration } from '../../core/utils';
import { usePlayerStore } from '@/store/player';

const albumDetail = useAlbumDetail();
defineOptions({ name: 'AlbumDetail' });
const router = useRouter();
    const player = usePlayerStore();

    onMounted(() => {
      albumDetail.query();
    });

    const resourceId = Number(FGetQueryParam('id') ?? 0);

    /** 播放专辑内第 index 首：接口原始结构转为播放器使用的扁平结构 */
    const onPlay = (index: number) => {
      const song = albumDetail.songs[index];
      if (!song) return;
      player.play({
        id: song.id,
        name: song.name,
        dt: song.dt,
        url: '',
        alName: song.al?.name ?? '',
        artist: song.ar?.map((item) => item.name).join('/') ?? '',
        picUrl: song.al?.picUrl ?? '',
      });
    };

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

    table tbody tr td {
      img {
        width: 32px;
      }
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
