/*
 * @Description: 排行榜页（含榜单详情）
 * @Author: home-recommendation
 */
import { defineComponent, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import portal from '../portal/services/portal.service';
import { TopListTrack, TopSongItem, TopMvItem } from '../portal/services/portal-api';

export default defineComponent({
  name: 'Rank',
  setup() {
    const route = useRoute();

    onMounted(() => {
      portal.queryToplist();
      portal.queryTopPlaylistHighquality();
      portal.queryTopSong();
      portal.queryTopMv();
      // /rank_detail?id=xxx 时预选对应榜单（queryRankDetail 会同步写入 selectedRankId，
      // 不会被 queryToplist 的默认选中逻辑覆盖）
      const id = Number(route.query.id);
      if (id) {
        portal.queryRankDetail(id);
      }
    });

    // 切换榜单：复用状态层的 queryRankDetail(top_list)
    const selectRank = (id?: number) => {
      if (id == null) return;
      portal.queryRankDetail(id);
    };

    const formatTrackArtists = (track: TopListTrack): string => {
      return (track.ar || []).map((artist) => artist.name || '').join(' / ');
    };

    const formatSongArtists = (song: TopSongItem): string => {
      return (song.artists || []).map((artist) => artist.name || '').join(' / ');
    };

    const formatMvArtists = (mv: TopMvItem): string => {
      return (mv.artists || []).map((artist) => artist.name || '').join(' / ');
    };

    return {
      portal,
      selectRank,
      formatTrackArtists,
      formatSongArtists,
      formatMvArtists,
    };
  },
});
