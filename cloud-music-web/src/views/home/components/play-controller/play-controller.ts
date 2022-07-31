import { ref } from 'vue';
/*
 * @Description: 底部音乐播放
 * @Author: zpwan
 * @Date: 2022-07-16 13:52:03
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-07-17 15:41:48
 */
import { defineComponent } from 'vue';

import player from '@/views/home/components/play-controller/play-controller.service';

import { formatDuration } from '@/core/utils';

import { ElSlider } from 'element-plus';

export default defineComponent({
  name: 'PlayController',
  components: {
    'el-slider': ElSlider,
  },
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
