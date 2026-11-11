<template>
<div class="portal-dragon-ball">
  <ul>
    <li
      v-for="(item, index) in balls()"
      :key="'dragon_' + index"
      class="portal-dragon-ball--item"
      @click="linkTo(item)"
    >
      <cm-skeleton
        width="100%"
        :height="'68px'"
        :image-url="item.iconUrl"
        source-type="image"
        :border-radius="'50%'"
      ></cm-skeleton>
      <p class="name mt10">{{ item.name }}</p>
    </li>
  </ul>
</div>

</template>

<script setup lang="ts">

/*
 * @Description: 首页金刚区入口
 * @Author: home-recommendation
 */
import {  toRef } from 'vue';
import { useRouter } from 'vue-router';

import message from '@/utils/message';
import { usePortal } from '../hooks/usePortal';
import { DragonBallItem } from '../../../apis/portal/portal-api';

const portal = usePortal();

// 未登录/接口返回空时的兜底入口，保证首页金刚区始终可见可验证
const FALLBACK_BALLS: DragonBallItem[] = [
  { id: 'daily', name: '每日推荐', actionType: 'daily_recommend' },
  { id: 'playlist', name: '歌单', actionType: 'playlist' },
  { id: 'rank', name: '排行榜', actionType: 'rank' },
  { id: 'artists', name: '歌手', actionType: 'artists' },
  { id: 'new', name: '最新音乐', actionType: 'new' },
];

// 上游金刚区只给 orpheus:// scheme，站内按语义就近映射到已有页面
const NAME_ROUTES: Record<string, string> = {
  私人FM: '/play-interaction',
  有声书: '/dj-radio',
  数字专辑: '/album',
  关注新歌: '/feed',
  收藏家: '/user',
};
defineOptions({ name: 'PortalDragonBall' });
const router = useRouter();
    const dragonBallList = toRef(portal, 'dragonBallList');

    const balls = () => {
      const api = dragonBallList.value;
      return api && api.length ? api : FALLBACK_BALLS;
    };

    // 先按 actionType、再按名称映射、最后按中文关键词；都不命中只提示，不跳错页
    const linkTo = (item: DragonBallItem) => {
      const type = (item.actionType || '').toString();
      const name = (item.name || '').toString();
      const keyword = type || name;

      if (keyword.includes('daily')) {
        portal.linkToDailyRecommend();
        return;
      }
      if (keyword.includes('rank')) {
        portal.linkToRank();
        return;
      }
      if (keyword.includes('artist')) {
        router.push({ path: '/artists' });
        return;
      }
      if (keyword.includes('playlist')) {
        router.push({ path: '/playlist' });
        return;
      }
      if (keyword.includes('new')) {
        portal.linkToRank();
        return;
      }

      const mapped = NAME_ROUTES[name];
      if (mapped) {
        router.push({ path: mapped });
        return;
      }

      if (name.includes('每日') || name.includes('推荐')) {
        portal.linkToDailyRecommend();
        return;
      }
      if (name.includes('榜')) {
        portal.linkToRank();
        return;
      }
      if (name.includes('歌手')) {
        router.push({ path: '/artists' });
        return;
      }
      if (name.includes('歌单')) {
        router.push({ path: '/playlist' });
        return;
      }

      message.info(`「${name || '该入口'}」暂未开放`);
    };

    ;
</script>

<style lang="less" scoped>
.portal-dragon-ball {
  margin-top: 16px;
  background-color: var(--color-default);
  border-radius: 8px;

  // flex + center：入口数量变化时整组始终居中，不会把剩余空间堆在右侧
  ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px 28px;
    padding: 16px 8px;
  }

  &--item {
    display: flex;
    flex: 0 0 68px;
    flex-direction: column;
    align-items: center;
    width: 68px;
    text-align: center;
    cursor: pointer;
    transition: transform 233ms;

    &:hover {
      transform: translateY(-4px);
    }

    .name {
      max-width: 100%;
      font-size: 13px;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

</style>
