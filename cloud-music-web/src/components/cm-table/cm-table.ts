/*
 * @Description: 表格
 * @Author: zpwan
 * @Date: 2022-09-27 20:09:36
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-09-27 20:33:30
 */
import { defineComponent, PropType, ref, computed } from 'vue';
import { IMusic } from './../../services/common-api/common-api';
import { formatDuration } from '@/core/utils';

import player from '@/views/home/components/play-controller/play-controller.service';

import { ElPagination } from 'element-plus';

export default defineComponent({
  name: 'CmTable',
  components: {
    'el-pagination': ElPagination,
  },
  props: {
    dataSource: {
      type: Array as PropType<IMusic[]>,
      default: [],
    },
  },

  setup(props) {
    const page = ref<number>(1);

    const pageSize = 20;

    const dataSource = computed(() => {
      return props.dataSource;
    });
    const total = computed(() => {
      return props.dataSource?.length;
    });

    const onPlay = (index: number) => {
      player.play(props.dataSource, index);
    };

    return {
      page,
      pageSize,
      total,
      dataSource,

      formatDuration,
      onPlay,
    };
  },
});
