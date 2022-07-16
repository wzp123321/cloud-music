import { ref } from 'vue';
/*
 * @Description: 底部音乐播放
 * @Author: zpwan
 * @Date: 2022-07-16 13:52:03
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-07-16 16:12:59
 */
import { defineComponent } from 'vue';

import player from './play-controller.service';

import { formatDuration } from '@/core/utils';

export default defineComponent({
  name: 'PlayController',
  setup() {
    const locked = ref<boolean>(true);

    // 锁定与否
    const handleLockorNot = () => {
      locked.value = !locked.value;
    };

    return {
      player,
      locked,

      handleLockorNot,
      formatDuration,
    };
  },
});
