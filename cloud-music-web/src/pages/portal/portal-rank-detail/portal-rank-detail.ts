/*
 * @Description: 首页排行榜
 * @Author: zpwan
 * @Date: 2022-06-25 15:48:12
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-06-25 15:54:57
 */
import { defineComponent, PropType, toRef } from 'vue';

import { PlayListVO } from '../services/portal-api';

export default defineComponent({
  name: 'PortalRankDetail',
  props: {
    playlistVO: {
      type: Object as PropType<PlayListVO>,
      default: {},
    },
  },
  setup(props) {
    const playlistVO = toRef(props, 'playlistVO');

    return {
      playlistVO,
    };
  },
});
