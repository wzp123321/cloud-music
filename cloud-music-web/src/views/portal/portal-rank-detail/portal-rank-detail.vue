<template>
<div class="portal-rank-detail flex flex-column">
  <cm-skeleton width="100%" :height="'234px'" :image-url="playlistVO?.coverImgUrl" source-type="image"> </cm-skeleton>
  <ul>
    <li
      v-for="(item, index) in playlistVO?.tracks"
      :key="'tracks' +index"
      class="mt23 flex-row-start-center"
      @click="linktToDetail"
    >
      <div class="sort">
        <img v-if="index === 0" src="../../../assets/images/rank/rank-top.png" alt="" />
        <img v-if="index === 1" src="../../../assets/images/rank/rank-secondary.png" alt="" />
        <img v-if="index === 2" src="../../../assets/images/rank/rank-third.png" alt="" />
        <span v-if="index > 2">{{ index + 1 }}</span>
      </div>
      <div class="info flex-column">
        <p class="name" :title="item.name">{{ item.name }}</p>
        <p class="mt4 artist" :title="formatSinger(item.ar)">{{ formatSinger(item.ar) }}</p>
      </div>
    </li>
  </ul>
</div>

</template>

<script lang="ts">
/*
 * @Description: 首页排行榜
 * @Author: zpwan
 * @Date: 2022-06-25 15:48:12
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-06-25 15:54:57
 */
import { defineComponent, PropType } from 'vue';
import { useRouter } from 'vue-router';

import { PlayListVO, SingerVO } from '../services/portal-api';

export default defineComponent({
  name: 'PortalRankDetail',
  props: {
    playlistVO: {
      type: Object as PropType<PlayListVO | null>,
      default: null,
    },
  },
  setup(props) {
    const router = useRouter();

    const formatSinger = (list?: SingerVO[]) => {
      return list?.map((item) => item.name).join('/') ?? '';
    };

    const linktToDetail = () => {
      const id = props.playlistVO?.id;
      if (!id) return;
      router.push({
        path: '/music_detail',
        query: {
          id: String(id),
        },
      });
    };
    // props 在模板中可直接访问，无需再用 toRef 转发一次
    return {
      formatSinger,
      linktToDetail,
    };
  },
});

</script>

<style lang="less" scoped>
.portal-rank-detail {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--color-default);

  img.cover-img {
    width: 100%;
    height: 234px;
  }

  ul {
    flex: 1 1 auto;
    padding: 5px 20px 26px;
    gap: 10px;
    box-shadow: 0 0 30px 0 rgb(65 67 70 / 8%);
  }

  .sort {
    img {
      width: 33px;
      height: 33px;
    }

    span {
      display: inline-block;
      text-align: center;
      width: 33px;
    }
  }

  .info {
    padding-left: 10px;
    flex: 1 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .info > p {
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 16px;
    font-weight: 400;
    height: 22px;
    line-height: 22px;
    cursor: pointer;
  }

  .info > p.artist {
    color: #999;
    transition: all 233ms;
  }

  .info > p.name:hover {
    transition: all 233ms;
    font-weight: 600;
  }

  .info > p.artist:hover {
    transition: all 233ms;
    color: #333;
  }
}

</style>
