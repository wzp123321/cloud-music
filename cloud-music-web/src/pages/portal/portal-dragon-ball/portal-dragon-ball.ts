/*
 * @Description: 首页金刚区入口
 * @Author: home-recommendation
 */
import { defineComponent, toRef } from 'vue';
import { useRouter } from 'vue-router';

import portal from '../services/portal.service';
import { DragonBallItem } from '../services/portal-api';

// 未登录/接口返回空时的兜底入口，保证首页金刚区始终可见可验证
const FALLBACK_BALLS: DragonBallItem[] = [
  { id: 'daily', name: '每日推荐', actionType: 'daily_recommend' },
  { id: 'playlist', name: '歌单', actionType: 'playlist' },
  { id: 'rank', name: '排行榜', actionType: 'rank' },
  { id: 'artists', name: '歌手', actionType: 'artists' },
  { id: 'new', name: '最新音乐', actionType: 'new' },
];

export default defineComponent({
  name: 'PortalDragonBall',
  setup() {
    const router = useRouter();
    const dragonBallList = toRef(portal, 'dragonBallList');

    const balls = () => {
      const api = dragonBallList.value;
      return api && api.length ? api : FALLBACK_BALLS;
    };

    // 根据入口语义跳转到对应页面
    const linkTo = (item: DragonBallItem) => {
      const type = (item.actionType || '').toString();
      const name = (item.name || '').toString();
      const keyword = type || name;
      if (keyword.includes('daily') || name.includes('每日') || name.includes('推荐')) {
        portal.linkToDailyRecommend();
        return;
      }
      if (keyword.includes('rank') || name.includes('榜')) {
        portal.linkToRank();
        return;
      }
      if (keyword.includes('artist') || name.includes('歌手')) {
        router.push({ path: '/artists' });
        return;
      }
      if (keyword.includes('playlist') || name.includes('歌单')) {
        router.push({ path: '/playlist' });
        return;
      }
      if (keyword.includes('new') || name.includes('新')) {
        portal.linkToRank();
        return;
      }
      // 兜底：有可识别 id 的歌单/专辑跳转
      if (item.id != null) {
        portal.linkToPlaylist(item.id);
      }
    };

    return {
      balls,
      linkTo,
    };
  },
});
