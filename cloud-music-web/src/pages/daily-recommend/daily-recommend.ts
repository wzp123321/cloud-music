/*
 * @Description: 每日推荐页
 * @Author: home-recommendation
 */
import { defineComponent, onMounted } from 'vue';

import portal from '../portal/services/portal.service';
import { RecommendSongItem, PersonalizedNewSongItem } from '../portal/services/portal-api';

export default defineComponent({
  name: 'DailyRecommend',
  setup() {
    // 直接访问该路由时也保证数据可用（不依赖先经过首页 init）
    onMounted(() => {
      portal.queryRecommendSongs();
      portal.queryRecommendResource();
      portal.queryPersonalized();
      portal.queryNewSong();
    });

    const formatArtists = (song: RecommendSongItem): string => {
      return (song.artists || []).map((artist) => artist.name || '').join(' / ');
    };

    const formatNewSongArtists = (item: PersonalizedNewSongItem): string => {
      return (item.song?.artists || []).map((artist) => artist.name || '').join(' / ');
    };

    // 包装一层，过滤掉可选 id，保证传入 dislikeRecommendSong 的一定为 number
    const handleDislike = (id?: number) => {
      if (id == null) return;
      portal.dislikeRecommendSong(id);
    };

    return {
      portal,
      formatArtists,
      formatNewSongArtists,
      handleDislike,
    };
  },
});
