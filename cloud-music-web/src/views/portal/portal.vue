<template>
<div class="portal">
  <!-- banner -->
  <el-carousel :interval="4000" type="card" class="banner-carousel" height="320px">
    <el-carousel-item
      v-for="item in portal.bannerList"
      :key="'banner' + item.encodeId"
      @click="portal.handleBannerLinkTo(item.url, item.targetType, item.targetId)"
    >
      <cm-skeleton width="100%" :height="'320px'" :image-url="item.imageUrl" source-type="image" :border-radius="'none'">
      </cm-skeleton>
    </el-carousel-item>
  </el-carousel>

  <!-- 金刚区 -->
  <portal-dragon-ball></portal-dragon-ball>

  <!-- 首页区块瀑布流 -->
  <portal-block-page></portal-block-page>

  <!-- 推荐歌单 -->
  <cm-navbar
    v-model:selected-code="portal.selectedRecommendPlayListType"
    :title="'推荐歌单'"
    :navs="portal.recommendPlayListNavs"
    :load-more-url="'/playlist'"
    @change="portal.queryPlayListByType"
  ></cm-navbar>
  <div class="portal-playlist-grid grid-cols-5 mt16">
    <cm-playlist-card
      v-for="(item, index) in portal.playList.slice(0, 5)"
      :id="item.id"
      :key="'playlist_'+ index"
      :title="item.name"
      :cover-image-url="item.coverImgUrl"
      :play-count="item.playCount"
    ></cm-playlist-card>
  </div>

  <!-- 次要板块默认收起，避免首屏过长 -->
  <div class="portal-secondary-toggle">
    <cm-button type="button" @click="showSecondary = !showSecondary">
      {{ showSecondary ? '收起榜单与热门歌手' : '展开榜单与热门歌手' }}
    </cm-button>
  </div>
  <template v-if="showSecondary">
    <!-- 榜单 -->
    <cm-navbar :title="'排行榜'" :has-load-more="false"></cm-navbar>
    <div class="portal-rank grid-cols-5 mt16 mb48">
      <port-rank-detail :playlist-v-o="portal.hotMusicRankVO"></port-rank-detail>
      <port-rank-detail :playlist-v-o="portal.newMusicRankVO"></port-rank-detail>
      <port-rank-detail :playlist-v-o="portal.surgeRankVO"></port-rank-detail>
      <port-rank-detail :playlist-v-o="portal.eaMusicRankVO"></port-rank-detail>
      <port-rank-detail :playlist-v-o="portal.krjpMusicRankVO"></port-rank-detail>
    </div>

    <!-- 热门歌手 -->
    <cm-navbar :title="'热门歌手'" :has-load-more="false"></cm-navbar>
    <ul class="portal-hot-artists mt24">
      <li
        v-for="(item, index) in portal.hotSingerList.slice(0, 5)"
        :key="'artist_'+ index"
        class="flex-column"
        @click="portal.linkToAritstDetail(item.id)"
      >
        <cm-skeleton width="100%" :height="'182px'" :image-url="item?.img1v1Url" source-type="image" :border-radius="'50%'">
        </cm-skeleton>
        <p class="artist mt17" :title="item?.name">{{ item?.name }}</p>
        <p class="count mt6">{{ item?.musicSize }}首歌</p>
      </li>
    </ul>
  </template>
</div>

</template>

<script setup lang="ts">

// 首页
import { onMounted, ref } from 'vue';
import { ElCarousel, ElCarouselItem } from 'element-plus';

import { usePortal } from './hooks/usePortal';

import PortRankDetail from './portal-rank-detail/portal-rank-detail.vue';
import PortalDragonBall from './portal-dragon-ball/portal-dragon-ball.vue';
import PortalBlockPage from './portal-block-page/portal-block-page.vue';

const portal = usePortal();
defineOptions({ name: 'Portal' });
const showSecondary = ref<boolean>(false);
//初始化
    onMounted(() => {
      portal.init();
    });

    ;
</script>

<style lang="less" scoped>
.portal {
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding-left: 24px;
  padding-right: 24px;
  height: 100%;

  .el-carousel.banner-carousel {
    margin-top: 16px;

    img {
      width: 100%;
      height: 100%;
    }
  }

  // 与其他板块统一：容器全宽 5 列等分，左右边缘严格对齐
  &-playlist-grid {
    display: grid;
    gap: 0 20px;

    :deep(.cm-playlist-card) {
      width: 100%;
      margin-bottom: 0;
    }
  }

  &-secondary-toggle {
    display: flex;
    justify-content: center;
    padding: 8px 0 20px;

    button {
      padding: 8px 28px;
      border: 1px solid #e0e0e0;
      border-radius: 20px;
      background: #fff;
      color: #666;
      font-size: 14px;
      cursor: pointer;
      transition: color 233ms, border-color 233ms;

      &:hover {
        color: #333;
        border-color: #bbb;
      }
    }
  }

  &-rank {
    display: grid;
    justify-content: center;
    gap: 20px;
    background-color: rgba(247, 247, 247, 1);
  }

  &-hot-artists {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    justify-content: center;
    gap: 24px;

    li {
      width: 100%;
      overflow: hidden;
      text-align: center;
      cursor: pointer;
    }

    li img {
      width: 100%;
      height: auto;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
    }

    li > p.artist {
      height: 22px;
      font-size: 16px;
      line-height: 22px;
      font-weight: 400;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      justify-content: center;
      padding: 0 5px;
    }

    li > p.count {
      font-size: 12px;
      color: #999;
    }
  }
}

</style>
