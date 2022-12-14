/*
 * @Description: 首页排行榜
 * @Author: zpwan
 * @Date: 2022-06-25 15:48:12
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-06-25 15:54:57
 */
import { defineComponent, PropType, toRef } from 'vue';
import { useRouter } from 'vue-router';

import { PlayListVO, SingerVO } from '../services/portal-api';

export default defineComponent({
  name: 'PortalRankDetail',
  props: {
    playlistVO: {
      type: Object as PropType<PlayListVO>,
      default: {},
    },
  },
  setup(props) {
    const router = useRouter();
    const playlistVO = toRef(props, 'playlistVO');

    const formatSinger = (list: SingerVO[]) => {
      return list?.map((item) => item.name).join('/');
    };

    const linktToDetail = () => {
      router.push({
        path: '/music_detail',
        query: {
          id: props.playlistVO.id,
        },
      });
    };
    return {
      playlistVO,

      formatSinger,
      linktToDetail,
    };
  },
});
