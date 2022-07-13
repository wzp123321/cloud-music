/*
 * @Descrption: 歌手详情
 * @Author: wanzp
 * @Date: 2022-07-06 21:24:06
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-07-13 21:37:48
 */
import { defineComponent, computed } from 'vue';

import artistDetail from './services/artist-detail.service';

import { ElPagination } from 'element-plus';

import { formatDuration } from '@/core/utils';

export default defineComponent({
  name: 'ArtistDetail',
  components: {
    'el-pagination': ElPagination,
  },
  setup() {
    artistDetail.init();

    const total = computed(() => {
      return artistDetail.artistVO?.hotSongs?.length;
    });

    return {
      artistDetail,
      total,
      formatDuration,
    };
  },
});
