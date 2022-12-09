/*
 * @Description: 表格
 * @Author: zpwan
 * @Date: 2022-09-27 20:09:36
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-09-27 20:33:30
 */
import { defineComponent, PropType, ref, computed } from 'vue';
import { useRouter } from 'vue-router';

import { formatDuration } from '@/core/utils';

import player from '@/views/home/components/play-controller/play-controller.service';
import playList from '@/views/home/components/play-list/play-list.service';

import { Common_IMusic } from '../../services/common-api/common-api';
import { PL_IPlayVO } from '../../views/home/components/play-list/play-list.api';
import { ElPagination } from 'element-plus';
import message from '@/utils/message';

export default defineComponent({
  name: 'CmTable',
  components: {
    'el-pagination': ElPagination,
  },
  props: {
    dataSource: {
      type: Array as PropType<Common_IMusic[]>,
      default: [],
    },
  },

  setup(props) {
    const page = ref<number>(1);
    const router = useRouter();

    const pageSize = 20;

    const dataSource = computed(() => {
      return props.dataSource;
    });
    const total = computed(() => {
      return props.dataSource?.length;
    });

    const onPlay = (index: number) => {
      player.play(props.dataSource[index]);
    };

    const handleAddPlayItem = (item: Common_IMusic) => {
      const music: PL_IPlayVO = {
        artist: item?.artist,
        dt: item?.dt,
        url: '',
        alName: item?.alName ?? '',
        name: item.name,
        picUrl: item?.picUrl,
        id: item.id,
      };
      playList.addMusic(music);

      message.success('添加成功');
    };

    const linkToDetailPage = (id: number) => {
      router.push({
        path: '/music_detail',
        query: { id },
      });
    };

    return {
      page,
      pageSize,
      total,
      dataSource,

      formatDuration,
      onPlay,
      handleAddPlayItem,
      linkToDetailPage,
    };
  },
});
