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
  <div class="mt16 flex-wrap flex-row-justify-start">
    <cm-playlist-card
      v-for="(item, index) in portal.playList"
      :id="item.id"
      :key="'playlist_'+ index"
      :title="item.name"
      :cover-image-url="item.coverImgUrl"
      :play-count="item.playCount"
    ></cm-playlist-card>
  </div>

  <!-- 新碟上架 -->
  <cm-navbar :title="'新碟上架'" :has-load-more="false"></cm-navbar>
  <div class="portal-rank mt16 mb48">
    <port-rank-detail :playlist-v-o="portal.hotMusicRankVO"></port-rank-detail>
    <port-rank-detail :playlist-v-o="portal.newMusicRankVO"></port-rank-detail>
    <port-rank-detail :playlist-v-o="portal.surgeRankVO"></port-rank-detail>
    <port-rank-detail :playlist-v-o="portal.eaMusicRankVO"></port-rank-detail>
    <port-rank-detail :playlist-v-o="portal.krjpMusicRankVO"></port-rank-detail>
  </div>

  <!-- 新碟上架 -->
  <cm-navbar :title="'热门歌手'" :has-load-more="false"></cm-navbar>
  <ul class="portal-hot-artists mt24">
    <li
      v-for="(item, index) in portal.hotSingerList"
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
</div>

</template>

<script lang="ts">
/*
 * @Description: 首页
 * @Author: wanzp
 * @Date: 2022-06-09 22:15:56
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-06-25 16:06:44
 */
import { defineComponent, onMounted } from 'vue';
import { ElCarousel, ElCarouselItem } from 'element-plus';

import { usePortal } from './hooks/usePortal';

import RankDetail from './portal-rank-detail/portal-rank-detail.vue';
import PortalDragonBall from './portal-dragon-ball/portal-dragon-ball.vue';
import PortalBlockPage from './portal-block-page/portal-block-page.vue';

const portal = usePortal();

export default defineComponent({
  name: 'Portal',
  components: {
    'el-carousel': ElCarousel,
    'el-carousel-item': ElCarouselItem,
    'port-rank-detail': RankDetail,
    'portal-dragon-ball': PortalDragonBall,
    'portal-block-page': PortalBlockPage,
  },
  setup() {
    //初始化
    onMounted(() => {
      portal.init();
    });

    return {
      portal,
    };
  },
});

</script>

<style lang="less" scoped>
.portal {
  width: 1400px;
  margin: 0 auto;
  height: 100%;

  .el-carousel.banner-carousel {
    margin-top: 16px;

    img {
      width: 100%;
      height: 100%;
    }
  }

  &-rank {
    display: grid;
    grid-template-columns: repeat(5, 264px);
    grid-template-rows: repeat(1, 620px);
    gap: 20px;
    background-color: rgba(247, 247, 247, 1);
  }

  &-hot-artists {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    gap: 24px 100px;

    li {
      width: 182px;
      overflow: hidden;
      text-align: center;
      cursor: pointer;
    }

    li img {
      width: 182px;
      height: 182px;
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
