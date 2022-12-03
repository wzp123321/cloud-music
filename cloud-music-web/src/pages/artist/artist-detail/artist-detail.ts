/*
 * @Descrption: 歌手详情
 * @Author: wanzp
 * @Date: 2022-07-06 21:24:06
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-09-27 20:32:34
 */
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';

import artistDetail from './services/artist-detail.service';

export default defineComponent({
  name: 'ArtistDetail',
  setup() {
    artistDetail.init();

    const router = useRouter();

    function handleMvPlay(mvid: number) {
      router.push({
        path: '/mvplay',
        query: {
          mvid,
        },
      });
    }

    return {
      artistDetail,
      handleMvPlay,
    };
  },
});
