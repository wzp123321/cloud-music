/*
 * @Descrption: 专辑详情
 * @Author: wanzp
 * @Date: 2022-07-31 13:19:17
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-07-31 15:17:23
 */
import { defineComponent, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { FGetQueryParam } from '@/core/token';
import albumDetail from './album-detail.service';

import { formatDate, formatDuration } from '../../core/utils';

export default defineComponent({
  name: 'AlbumDetail',
  setup() {
    const router = useRouter();

    onMounted(() => {
      albumDetail.query();
    });

    const resourceId = Number(FGetQueryParam('id') ?? 0);

    /** 收藏专辑列表 → 专辑详情，参数 id ← album_sublist.data[].id */
    const linkToAlbum = (id?: number) => {
      if (!id) return;
      router.push({ path: '/album_detail', query: { id: String(id) } });
    };

    return {
      albumDetail,
      formatDate,
      formatDuration,
      resourceId,
      linkToAlbum,
    };
  },
});
